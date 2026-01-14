'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, FileText, User, CreditCard, ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import WizardStepIndicator from '@/components/wizard/WizardStepIndicator';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any;
    _originalLocalStorage?: Storage;
  }
}

// Load Google Maps Script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window.google !== 'undefined' && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
};

type WizardStep = 'signature' | 'profile' | 'payment' | 'password' | 'complete';

interface EnrollmentWizardData {
  id: string;
  user_id?: string | null; // Existing user ID (null for new users)
  product_name: string;
  product_type: string;
  total_amount: number;
  currency: string;
  requires_signature: boolean;
  signature_template_id?: string;
  signature_status?: string;
  docusign_envelope_id?: string;
  user_profile_complete: boolean;
  payment_required: boolean;
  payment_complete?: boolean;
  wizard_profile_data?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export default function EnrollmentWizardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const enrollmentId = params.id as string;
  const enrollmentToken = searchParams.get('token');
  const { t, direction } = useLanguage();
  const isRTL = direction === 'rtl';

  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<EnrollmentWizardData | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>('signature');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [initialStepDetermined, setInitialStepDetermined] = useState(false);

  // Wizard state - keep all data in memory until completion
  const [wizardData, setWizardData] = useState({
    profileCompleted: false,
    signatureCompleted: false,
    paymentCompleted: false,
    passwordCompleted: false,
    profile: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: ''
    },
    password: '',
    docusignEnvelopeId: null as string | null
  });

  // Calculate completed steps for step indicator
  const getCompletedSteps = (): WizardStep[] => {
    const completed: WizardStep[] = [];
    if (wizardData.profileCompleted) completed.push('profile');
    if (wizardData.signatureCompleted) completed.push('signature');
    if (wizardData.paymentCompleted) completed.push('payment');
    if (wizardData.passwordCompleted) completed.push('password');
    return completed;
  };

  // Alias for backward compatibility
  const profileData = wizardData.profile;
  const setProfileData = (data: any) => {
    setWizardData(prev => ({
      ...prev,
      profile: typeof data === 'function' ? data(prev.profile) : data
    }));
  };

  // Google Maps state
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null);

  // Validation state
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailValidated, setEmailValidated] = useState(false); // Email validated as available
  const [emailExistsDetected, setEmailExistsDetected] = useState(false); // Existing user email detected

  // Refs
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const isReturningFromDocuSignRef = useRef<boolean>(false);
  const isReturningFromPaymentRef = useRef<boolean>(false);
  const userLinkingCompleteRef = useRef<boolean>(false); // Track if user linking finished

  useEffect(() => {
    const initializeEnrollment = async () => {
      if (!enrollmentToken) {
        setError('Missing enrollment token. Please use the invitation link.');
        setLoading(false);
        return;
      }

      // CRITICAL: Link logged-in user to enrollment FIRST, before loading enrollment data
      // This ensures enrollment.user_id is set when step determination runs
      console.log('[Wizard] 🔍 Checking for logged-in user...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      console.log('[Wizard] Auth check result:', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        authError: authError?.message
      });

      if (user) {
        console.log('[Wizard] 🔗 Logged-in user detected - linking user to enrollment...', {
          userId: user.id,
          email: user.email
        });

        try {
          const response = await fetch(`/api/enrollments/token/${enrollmentToken}/link-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          const data = await response.json();

          if (response.ok) {
            console.log('[Wizard] ✅ User linked successfully:', data);
            // Add extra delay to ensure database is updated
            console.log('[Wizard] ⏳ Waiting 500ms for database update...');
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('[Wizard] ✅ Database update wait complete');
          } else {
            console.error('[Wizard] ❌ Failed to link user:', data);
          }
        } catch (err) {
          console.error('[Wizard] ❌ Error linking user:', err);
        }
      } else {
        console.log('[Wizard] ℹ️ No logged-in user detected - proceeding as guest');
      }

      // Check if returning from DocuSign or Payment
      const urlParams = new URLSearchParams(window.location.search);
      const isReturningFromDocuSign = urlParams.get('docusign') === 'complete';
      const isReturningFromPayment = urlParams.get('payment') === 'complete';

      console.log('[Wizard] Page loaded with URL:', window.location.href);
      console.log('[Wizard] URL params:', Object.fromEntries(urlParams.entries()));
      console.log('[Wizard] isReturningFromDocuSign:', isReturningFromDocuSign);
      console.log('[Wizard] isReturningFromPayment:', isReturningFromPayment);

      if (isReturningFromDocuSign) {
        // Set ref to true so other effects know we're returning from DocuSign
        isReturningFromDocuSignRef.current = true;
        console.log('[Wizard] ✅ SET isReturningFromDocuSignRef = true');

        // Start with retry=1 to immediately trigger stale data detection
        // This handles PostgREST connection pooling cache issues
        console.log('[Wizard] Returned from DocuSign, starting with retry mode to handle PostgREST cache...');
        fetchEnrollmentData(1); // Start with retry=1, not 0!

        // Sync signature status from DocuSign immediately (don't wait for webhook)
        syncSignatureStatus();

        // Clean up URL parameter after processing
        setTimeout(() => {
          urlParams.delete('docusign');
          const newSearch = urlParams.toString();
          const newUrl = `${window.location.pathname}?${newSearch}`;
          window.history.replaceState({}, '', newUrl);
          console.log('[Wizard] Cleaned up docusign URL parameter');
        }, 100);
      } else if (isReturningFromPayment) {
        console.log('[Wizard] ✅ Returned from payment page - auto-completing enrollment');

        // Set ref to true so other effects know we're returning from payment
        isReturningFromPaymentRef.current = true;

        // Mark payment as complete in memory
        setWizardData(prev => ({
          ...prev,
          paymentCompleted: true
        }));

        // Move to complete step and prevent re-determination
        setCurrentStep('complete');
        setInitialStepDetermined(true);

        // Fetch updated enrollment data
        fetchEnrollmentData(0);

        // Auto-complete will be triggered by useEffect when currentStep becomes 'complete'
        // See the auto-completion logic below

        // Clean up URL parameter
        setTimeout(() => {
          urlParams.delete('payment');
          const newSearch = urlParams.toString();
          const newUrl = `${window.location.pathname}?${newSearch}`;
          window.history.replaceState({}, '', newUrl);
          console.log('[Wizard] Cleaned up payment URL parameter');
        }, 100);
      } else {
        // Normal load - start with retry=0
        fetchEnrollmentData(0);
      }
    };

    initializeEnrollment();
  }, [enrollmentId, enrollmentToken]);

  // Track if profile data has been loaded to avoid overwriting user input
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);

  useEffect(() => {
    if (enrollment) {
      // Only auto-determine step on initial load, not on every enrollment update
      // This prevents the wizard from jumping steps after user actions (payment, signature, etc.)
      if (!initialStepDetermined) {
        determineCurrentStep();
        setInitialStepDetermined(true);
      }

      // Load existing profile data ONLY on initial load, not on every enrollment update
      // Load into wizardData.profile (memory-based wizard)
      if (enrollment.wizard_profile_data && !profileDataLoaded) {
        const profileFromDb = {
          first_name: enrollment.wizard_profile_data.first_name || '',
          last_name: enrollment.wizard_profile_data.last_name || '',
          email: enrollment.wizard_profile_data.email || '',
          phone: enrollment.wizard_profile_data.phone || '',
          address: enrollment.wizard_profile_data.address || ''
        };

        // Check if profile is FULLY complete (all required fields filled)
        // If only email exists, profile is NOT complete (user needs to fill it out)
        const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'address'];
        const isProfileComplete = requiredFields.every(field => {
          const value = profileFromDb[field as keyof typeof profileFromDb];
          return value !== null && value !== undefined && value !== '';
        });

        console.log('[Wizard] Loading profile data from wizard_profile_data:', profileFromDb);
        console.log('[Wizard] Profile complete:', isProfileComplete);

        // Update wizardData.profile with data from database
        // Mark profile as complete ONLY if ALL required fields are filled
        setWizardData(prev => ({
          ...prev,
          profile: profileFromDb,
          profileCompleted: isProfileComplete // Only mark complete if all fields are present
        }));

        // If user_id is set (existing user) OR profile has email, skip email validation
        // Existing users don't need to validate email again
        if (enrollment.user_id || profileFromDb.email) {
          console.log('[Wizard] Skipping email validation - existing user or email already set');
          setEmailValidated(true);
        }

        setProfileDataLoaded(true);
      }

      // Sync database status with in-memory wizard state
      // This is needed when user returns from DocuSign or payment page
      // IMPORTANT: Don't overwrite in-memory state if user just returned from DocuSign or payment
      // The webhook/database may not have updated yet
      const isReturningFromDocuSign = isReturningFromDocuSignRef.current;
      const isReturningFromPayment = isReturningFromPaymentRef.current;

      setWizardData(prev => {
        const newSignatureCompleted = isReturningFromDocuSign
          ? prev.signatureCompleted
          : (enrollment.signature_status === 'completed');

        const newPaymentCompleted = isReturningFromPayment
          ? prev.paymentCompleted
          : (enrollment.payment_complete || false);

        console.log('[Wizard] Syncing wizard state:', {
          isReturningFromDocuSign,
          isReturningFromPayment,
          prevSignatureCompleted: prev.signatureCompleted,
          prevPaymentCompleted: prev.paymentCompleted,
          dbSignatureStatus: enrollment.signature_status,
          dbPaymentComplete: enrollment.payment_complete,
          newSignatureCompleted,
          newPaymentCompleted,
          willPreserveSignature: isReturningFromDocuSign,
          willPreservePayment: isReturningFromPayment
        });

        return {
          ...prev,
          // If returning from DocuSign, preserve the in-memory signatureCompleted state
          // If returning from payment, preserve the in-memory paymentCompleted state
          // Otherwise sync from database
          signatureCompleted: newSignatureCompleted,
          paymentCompleted: newPaymentCompleted
        };
      });
    }
  }, [enrollment, profileDataLoaded]);

  // Re-evaluate current step whenever wizard state changes
  useEffect(() => {
    if (enrollment) {
      determineCurrentStep();
    }
  }, [wizardData.profileCompleted, wizardData.signatureCompleted, wizardData.paymentCompleted, wizardData.passwordCompleted]);

  // Auto-complete enrollment when returning from successful payment
  // For EXISTING users: Auto-complete immediately and redirect to login page
  // For NEW users: Show password step first, then complete
  useEffect(() => {
    const isExistingUser = !!enrollment?.user_id;

    if (currentStep === 'complete' && isReturningFromPaymentRef.current && !processing && isExistingUser) {
      console.log('[Wizard] Auto-completing enrollment for existing user after payment...');
      const timer = setTimeout(() => {
        handleComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, processing, enrollment?.user_id]);

  // Load Google Maps Script on mount
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'your_google_maps_api_key') {
      console.warn('[Google Maps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in environment variables');
      setGoogleMapsError('Google Maps API key not configured.');
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        setGoogleMapsLoaded(true);
        setGoogleMapsError(null);
      })
      .catch((error) => {
        console.error('[Google Maps] Failed to load script:', error);
        setGoogleMapsError('Failed to load Google Maps.');
      });
  }, []);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (currentStep !== 'profile') {
      return;
    }

    if (!googleMapsLoaded) {
      return;
    }

    if (!addressInputRef.current) {
      return;
    }

    if (typeof window.google === 'undefined' || !window.google.maps) {
      return;
    }

    try {
      // Clear any existing autocomplete
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        fields: ['formatted_address', 'name', 'address_components', 'geometry']
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();

        if (place && place.formatted_address) {
          setProfileData((prev: any) => ({ ...prev, address: place.formatted_address || '' }));
        }
      });
    } catch (error) {
      console.error('[Google Maps] Failed to initialize autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current && typeof window.google !== 'undefined') {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [currentStep, googleMapsLoaded]);

  const fetchEnrollmentData = async (retryCount = 0, maxRetries = 3) => {
    try {
      // Use token-based endpoint for unauthenticated access
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = `_=${Date.now()}_${retryCount}`;
      const response = await fetch(`/api/enrollments/token/${enrollmentToken}/wizard-status?${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 410) {
          throw new Error('Enrollment invitation has expired. Please contact support.');
        }
        throw new Error('Failed to fetch enrollment data');
      }

      const data = await response.json();

      // Check if wizard_profile_data is incomplete (stale cache from PostgREST)
      // After returning from DocuSign, we expect phone and address to be saved
      // If they're missing, it means we're seeing stale cached data
      const profileData = data.wizard_profile_data || {};
      const hasPhone = profileData.phone && profileData.phone !== '';
      const hasAddress = profileData.address && profileData.address !== '';
      const isProfileIncomplete = !hasPhone || !hasAddress;

      // If this is a retry and profile is still incomplete, retry with exponential backoff
      if (retryCount > 0 && retryCount < maxRetries && isProfileIncomplete && data.wizard_profile_data) {
        // Exponential backoff: 500ms, 1s, 2s, 4s, 8s, etc.
        const backoffDelay = Math.min(500 * Math.pow(2, retryCount - 1), 10000); // Cap at 10 seconds
        console.log(`[Wizard] Retry ${retryCount}/${maxRetries}: wizard_profile_data incomplete (PostgREST cache issue), retrying in ${backoffDelay}ms...`, {
          hasPhone,
          hasAddress,
          profileData
        });
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return fetchEnrollmentData(retryCount + 1, maxRetries);
      }

      // Log if we gave up retrying
      if (retryCount > 0 && isProfileIncomplete) {
        console.error(`[Wizard] FAILED after ${retryCount} retries - PostgREST still serving stale/incomplete data. This is a known issue with Supabase connection pooling.`, {
          profileData
        });
      }

      setEnrollment(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if email already exists in the system
  // Returns true if email exists (user should login), false if available (can proceed)
  const checkEmailExists = async (email: string): Promise<boolean> => {
    console.log('[Wizard] ========== EMAIL CHECK START ==========');

    // Skip check if user is currently logged in (they're returning from login)
    // Check actual auth state, not just enrollment.user_id
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('[Wizard] ❌ Skipping email check - user is currently logged in');
      return false;
    }

    // Validate email format first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[Wizard] ❌ Skipping email check - invalid format');
      return false;
    }

    try {
      console.log('[Wizard] 📧 Checking if email exists:', email);
      const checkResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log('[Wizard] ✅ Email check response:', checkData);
        return checkData.exists || false;
      } else {
        console.error('[Wizard] ❌ Email check failed:', checkResponse.status);
      }
    } catch (error) {
      console.error('[Wizard] ❌ Error checking email:', error);
    }

    console.log('[Wizard] ========== EMAIL CHECK END ==========');
    return false;
  };

  // Handle manual step navigation (for back button)
  const handleStepNavigation = (targetStep: WizardStep) => {
    console.log('[Wizard] Manual navigation to step:', targetStep);
    setCurrentStep(targetStep);
    setError(null);
  };

  // Get the previous step in the workflow
  const getPreviousStep = (): WizardStep | null => {
    if (!enrollment) return null;

    const isExistingUser = !!enrollment.user_id;
    const steps: WizardStep[] = [];

    if (!isExistingUser) steps.push('profile');
    if (enrollment.requires_signature) steps.push('signature');
    if (enrollment.payment_required) steps.push('payment');
    if (!isExistingUser) steps.push('password'); // Only new users need to create password
    steps.push('complete');

    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      return steps[currentIndex - 1];
    }
    return null;
  };

  // Navigate back to previous step
  const handleBack = () => {
    const prevStep = getPreviousStep();
    if (prevStep) {
      handleStepNavigation(prevStep);
    }
  };

  // Get the next step in the workflow
  const getNextStep = (): WizardStep | null => {
    if (!enrollment) return null;

    const isExistingUser = !!enrollment.user_id;
    const steps: WizardStep[] = [];

    if (!isExistingUser) steps.push('profile');
    if (enrollment.requires_signature) steps.push('signature');
    if (enrollment.payment_required) steps.push('payment');
    if (!isExistingUser) steps.push('password'); // Only new users need to create password
    steps.push('complete');

    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      return steps[currentIndex + 1];
    }
    return null;
  };

  // Navigate forward to next step
  const handleNext = () => {
    const nextStep = getNextStep();
    if (nextStep) {
      console.log('[Wizard] Advancing to next step:', nextStep);
      handleStepNavigation(nextStep);
    }
  };

  const determineCurrentStep = () => {
    if (!enrollment) return;

    console.log('[Wizard] Determining current step with state:', {
      userId: enrollment.user_id,
      profileCompleted: wizardData.profileCompleted,
      signatureCompleted: wizardData.signatureCompleted,
      paymentCompleted: wizardData.paymentCompleted,
      passwordCompleted: wizardData.passwordCompleted,
      requiresSignature: enrollment.requires_signature,
      paymentRequired: enrollment.payment_required
    });

    // TWO ENROLLMENT FLOWS:
    // 1. Existing user (user_id set): Skip profile and password steps, user already has account
    // 2. New user (user_id NULL): Show profile step, then password step to create account

    const isExistingUser = !!enrollment.user_id;
    console.log('[Wizard] 🔍 isExistingUser check:', {
      user_id: enrollment.user_id,
      isExistingUser,
      willSkipProfile: isExistingUser,
      willSkipPassword: isExistingUser
    });

    // Use in-memory wizard state instead of database to avoid cache issues
    // Step 1: Profile completion (ONLY for new users - existing users skip this)
    if (!isExistingUser && !wizardData.profileCompleted) {
      console.log('[Wizard] → Setting step to: profile (NEW USER)');
      setCurrentStep('profile');
      return;
    }

    // Step 2: Signature (if required) - needs profile data
    if (enrollment.requires_signature && !wizardData.signatureCompleted) {
      console.log('[Wizard] → Setting step to: signature');
      setCurrentStep('signature');
      return;
    }

    // Step 3: Payment (if required)
    if (enrollment.payment_required && !wizardData.paymentCompleted) {
      console.log('[Wizard] → Setting step to: payment');
      setCurrentStep('payment');
      return;
    }

    // Step 4: Password creation (ONLY for new users - existing users skip this)
    if (!isExistingUser && !wizardData.passwordCompleted) {
      console.log('[Wizard] → Setting step to: password (CREATE ACCOUNT)');
      setCurrentStep('password');
      return;
    }

    // All steps complete
    console.log('[Wizard] → Setting step to: complete');
    setCurrentStep('complete');
  };

  const handleSignatureStep = async () => {
    setProcessing(true);
    try {
      console.log('[Wizard] Sending profile data with signature request:', wizardData.profile);

      // Use token-based endpoint to create DocuSign envelope
      // Send profile data in request body (memory-based approach)
      const response = await fetch(`/api/enrollments/token/${enrollmentToken}/send-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: wizardData.profile
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send contract');
      }

      const data = await response.json();

      // Store envelope ID in memory for later
      if (data.envelope_id) {
        setWizardData(prev => ({
          ...prev,
          docusignEnvelopeId: data.envelope_id
        }));
      }

      // Redirect to DocuSign signing URL
      if (data.signing_url) {
        window.location.href = data.signing_url;
      }
    } catch (err: any) {
      console.error('Signature step error:', err);
      setError(err.message);
      setProcessing(false);
    }
  };

  const handleSaveProfile = async () => {
    setProcessing(true);
    // Clear all validation errors
    setPhoneError(null);
    setEmailError(null);
    setFirstNameError(null);
    setLastNameError(null);
    setAddressError(null);

    console.log('[Wizard] Validating and saving profile to memory:', profileData);

    try {
      let hasError = false;

      // Validate required fields
      if (!profileData.first_name) {
        setFirstNameError(t('enrollment.wizard.profile.first_name.required', 'First name is required'));
        hasError = true;
      }
      if (!profileData.last_name) {
        setLastNameError(t('enrollment.wizard.profile.last_name.required', 'Last name is required'));
        hasError = true;
      }
      if (!profileData.email) {
        setEmailError(t('enrollment.wizard.profile.email.required', 'Email is required'));
        hasError = true;
      }
      if (!profileData.phone) {
        setPhoneError(t('enrollment.wizard.profile.phone.required', 'Phone is required'));
        hasError = true;
      }
      if (!profileData.address) {
        setAddressError(t('enrollment.wizard.profile.address.required', 'Address is required'));
        hasError = true;
      }

      if (hasError) {
        console.error('[Wizard] Validation failed - missing fields:', profileData);
        setProcessing(false);
        return; // Don't throw - just return to stay on the form
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        setEmailError(t('enrollment.wizard.profile.email.invalid', 'Please enter a valid email address'));
        setProcessing(false);
        return; // Don't throw - just return to stay on the form
      }

      // Validate phone number format using international validation
      if (!isValidPhoneNumber(profileData.phone)) {
        setPhoneError(t('enrollment.wizard.profile.phone.invalid', 'Please enter a valid phone number with country code'));
        setProcessing(false);
        return; // Don't throw - just return to stay on the form
      }

      // Save to memory only - no database call!
      setWizardData(prev => ({
        ...prev,
        profileCompleted: true
      }));

      console.log('[Wizard] Profile saved to memory:', {
        profileCompleted: true,
        profile: profileData
      });

      // Explicitly navigate to next step after saving profile
      handleNext();
    } catch (err: any) {
      console.error('[Wizard] Profile validation error:', err);
      // Only set critical errors here, not validation errors
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const syncSignatureStatus = async () => {
    try {
      console.log('[Wizard] Syncing signature status from DocuSign...');

      // Call the API to sync signature status from DocuSign
      const response = await fetch(`/api/enrollments/token/${enrollmentToken}/sync-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Wizard] Failed to sync signature:', errorData);
        // Don't throw - just continue with current state
        return;
      }

      const data = await response.json();
      console.log('[Wizard] Signature sync result:', data);

      // Mark as completed in memory if DocuSign confirms completion
      if (data.signature_status === 'completed') {
        setWizardData(prev => ({
          ...prev,
          signatureCompleted: true
        }));

        console.log('[Wizard] Signature confirmed complete - moving to next step');

        // Only navigate to next step if we're currently on the signature step
        // Don't navigate if we're already past it (e.g., on payment or complete)
        if (currentStep === 'signature') {
          handleNext();
        }
      } else {
        console.log('[Wizard] Signature not yet completed, status:', data.signature_status);
      }
    } catch (err: any) {
      console.error('[Wizard] Signature sync error:', err);
    }
  };

  const handlePaymentStep = () => {
    // Redirect to public wizard payment page with token
    router.push(`/enroll/wizard/${enrollmentId}/pay?token=${enrollmentToken}`);
  };

  const handlePasswordSubmit = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Validate password
      if (!wizardData.password || wizardData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        setProcessing(false);
        return;
      }

      // Validate password confirmation
      if (wizardData.password !== confirmPassword) {
        setError('Passwords do not match. Please try again.');
        setProcessing(false);
        return;
      }

      // Mark password step as complete and move to final step
      setWizardData(prev => ({
        ...prev,
        passwordCompleted: true
      }));

      console.log('[Wizard] Password step completed, moving to welcome screen');

      // Move to complete step
      handleNext();
    } catch (err: any) {
      console.error('[Wizard] Password validation error:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    setProcessing(true);
    try {
      // Validate we have enrollment token
      if (!enrollmentToken) {
        console.error('[Wizard] No enrollment token found in URL');
        throw new Error('Missing enrollment token. Please use the link from your enrollment invitation email.');
      }

      // TWO ENROLLMENT FLOWS:
      // 1. Existing user (user_id set): Don't create account, just activate enrollment
      // 2. New user (user_id NULL): Create account with password from password step

      const isExistingUser = !!enrollment?.user_id;

      console.log('[Wizard] Completing enrollment:', {
        enrollmentId,
        enrollmentToken: enrollmentToken.substring(0, 10) + '...',
        isExistingUser,
        hasPassword: !!wizardData.password,
        hasProfile: !!wizardData.profile,
        profile: wizardData.profile
      });

      // Send ALL wizard data to complete endpoint - single database write!
      const response = await fetch(`/api/enrollments/token/${enrollmentToken}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: isExistingUser ? undefined : wizardData.password, // Only send password for new users
          // Include all wizard data for single write
          profile: wizardData.profile,
          docusignEnvelopeId: wizardData.docusignEnvelopeId,
          isExistingUser // Tell endpoint which flow to use
        })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('[Wizard] Complete endpoint error:', data);
        throw new Error(data.error || 'Failed to complete enrollment');
      }

      const data = await response.json();
      console.log('[Wizard] Enrollment completed successfully:', data);

      // Check if user is currently logged in
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!isExistingUser) {
        // NEW USER: Auto-login with the new session
        if (data.session) {
          await supabase.auth.setSession(data.session);
        }
        console.log('[Wizard] Redirecting new user to dashboard');
        router.push('/dashboard?enrollment=complete');
      } else if (currentUser) {
        // EXISTING USER WHO IS LOGGED IN: Go directly to dashboard
        console.log('[Wizard] Redirecting logged-in existing user to dashboard');
        router.push('/dashboard?enrollment=complete');
      } else {
        // EXISTING USER WHO IS NOT LOGGED IN: Redirect to login
        console.log('[Wizard] Redirecting non-logged-in existing user to login');
        const enrollmentEmail = enrollment?.wizard_profile_data?.email || '';
        router.push(`/login?email=${encodeURIComponent(enrollmentEmail)}&message=${encodeURIComponent('Enrollment complete! Please login to access your dashboard.')}`);
      }
    } catch (err: any) {
      console.error('[Wizard] Complete error:', err);
      setError(err.message);
      setProcessing(false);
    }
  };

  const getStepProgress = (): number => {
    const steps: WizardStep[] = [];

    const isExistingUser = !!enrollment?.user_id;

    // ONLY include profile and password steps for new users
    if (!isExistingUser) {
      steps.push('profile');
    }
    if (enrollment?.requires_signature) steps.push('signature');
    if (enrollment?.payment_required && enrollment?.total_amount > 0) steps.push('payment');
    if (!isExistingUser) {
      steps.push('password');
    }
    steps.push('complete');

    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const getStepIcon = (step: WizardStep) => {
    const iconClass = "h-5 w-5";
    switch (step) {
      case 'signature':
        return <FileText className={iconClass} />;
      case 'profile':
        return <User className={iconClass} />;
      case 'payment':
        return <CreditCard className={iconClass} />;
      case 'password':
        return <Lock className={iconClass} />;
      case 'complete':
        return <CheckCircle2 className={iconClass} />;
    }
  };

  const getStepTitle = (step: WizardStep): string => {
    switch (step) {
      case 'signature':
        return t('enrollment.wizard.signature.title', 'Sign Agreement');
      case 'profile':
        return t('enrollment.wizard.profile.title', 'Complete Profile');
      case 'payment':
        return t('enrollment.wizard.payment.title', 'Payment');
      case 'password':
        return t('enrollment.wizard.password.title', 'Create Account');
      case 'complete':
        return t('enrollment.wizard.complete.title', 'Welcome!');
    }
  };

  const getStepDescription = (step: WizardStep): string => {
    switch (step) {
      case 'signature':
        return t('enrollment.wizard.signature.description', 'Please sign the enrollment agreement to continue');
      case 'profile':
        return t('enrollment.wizard.profile.description', 'Complete your profile information');
      case 'payment':
        return t('enrollment.wizard.payment.description', 'Complete payment to activate your enrollment');
      case 'password':
        return t('enrollment.wizard.password.description', 'Create a password to secure your account');
      case 'complete':
        return t('enrollment.wizard.complete.description', 'Your enrollment is complete!');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'signature':
        return (
          <div className="space-y-4">
            <Alert className="border-primary/20 bg-primary/5">
              <FileText className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground" suppressHydrationWarning>
                {t('enrollment.wizard.signature.info', 'You need to sign the enrollment agreement before proceeding.')}
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              {getPreviousStep() && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBack}
                  disabled={processing}
                  className="flex-1"
                  suppressHydrationWarning
                >
                  <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2 rtl:rotate-180" />
                  {t('enrollment.wizard.back', 'Back')}
                </Button>
              )}
              <Button
                size="lg"
                className="flex-1"
                onClick={handleSignatureStep}
                disabled={processing}
                suppressHydrationWarning
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                    {t('enrollment.wizard.signature.sending', 'Opening signature...')}
                  </>
                ) : (
                  <>
                    {t('enrollment.wizard.signature.button', 'Sign Agreement')}
                    <ArrowRight className="h-4 w-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <Alert className="border-primary/20 bg-primary/5">
              <User className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground" suppressHydrationWarning>
                {t('enrollment.wizard.profile.info', 'Please complete your profile to continue with enrollment.')}
              </AlertDescription>
            </Alert>

            {/* Profile Form - Email First (Full Width) */}
            <div className="space-y-4">
              {/* Email Field - Full Width at Top */}
              <div className="space-y-2">
                <Label htmlFor="email" suppressHydrationWarning>
                  {t('enrollment.wizard.profile.email', 'Email')} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => {
                    setProfileData({ ...profileData, email: e.target.value });
                    setEmailValidated(false); // Reset validation on change
                    setEmailError(null); // Clear error on change
                    setEmailExistsDetected(false); // Clear existing user flag
                  }}
                  onBlur={async (e) => {
                    const emailValue = e.target.value.trim();
                    if (!emailValue) {
                      setEmailError(null);
                      setEmailExistsDetected(false);
                      return;
                    }

                    // Validate email format
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(emailValue)) {
                      setEmailError(t('enrollment.wizard.profile.email.invalid', 'Please enter a valid email address'));
                      setEmailValidated(false);
                      setEmailExistsDetected(false);
                      return;
                    }

                    // Check if email already exists
                    const exists = await checkEmailExists(emailValue);
                    if (exists) {
                      setEmailError(t('enrollment.wizard.profile.email.exists', 'An account with this email already exists. Please login to enroll.'));
                      setEmailValidated(false);
                      setEmailExistsDetected(true); // Mark that existing user was detected
                    } else {
                      setEmailError(null);
                      setEmailValidated(true); // Email is available, enable other fields
                      setEmailExistsDetected(false);
                    }
                  }}
                  required
                  className={emailError ? 'border-destructive' : ''}
                />
                {emailError && (
                  <div className="text-xs text-destructive mt-1.5">
                    {emailError.includes('login') || emailError.includes('התחבר') ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span>{emailError.split('.')[0]}.</span>
                        <button
                          type="button"
                          onClick={() => {
                            // Store enrollment info for return after login
                            sessionStorage.setItem('enrollment_return_id', enrollmentId);
                            sessionStorage.setItem('enrollment_return_token', enrollmentToken || '');
                            window.location.href = '/login';
                          }}
                          className="underline font-medium hover:text-destructive/80"
                        >
                          {t('enrollment.wizard.profile.email.loginLink', 'Click here to login')}
                        </button>
                      </div>
                    ) : (
                      <p>{emailError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Name Fields - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" suppressHydrationWarning>
                    {t('enrollment.wizard.profile.first_name', 'First Name')} *
                  </Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={profileData.first_name}
                    onChange={(e) => {
                      setProfileData({ ...profileData, first_name: e.target.value });
                      if (firstNameError) setFirstNameError(null);
                    }}
                    disabled={!emailValidated}
                    required
                    className={firstNameError ? 'border-destructive' : ''}
                  />
                  {firstNameError && (
                    <p className="text-xs text-destructive mt-1.5">
                      {firstNameError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" suppressHydrationWarning>
                    {t('enrollment.wizard.profile.last_name', 'Last Name')} *
                  </Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={profileData.last_name}
                    onChange={(e) => {
                      setProfileData({ ...profileData, last_name: e.target.value });
                      if (lastNameError) setLastNameError(null);
                    }}
                    disabled={!emailValidated}
                    required
                    className={lastNameError ? 'border-destructive' : ''}
                  />
                  {lastNameError && (
                    <p className="text-xs text-destructive mt-1.5">
                      {lastNameError}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone and Address - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" suppressHydrationWarning>
                    {t('enrollment.wizard.profile.phone', 'Phone')} *
                  </Label>
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={profileData.phone}
                    onChange={(value) => {
                      // Limit to 17 characters (max for international phone numbers)
                      const maxLength = 17;
                      if (value && value.length > maxLength) {
                        setPhoneError(`Phone number is too long (max ${maxLength} characters)`);
                        return;
                      }

                      setProfileData({ ...profileData, phone: value || '' });

                      // Real-time validation
                      if (value && value.length > 5) {
                        if (!isValidPhoneNumber(value)) {
                          setPhoneError(t('enrollment.wizard.profile.phone.invalid.simple', 'Please enter a valid phone number'));
                        } else {
                          setPhoneError(null);
                        }
                      } else if (!value) {
                        setPhoneError(null);
                      }
                    }}
                    disabled={!emailValidated}
                    placeholder="+1 234 567 8900"
                    className="phone-input-wizard"
                    smartCaret={true}
                    numberInputProps={{
                      maxLength: 17
                    }}
                  />
                <style jsx global>{`
                  .phone-input-wizard {
                    width: 100%;
                    padding: 0.625rem 0.75rem;
                    border: 1px solid hsl(var(--border));
                    border-radius: calc(var(--radius) - 2px);
                    font-size: var(--font-size-sm);
                    font-family: var(--font-family-primary);
                    background-color: hsl(var(--background));
                    color: hsl(var(--text-body));
                    transition: all 0.2s ease;
                  }
                  .phone-input-wizard .PhoneInputInput {
                    padding: 0;
                    border: none;
                    outline: none;
                    font-size: var(--font-size-sm);
                    font-family: var(--font-family-primary);
                    background-color: transparent;
                    color: hsl(var(--text-body));
                  }
                  .phone-input-wizard .PhoneInputInput:focus {
                    outline: none;
                  }
                  .phone-input-wizard {
                    display: flex;
                    align-items: center;
                  }
                  .phone-input-wizard .PhoneInputCountry {
                    padding-right: 0.5rem;
                  }
                `}</style>
                {phoneError && (
                  <p className="text-xs text-destructive mt-1.5">
                    {phoneError}
                  </p>
                )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" suppressHydrationWarning>
                    {t('enrollment.wizard.profile.address', 'Address')} *
                  </Label>
                  <Input
                    ref={addressInputRef}
                    id="address"
                    type="text"
                    value={profileData.address}
                    onChange={(e) => {
                      setProfileData({ ...profileData, address: e.target.value });
                      if (addressError) setAddressError(null);
                    }}
                    disabled={!emailValidated}
                    placeholder={t('enrollment.wizard.profile.address.placeholder', 'Start typing your address...')}
                    dir="ltr"
                    className={`text-left [direction:ltr] [unicode-bidi:bidi-override] ${addressError ? 'border-destructive' : ''}`}
                    style={{ direction: 'ltr', textAlign: 'left' }}
                    required
                  />
                  {addressError && (
                    <p className="text-xs text-destructive mt-1.5">
                      {addressError}
                    </p>
                  )}
                  {googleMapsError && !addressError && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{googleMapsError}</span>
                    </p>
                  )}
                  {!googleMapsLoaded && !googleMapsError && !addressError && (
                    <p className="text-xs text-muted-foreground mt-1.5" suppressHydrationWarning>
                      {t('enrollment.wizard.profile.address.loading', 'Loading address autocomplete...')}
                    </p>
                  )}
                  {googleMapsLoaded && !addressError && (
                    <p className="text-xs text-green-600 mt-1.5" suppressHydrationWarning>
                      ✓ {t('enrollment.wizard.profile.address.ready', 'Address autocomplete ready - start typing to see suggestions')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {getPreviousStep() && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBack}
                  disabled={processing}
                  className="flex-1"
                  suppressHydrationWarning
                >
                  <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2 rtl:rotate-180" />
                  {t('enrollment.wizard.back', 'Back')}
                </Button>
              )}
              <Button
                size="lg"
                className="flex-1"
                onClick={handleSaveProfile}
                disabled={processing || emailExistsDetected}
                suppressHydrationWarning
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                    {t('enrollment.wizard.profile.saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    {t('enrollment.wizard.profile.save', 'Save Profile')}
                    <ArrowRight className="h-4 w-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <Alert className="border-primary/20 bg-primary/5">
              <CreditCard className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground" suppressHydrationWarning>
                {t('enrollment.wizard.payment.info', 'Complete payment to activate your enrollment.')}
              </AlertDescription>
            </Alert>

            <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-6 rounded-2xl border border-border/50 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
                  {t('enrollment.wizard.payment.total', 'Total Amount')}:
                </span>
                <span className="text-2xl font-bold text-foreground" dir="ltr">
                  {enrollment?.currency} {enrollment?.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {getPreviousStep() && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBack}
                  disabled={processing}
                  className="flex-1"
                  suppressHydrationWarning
                >
                  <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2 rtl:rotate-180" />
                  {t('enrollment.wizard.back', 'Back')}
                </Button>
              )}
              <Button
                size="lg"
                className="flex-1"
                onClick={handlePaymentStep}
                suppressHydrationWarning
              >
                {t('enrollment.wizard.payment.button', 'Proceed to Payment')}
                <ArrowRight className="h-4 w-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-4">
            <Alert className="border-primary/20 bg-primary/5">
              <Lock className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground" suppressHydrationWarning>
                {t('enrollment.wizard.password.info', 'Create a secure password for your account. This will be used to log in to your dashboard.')}
              </AlertDescription>
            </Alert>

            {/* Password Form */}
            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="password" suppressHydrationWarning>
                  {t('enrollment.wizard.password.label', 'Password')} *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={wizardData.password}
                  onChange={(e) => setWizardData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={t('enrollment.wizard.password.placeholder', 'Enter a secure password (min. 8 characters)')}
                  required
                  minLength={8}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('enrollment.wizard.password.min_length', 'Password must be at least 8 characters long')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password" suppressHydrationWarning>
                  {t('enrollment.wizard.password.confirm', 'Confirm Password')} *
                </Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('enrollment.wizard.password.confirm.placeholder', 'Re-enter your password')}
                  required
                  className="text-base"
                />
                {confirmPassword && wizardData.password !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1.5" suppressHydrationWarning>
                    {t('enrollment.wizard.password.mismatch', 'Passwords do not match')}
                  </p>
                )}
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-2 max-w-md mx-auto">
              <h4 className="text-sm font-semibold text-foreground" suppressHydrationWarning>
                {t('enrollment.wizard.password.requirements.title', 'Password requirements:')}
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li suppressHydrationWarning>
                  {t('enrollment.wizard.password.requirements.min_chars', 'At least 8 characters long')}
                </li>
                <li suppressHydrationWarning>
                  {t('enrollment.wizard.password.requirements.mix', 'Mix of letters and numbers recommended')}
                </li>
                <li suppressHydrationWarning>
                  {t('enrollment.wizard.password.requirements.avoid', 'Avoid common words or patterns')}
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              {getPreviousStep() && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBack}
                  disabled={processing}
                  className="flex-1"
                  suppressHydrationWarning
                >
                  <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2 rtl:rotate-180" />
                  {t('enrollment.wizard.back', 'Back')}
                </Button>
              )}
              <Button
                size="lg"
                className="flex-1"
                onClick={handlePasswordSubmit}
                disabled={processing || !wizardData.password || wizardData.password.length < 8 || wizardData.password !== confirmPassword}
                suppressHydrationWarning
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                    {t('enrollment.wizard.password.creating', 'Creating Account...')}
                  </>
                ) : (
                  <>
                    {t('enrollment.wizard.password.button', 'Create Account')}
                    <ArrowRight className="h-4 w-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'complete':
        const isAutoCompleting = false; // Disabled auto-complete

        return (
          <div className="space-y-6 text-center py-8">
            {/* Success Animation */}
            <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full w-full h-full flex items-center justify-center shadow-2xl">
                <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground" suppressHydrationWarning>
                {t('enrollment.wizard.complete.congratulations', '🎉 Congratulations!')}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto" suppressHydrationWarning>
                {t('enrollment.wizard.complete.success', 'Your enrollment is complete! You can now access your content.')}
              </p>
            </div>

            {/* Success Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 space-y-4 max-w-md mx-auto shadow-lg">
              <div className="flex items-center justify-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold" suppressHydrationWarning>
                  {t('enrollment.wizard.complete.allSteps', 'All steps completed')}
                </span>
              </div>
              <p className="text-sm text-emerald-600/80" suppressHydrationWarning>
                {processing
                  ? t('enrollment.wizard.complete.finalizing', 'Finalizing your enrollment...')
                  : t('enrollment.wizard.complete.clickBelow', 'Click below to access your dashboard and start your journey')
                }
              </p>
            </div>

            {/* Action Button */}
            <Button
              size="lg"
              className="w-full max-w-md mx-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={handleComplete}
              disabled={processing}
              suppressHydrationWarning
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {t('enrollment.wizard.complete.button', 'Go to Dashboard')}
                  <ArrowRight className="h-5 w-5 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
                </>
              )}
            </Button>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background" dir={direction}>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background" dir={direction}>
        <Card className="max-w-md w-full border-destructive/20 shadow-xl">
          <CardHeader className="bg-destructive/5">
            <CardTitle className="text-destructive text-xl" suppressHydrationWarning>
              {t('enrollment.wizard.error.title', 'Error')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-6" suppressHydrationWarning>{error}</p>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
              suppressHydrationWarning
            >
              {t('enrollment.wizard.error.dashboard', 'Go to Dashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!enrollment) {
    return null;
  }

  return (
    <>
      {/* Global styles for Google Maps Autocomplete dropdown */}
      <style jsx global>{`
        /* Fix Google Maps autocomplete dropdown spacing */
        .pac-container {
          font-family: inherit;
          z-index: 9999;
        }
        .pac-item {
          padding: 8px 12px;
          line-height: 1.5;
          cursor: pointer;
        }
        .pac-item-query {
          font-size: 14px;
          padding-right: 4px;
        }
        .pac-matched {
          font-weight: 600;
        }
        .pac-icon {
          margin-top: 4px;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-4 sm:py-8 px-4" dir={direction}>
        <div className="max-w-3xl mx-auto">
        {/* Modern Card with Gradient Header */}
        <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-card/95">
          {/* Gradient Header */}
          <div className="relative bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground px-4 sm:px-8 py-6 sm:py-8">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
            <div className="relative">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white" suppressHydrationWarning>
                {t('enrollment.wizard.header.title', 'Complete Your Enrollment')}
              </h1>
              <p className="text-white/90 text-sm sm:text-base" suppressHydrationWarning>
                {enrollment.product_name}
              </p>
            </div>
          </div>

          <CardContent className="p-4 sm:p-8">
            {/* Wizard Step Indicator */}
            <WizardStepIndicator
              currentStep={currentStep}
              completedSteps={getCompletedSteps()}
              onStepClick={handleStepNavigation}
              showSignature={enrollment.requires_signature}
              showPayment={enrollment.payment_required}
              showPassword={true}
            />

            {/* Current Step Content */}
            <div className="space-y-6">
              {/* Step Header - Hidden on mobile, shown on desktop */}
              <div className="hidden sm:flex items-center gap-4 pb-4 border-b">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                  {getStepIcon(currentStep)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-foreground" suppressHydrationWarning>
                    {getStepTitle(currentStep)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5" suppressHydrationWarning>
                    {getStepDescription(currentStep)}
                  </p>
                </div>
              </div>

              {/* Mobile Step Header */}
              <div className="sm:hidden pb-4 border-b">
                <h3 className="font-bold text-lg text-foreground mb-1" suppressHydrationWarning>
                  {getStepTitle(currentStep)}
                </h3>
                <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                  {getStepDescription(currentStep)}
                </p>
              </div>

              {/* Step Content */}
              <div className="pt-2">
                {renderStepContent()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Help Text */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6 px-4" suppressHydrationWarning>
          {t('enrollment.wizard.help.text', 'Need help? Contact support for assistance with your enrollment.')}
        </p>
      </div>
    </div>
    </>
  );
}
