'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EnrollmentPayment from './EnrollmentPayment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, FileText, User, CreditCard, ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import WizardStepIndicator from '@/components/wizard/WizardStepIndicator';
import { toast } from 'sonner';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any;
    _originalLocalStorage?: Storage;
  }
}

// Pull the bits we care about out of Google Places' address_components
// array. Returns null for parts that aren't present (some addresses
// don't have a postal_code or a sub-locality). The full formatted
// string still goes into `address` separately for display.
type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};
type AddressParts = {
  address_line1: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
};
function parseGoogleAddressComponents(
  components: GoogleAddressComponent[],
): AddressParts {
  const findOne = (...types: string[]): GoogleAddressComponent | undefined =>
    components.find((c) => types.some((t) => c.types.includes(t)));

  const streetNumber = findOne('street_number')?.long_name ?? '';
  const route = findOne('route')?.long_name ?? '';
  const line1 = [streetNumber, route].filter(Boolean).join(' ').trim();

  return {
    address_line1: line1 || null,
    city:
      findOne('locality', 'postal_town', 'sublocality_level_1', 'sublocality')
        ?.long_name ?? null,
    region:
      findOne('administrative_area_level_1', 'administrative_area_level_2')
        ?.long_name ?? null,
    postal_code: findOne('postal_code')?.long_name ?? null,
    // Country: prefer long name (e.g. "Israel") over the ISO code
    // ("IL") so the admin's CRM list reads naturally. ISO codes can
    // be derived later if/when the segmentation engine needs them.
    country: findOne('country')?.long_name ?? null,
  };
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

/** Shown inside a frame (the portal's child page shows the wizard compactly). */
function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.self !== window.top; } catch { return true; }
}

/** The portal child page this framed wizard sits in, to return to after signing. */
function embeddedReturnTo(): string | null {
  if (!isEmbedded()) return null;
  try {
    const path = window.top ? window.top.location.pathname : new URL(document.referrer).pathname;
    // ?enroll=continue: the child page reopens the wizard by itself (at payment).
    return /^\/children\/[0-9a-f-]{36}$/i.test(path) ? `${path}?enroll=continue` : null;
  } catch {
    return null;
  }
}

interface PaymentPlanTemplate {
  id: string;
  plan_name: string;
  plan_type: 'deposit' | 'recurring' | 'one_time' | 'subscription';
  deposit_type?: 'fixed' | 'percentage' | 'none';
  deposit_amount?: number;
  deposit_percentage?: number;
  installment_count?: number;
  installment_frequency?: 'weekly' | 'biweekly' | 'monthly';
  custom_frequency_days?: number;
  subscription_frequency?: 'weekly' | 'monthly' | 'yearly';
  subscription_trial_days?: number;
  plan_description?: string;
}

interface EnrollmentWizardData {
  id: string;
  user_id?: string | null; // Existing user ID (null for new users)
  product_id: string; // Added for fetching payment plans
  product_name: string;
  product_type: string;
  total_amount: number;
  /** A scheduled membership price: shown before paying. */
  upcoming_price?: { amount: number; effective_date: string } | null;
  currency: string;
  requires_signature: boolean;
  signature_template_id?: string;
  signature_status?: string;
  docusign_envelope_id?: string;
  user_profile_complete: boolean;
  payment_required: boolean;
  payment_complete?: boolean;
  alternative_payment_plan_ids?: string[]; // Added for multi-plan support
  payment_plan_id?: string; // Added for selected plan tracking
  wizard_profile_data?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface EnrollmentWizardProps {
  enrollmentId: string;
  token: string | null;
  /**
   * Rendered inside a portal page (e.g. the child page) instead of as its
   * own page: no page background or big header, a compact step row, and the
   * payment step shown in place instead of moving to the pay page.
   */
  embedded?: boolean;
}

/**
 * The enrollment wizard (profile → agreement → payment → account). Used by
 * the /enroll/wizard/[id] page and, embedded, by the portal's child page.
 */
export default function EnrollmentWizard({ enrollmentId, token, embedded: embeddedProp = false }: EnrollmentWizardProps) {
  const router = useRouter();
  const enrollmentToken = token;
  // Embedded by the portal directly, or (older path) loaded inside a frame.
  const embedded = embeddedProp || isEmbedded();
  const [showPaymentInline, setShowPaymentInline] = useState(false);
  const { t, direction, language } = useLanguage();
  const isRTL = direction === 'rtl';

  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<EnrollmentWizardData | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>('signature');
  // Compact look when framed (the portal frame sets this too; set it here as well).
  useLayoutEffect(() => {
    if (isEmbedded()) document.documentElement.classList.add('ips-embedded');
  }, []);

  // DocuSign signing in a dialog. The result arrives as a message from the
  // signing-return page; the real status is then checked with DocuSign.
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [signingFrameLoaded, setSigningFrameLoaded] = useState(false);
  // A new signing address shows the loading message until DocuSign appears.
  useEffect(() => setSigningFrameLoaded(false), [signingUrl]);
  // Signing in a separate window (the fallback, or on a non-https address).
  const [signingInWindow, setSigningInWindow] = useState(false);
  // Logged in when the wizard opened (always true inside the portal).
  const [loggedIn, setLoggedIn] = useState(false);
  const signingPopupRef = useRef<Window | null>(null);
  const syncSignatureRef = useRef<null | (() => Promise<void>)>(null);
  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      // DocuSign's own "session ended" message (sent to the page that embeds
      // signing): a second signal besides our return page.
      if (/^https:\/\/([a-z0-9-]+\.)*docusign\.(com|net)$/i.test(e.origin)) {
        const raw = typeof e.data === 'string' ? e.data : JSON.stringify(e.data ?? {});
        if (/signing_complete|sessionEnd/i.test(raw)) {
          setSigningUrl(null);
          await syncSignatureRef.current?.();
          setProcessing(false);
        }
        return;
      }
      if (e.origin !== window.location.origin || e.data?.source !== 'ips-docusign') return;
      setSigningUrl(null);
      setSigningInWindow(false);
      if (e.data.event === 'signing_complete' || e.data.event === 'viewing_complete') {
        await syncSignatureRef.current?.();
        setProcessing(false);
        return;
      }
      setProcessing(false);
      if (e.data.event === 'decline') {
        toast.error(t('enrollment.wizard.signature.declined', 'The agreement was declined. Contact us if this was a mistake.'));
      } else {
        toast(t('enrollment.wizard.signature.notSigned', 'The agreement was not signed yet. You can sign it whenever you are ready.'));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // While the dialog is open, ask DocuSign (through our sync route) every few
  // seconds whether the agreement is signed. This works however DocuSign
  // finishes (its own end screen, an error screen, no message at all): once
  // signed, the dialog closes and the enrollment moves on.
  useEffect(() => {
    if ((!signingUrl && !signingInWindow) || !enrollmentToken) return;
    let stopped = false;
    const finish = async () => {
      stopped = true;
      setSigningUrl(null);
      setSigningInWindow(false);
      try { signingPopupRef.current?.close(); } catch { /* already closed */ }
      await syncSignatureRef.current?.();
      setProcessing(false);
    };
    const check = async () => {
      try {
        const res = await fetch(`/api/enrollments/token/${enrollmentToken}/sync-signature`, { method: 'POST' });
        if (!res.ok || stopped) return;
        const data = await res.json();
        if (data?.signature_status === 'completed' && !stopped) {
          await finish();
          return;
        }
        // The signing window was closed without finishing: stop waiting.
        if (signingInWindow && signingPopupRef.current?.closed && !stopped) {
          stopped = true;
          setSigningInWindow(false);
          setProcessing(false);
        }
      } catch {
        // Try again on the next tick.
      }
    };
    const id = setInterval(check, 4000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [signingUrl, signingInWindow, enrollmentToken]);

  // Inside the portal's child page the wizard frame is only as tall as its
  // content: while the dialog is open, ask the page to spread the frame over
  // the whole screen so the dialog shows full size.
  useEffect(() => {
    if (!isEmbedded()) return;
    try {
      window.parent.postMessage({ source: 'ips-wizard', overlay: !!signingUrl }, window.location.origin);
    } catch {
      // Not our page around us; nothing to ask.
    }
  }, [signingUrl]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [initialStepDetermined, setInitialStepDetermined] = useState(false);

  // Multi-plan payment selection state
  const [availablePlans, setAvailablePlans] = useState<PaymentPlanTemplate[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectingPlan, setSelectingPlan] = useState(false);

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
  const [isReturningFromDocuSign, setIsReturningFromDocuSign] = useState<boolean>(false);
  const [isReturningFromPayment, setIsReturningFromPayment] = useState<boolean>(false);
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

      setLoggedIn(!!user);
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
        setIsReturningFromDocuSign(true);
        console.log('[Wizard] ✅ SET isReturningFromDocuSign = true');

        // REMOVED: Don't mark signature complete in memory - let DB be source of truth
        // The fetchEnrollmentData will sync memory state with database state

        // Start with retry=1 to immediately trigger stale data detection
        // This handles PostgREST connection pooling cache issues
        console.log('[Wizard] Returned from DocuSign, starting with retry mode to handle PostgREST cache...');
        await fetchEnrollmentData(1); // Start with retry=1, not 0!

        // Sync signature status from DocuSign immediately (don't wait for webhook)
        await syncSignatureStatus();

        // Signed from the portal's child page: return there; the wizard
        // reopens in it at the next step.
        const returnTo = urlParams.get('return_to');
        if (returnTo && /^\/children\/[0-9a-f-]{36}(\?enroll=continue)?$/i.test(returnTo)) {
          window.location.replace(returnTo);
          return;
        }

        // NOW set flag after both async operations complete
        setInitialStepDetermined(true);

        // Clean up URL parameter after processing
        setTimeout(() => {
          urlParams.delete('docusign');
          const newSearch = urlParams.toString();
          const newUrl = `${window.location.pathname}?${newSearch}`;
          window.history.replaceState({}, '', newUrl);
          console.log('[Wizard] Cleaned up docusign URL parameter');
        }, 100);
      } else if (isReturningFromPayment) {
        console.log('[Wizard] ✅ Returned from payment page');

        // Set ref to true so other effects know we're returning from payment
        setIsReturningFromPayment(true);

        // REMOVED: Don't mark payment complete in memory - let DB be source of truth
        // The fetchEnrollmentData will sync memory state with database state

        // Fetch updated enrollment data first to get user_id
        await fetchEnrollmentData(0);

        // NOW set flag after enrollment data is loaded
        setInitialStepDetermined(true);

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

  // Handle browser back button to prevent re-submission of completed steps
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('[Wizard] Back button detected - forcing enrollment re-fetch');

      // Force re-fetch enrollment to determine correct step based on database state
      // This prevents users from going back and re-submitting forms
      fetchEnrollmentData(0);

      // Note: We can't fully prevent back navigation, but we can redirect to correct step
      // The fetchEnrollmentData will trigger determineCurrentStep which redirects appropriately
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Payment handling is now simpler - payment step always shown if payment_required
  // For parent enrollments, payment step is ALWAYS shown (even with saved card)

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
      // isReturningFromDocuSign and isReturningFromPayment are now state variables (available in scope)

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
  // BUT: Don't re-determine if we're returning from payment or DocuSign (preserve the step we set)
  useEffect(() => {
    if (enrollment && !isReturningFromPayment && !isReturningFromDocuSign) {
      determineCurrentStep();
    }
  }, [wizardData.profileCompleted, wizardData.signatureCompleted, wizardData.paymentCompleted, wizardData.passwordCompleted]);

  // Handle return from payment - determine correct next step
  // For EXISTING users: Go to complete step and auto-complete
  // For NEW users: Go to password step
  useEffect(() => {
    if (!enrollment || !isReturningFromPayment) return;
    if (currentStep !== 'signature' && currentStep !== 'payment' && currentStep !== 'profile') return; // Only run once when enrollment loads

    // Wait for enrollment to be fully loaded (has all data)
    if (typeof enrollment.user_id === 'undefined') {
      console.log('[Wizard] Enrollment not fully loaded yet, waiting...');
      return;
    }

    const isExistingUser = !!enrollment.user_id;

    console.log('[Wizard] Handling return from payment:', {
      isExistingUser,
      currentStep,
      user_id: enrollment.user_id
    });

    if (isExistingUser) {
      console.log('[Wizard] → Existing user: Moving to complete step');
      setCurrentStep('complete');
    } else {
      console.log('[Wizard] → New user: Moving to password step');
      setCurrentStep('password');
    }

  }, [enrollment?.user_id, isReturningFromPayment]);

  // Auto-complete enrollment when on complete step after payment (existing users only)
  useEffect(() => {
    const isExistingUser = !!enrollment?.user_id;

    if (currentStep === 'complete' && isReturningFromPayment && !processing && isExistingUser) {
      console.log('[Wizard] Auto-completing enrollment for existing user after payment...');
      const timer = setTimeout(async () => {
        await handleComplete();
        setIsReturningFromPayment(false); // Reset after completion
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, processing, enrollment?.user_id, isReturningFromPayment]);

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
          // Parse the structured address components so the admin
          // CRM can show each part as its own field (city, region,
          // postal_code, country) instead of one opaque blob.
          const parts = parseGoogleAddressComponents(place.address_components || []);
          console.log('[Wizard] place_changed fired', {
            formatted_address: place.formatted_address,
            address_components_count: (place.address_components || []).length,
            parts,
          });
          setProfileData((prev: any) => ({
            ...prev,
            address: place.formatted_address || '',
            address_line1: parts.address_line1,
            city: parts.city,
            region: parts.region,
            postal_code: parts.postal_code,
            country: parts.country,
          }));
        } else {
          console.warn('[Wizard] place_changed fired but place has no formatted_address', place);
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

  // Fetch available payment plans when payment step loads (multi-plan support)
  useEffect(() => {
    const fetchAvailablePlans = async () => {
      if (currentStep !== 'payment' || !enrollment) return;

      // Check if this enrollment has multiple plans available
      const alternativePlanIds = enrollment.alternative_payment_plan_ids || [];
      const hasMultiplePlans = alternativePlanIds.length > 1;

      console.log('[Wizard] Payment step - Multi-plan check:', {
        alternativePlanIds,
        hasMultiplePlans,
        payment_plan_id: enrollment.payment_plan_id,
        product_id: enrollment.product_id
      });

      if (!hasMultiplePlans) {
        setAvailablePlans([]);
        return;
      }

      setLoadingPlans(true);
      try {
        const url = `/api/enrollments/payment-plans?ids=${alternativePlanIds.join(',')}&product_id=${enrollment.product_id}`;
        console.log('[Wizard] Fetching payment plans from:', url);

        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          console.log('[Wizard] Payment plans fetched:', data);
          setAvailablePlans(data.plans || []);

          // Pre-select currently selected plan or first plan
          if (!selectedPlanId && data.plans.length > 0) {
            // If enrollment has a payment_plan_id, pre-select it (user is changing plan)
            const planToSelect = enrollment.payment_plan_id || data.plans[0].id;
            setSelectedPlanId(planToSelect);
            console.log('[Wizard] Pre-selected plan:', planToSelect);
          }
        } else {
          const errorText = await response.text();
          console.error('[Wizard] Failed to fetch payment plans:', response.status, errorText);
        }
      } catch (error) {
        console.error('[Wizard] Error fetching payment plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchAvailablePlans();
  }, [currentStep, enrollment?.alternative_payment_plan_ids, enrollment?.product_id, enrollment?.payment_plan_id, selectedPlanId]);

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
      let profileData = data.wizard_profile_data || {};
      // Parse if it's a JSON string
      if (typeof profileData === 'string') {
        try {
          profileData = JSON.parse(profileData);
        } catch (e) {
          console.error('[Wizard] Failed to parse wizard_profile_data:', e);
          profileData = {};
        }
      }
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

      console.log('[Wizard] Setting enrollment data:', data);
      console.log('[Wizard] product_id:', data.product_id);
      console.log('[Wizard] alternative_payment_plan_ids:', data.alternative_payment_plan_ids);
      setEnrollment(data);

      // CRITICAL: Sync memory state with database state
      // Always use database as source of truth for completion status
      // This ensures manual database updates are reflected in wizard navigation
      setWizardData(prev => {
        const dbSignatureComplete = data.signature_status === 'completed';
        const dbPaymentComplete = data.payment_complete;

        return {
          ...prev,
          // FIXED: Always trust database - no OR logic that makes memory "sticky"
          signatureCompleted: dbSignatureComplete,
          paymentCompleted: dbPaymentComplete,
        };
      });
      console.log('[Wizard] ✅ Synced memory state with database:', {
        signature_status: data.signature_status,
        payment_complete: data.payment_complete,
        memory_signatureCompleted: data.signature_status === 'completed',
        memory_paymentCompleted: data.payment_complete,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Simplified payment logic - payment step shown if payment_required = true
  // Parent enrollments ALWAYS show payment step (even with saved card)

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

    // CRITICAL: Use database as PRIMARY source of truth for completion status
    // Memory state is synced from DB in fetchEnrollmentData
    // This ensures manual database updates are immediately reflected in the wizard
    const isProfileComplete = wizardData.profileCompleted || enrollment.user_profile_complete;
    const isSignatureComplete = enrollment.signature_status === 'completed';
    const isPaymentComplete = enrollment.payment_complete;

    console.log('[Wizard] Determining current step with state:', {
      userId: enrollment.user_id,
      database_signature_status: enrollment.signature_status,
      database_payment_complete: enrollment.payment_complete,
      memory_profileCompleted: wizardData.profileCompleted,
      memory_signatureCompleted: wizardData.signatureCompleted,
      memory_paymentCompleted: wizardData.paymentCompleted,
      computed_isProfileComplete: isProfileComplete,
      computed_isSignatureComplete: isSignatureComplete,
      computed_isPaymentComplete: isPaymentComplete,
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

    // Step 1: Profile completion
    // Check if we have complete profile data (all 5 fields)
    // IMPORTANT: Check MEMORY state, not database (memory-based wizard!)
    const memoryProfileData = wizardData.profile;
    const hasCompleteProfileData = memoryProfileData.first_name && memoryProfileData.last_name &&
                                   memoryProfileData.email && memoryProfileData.phone && memoryProfileData.address;

    // Show profile step if:
    // 1. New user and profile not completed, OR
    // 2. Signature required BUT NOT COMPLETE and profile data is incomplete (need phone/address for contract)
    const needsProfileCompletion = !isExistingUser && !isProfileComplete;
    const needsProfileForSignature = enrollment.requires_signature && !isSignatureComplete && !hasCompleteProfileData;

    console.log('[Wizard] Profile step check:', {
      memoryProfileData,
      hasCompleteProfileData,
      needsProfileCompletion,
      needsProfileForSignature,
      isExistingUser,
      isProfileComplete,
      isSignatureComplete,
      requiresSignature: enrollment.requires_signature,
      database_signature_status: enrollment.signature_status,
      database_wizard_profile_data: enrollment.wizard_profile_data
    });

    // CRITICAL FIX: If signature is already complete, NEVER go back to profile step
    // regardless of profile completion status
    if (isSignatureComplete && needsProfileForSignature) {
      console.warn('[Wizard] ⚠️ PREVENTED profile regression - signature already complete!', {
        isSignatureComplete,
        needsProfileForSignature,
        database_signature_status: enrollment.signature_status
      });
      // Don't return to profile - continue to next check
    } else if (needsProfileCompletion || needsProfileForSignature) {
      console.log('[Wizard] → Setting step to: profile', {
        reason: needsProfileCompletion ? 'NEW USER - PROFILE NOT COMPLETE' : 'SIGNATURE REQUIRES COMPLETE PROFILE',
        hasCompleteProfileData,
        isExistingUser,
        isSignatureComplete
      });
      setCurrentStep('profile');
      return;
    }

    // Step 2: Signature (if required) - needs profile data
    if (enrollment.requires_signature && !isSignatureComplete) {
      console.log('[Wizard] → Setting step to: signature (signature_status:', enrollment.signature_status, ')');
      setCurrentStep('signature');
      return;
    }

    // Step 3: Payment (if required) - ONLY skip for free enrollments
    const isFreeEnrollment = !enrollment.payment_required || enrollment.total_amount === 0;

    console.log('[Wizard] Payment step decision:', {
      isFreeEnrollment,
      isPaymentComplete,
      payment_required: enrollment.payment_required,
      total_amount: enrollment.total_amount
    });

    if (!isFreeEnrollment && !isPaymentComplete) {
      console.log('[Wizard] → Setting step to: payment (payment_complete:', enrollment.payment_complete, ')');
      setCurrentStep('payment');
      return;
    } else if (isFreeEnrollment) {
      console.log('[Wizard] ✓ Skipping payment step (free enrollment)');
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

  /**
   * Signing happens in a dialog on this page (DocuSign framed). 'popup' is the
   * fallback when DocuSign refuses the frame: a new window. Either way the
   * result comes back as a message (see the signing-return page), and the
   * wizard then checks the real status with DocuSign and moves on.
   */
  const handleSignatureStep = async (requested: 'dialog' | 'popup' = 'dialog') => {
    // DocuSign lets its signing screen be framed only by secure (https) sites,
    // so on a plain-http address (local testing) signing opens in a window.
    const mode = requested === 'dialog' && window.location.protocol !== 'https:' ? 'popup' : requested;
    setProcessing(true);
    // A window must be opened during the click, or browsers block it.
    const popup = mode === 'popup' ? window.open('', 'ips-docusign', 'width=960,height=820') : null;
    signingPopupRef.current = popup;
    if (popup) {
      // DocuSign takes a few seconds to open: show a message, not a blank window.
      try {
        const msg = t('enrollment.wizard.signature.loading', 'Opening the agreement...');
        popup.document.title = msg;
        popup.document.body.style.cssText = 'margin:0;height:100vh;display:flex;align-items:center;justify-content:center;font:16px system-ui,sans-serif;color:#555';
        popup.document.body.dir = direction;
        popup.document.body.textContent = msg;
      } catch { /* the window may already be on another address */ }
    }
    try {
      // Use token-based endpoint to create DocuSign envelope
      // Send profile data in request body (memory-based approach)
      const response = await fetch(`/api/enrollments/token/${enrollmentToken}/send-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: wizardData.profile,
          mode,
          // DocuSign's signing screen in the same language as the wizard.
          language,
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

      if (data.signing_url) {
        if (popup) {
          popup.location.href = data.signing_url;
          setSigningUrl(null);
          setSigningInWindow(true);
        } else {
          setSigningUrl(data.signing_url);
        }
      }
    } catch (err: any) {
      console.error('Signature step error:', err);
      popup?.close();
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

      // Don't call handleNext() here - let the useEffect automatically advance
      // when wizardData.profileCompleted changes (line 413-417)
      // Wait briefly for state to propagate before clearing processing flag
      setTimeout(() => {
        setProcessing(false);
      }, 50);
    } catch (err: any) {
      console.error('[Wizard] Profile validation error:', err);
      // Only set critical errors here, not validation errors
      setError(err.message);
      setProcessing(false);
    }
  };

  // The dialog's message handler calls the latest version of this.
  syncSignatureRef.current = () => syncSignatureStatus();
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
        toast.error('Failed to verify signature status. Please refresh the page.');

        // Reset state so user can retry
        setIsReturningFromDocuSign(false);
        return;
      }

      const data = await response.json();

      if (!data || !data.signature_status) {
        console.error('[Wizard] Invalid response from signature sync:', data);
        toast.error('Received invalid signature status. Please refresh the page.');
        setIsReturningFromDocuSign(false);
        return;
      }

      console.log('[Wizard] Signature sync result:', data);

      // REMOVED: Don't update memory state here - fetchEnrollmentData will sync from DB
      // The sync-signature API updates the database, then we fetch fresh data

      // Fetch updated enrollment data to sync memory with database
      await fetchEnrollmentData(0);

      // Reset the state AFTER fetching data so determineCurrentStep() has fresh data
      if (isReturningFromDocuSign) {
        setIsReturningFromDocuSign(false);
        console.log('[Wizard] ✅ RESET isReturningFromDocuSign = false (after fetching data)');
      }

      // If signature is complete, move to next step
      if (data.signature_status === 'completed') {
        console.log('[Wizard] Signature complete - moving to next step');
        handleNext();
      } else {
        console.log('[Wizard] Signature not yet completed, status:', data.signature_status);
      }
    } catch (err: any) {
      console.error('[Wizard] Signature sync error:', err);
    }
  };

  const handlePaymentStep = () => {
    // Embedded in a portal page: the payment opens in place.
    if (embedded) {
      setShowPaymentInline(true);
      return;
    }
    // Redirect to public wizard payment page with token
    router.push(`/enroll/wizard/${enrollmentId}/pay?token=${enrollmentToken}`);
  };

  const handlePlanSelection = async () => {
    if (!selectedPlanId) {
      setError(t('enrollment.wizard.payment.selectPlanError', 'Please select a payment plan'));
      return;
    }

    setSelectingPlan(true);
    setError(null);

    try {
      const response = await fetch(`/api/enrollments/token/${enrollmentToken}/select-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_plan_id: selectedPlanId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('enrollment.wizard.payment.selectPlanFailed', 'Failed to select payment plan'));
      }

      const data = await response.json();

      // Update enrollment data in state
      setEnrollment(prev => prev ? {
        ...prev,
        payment_plan_id: selectedPlanId,
        total_amount: data.enrollment.total_amount
      } : null);

      // Proceed to payment page
      handlePaymentStep();

    } catch (err: any) {
      console.error('Error selecting payment plan:', err);
      setError(err.message);
    } finally {
      setSelectingPlan(false);
    }
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
      // Where to land: the server's choice (e.g. the child's page for child
      // coaching), otherwise the dashboard.
      const landing = typeof data.redirect_url === 'string' && data.redirect_url.startsWith('/') && !data.redirect_url.startsWith('//')
        ? data.redirect_url
        : '/dashboard?enrollment=complete';

      if (!isExistingUser) {
        // NEW USER: Auto-login with the new session
        if (data.session) {
          await supabase.auth.setSession(data.session);
        }
        console.log('[Wizard] Redirecting new user to dashboard');
        router.push(landing);
      } else if (currentUser) {
        // EXISTING USER WHO IS LOGGED IN: Go directly to dashboard
        console.log('[Wizard] Redirecting logged-in existing user to dashboard');
        router.push(landing);
        // Inside the portal the landing is often the page already open (the
        // child's page): reload its data so it shows the enrollment as done.
        router.refresh();
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

    // Calculate progress based on ACTUAL completion, not just current step
    // This gives users accurate feedback about their progress
    let completedSteps = 0;

    if (!isExistingUser && (enrollment?.user_profile_complete || wizardData.profileCompleted)) {
      completedSteps++;
    } else if (isExistingUser) {
      completedSteps++; // Existing users skip profile
    }

    if (enrollment?.signature_status === 'completed' || wizardData.signatureCompleted) {
      completedSteps++;
    }

    if (enrollment?.payment_complete || wizardData.paymentCompleted) {
      completedSteps++;
    }

    if (enrollment?.user_id || wizardData.passwordCompleted) {
      completedSteps++;
    }

    if (currentStep === 'complete') {
      completedSteps = steps.length; // 100%
    }

    return (completedSteps / steps.length) * 100;
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

            {/* How signing in DocuSign works: its own screen doesn't say. */}
            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
              <b className="block" suppressHydrationWarning>{t('enrollment.wizard.signature.howTitle', 'How to sign')}</b>
              <ol className="list-decimal ps-5 space-y-1 text-muted-foreground">
                <li suppressHydrationWarning>{t('enrollment.wizard.signature.how1', 'In the signing window, click "Next" at the top.')}</li>
                <li suppressHydrationWarning>{t('enrollment.wizard.signature.how2', 'It takes you to the yellow "Sign" field. Click it and choose your signature.')}</li>
                <li suppressHydrationWarning>{t('enrollment.wizard.signature.how3', 'Click "Finish". The enrollment continues here on its own.')}</li>
              </ol>
            </div>

            {signingInWindow && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span suppressHydrationWarning>{t('enrollment.wizard.signature.waiting', 'The signing window is open. Waiting for your signature...')}</span>
                <button type="button" className="underline hover:text-foreground" onClick={() => signingPopupRef.current?.focus()} suppressHydrationWarning>
                  {t('enrollment.wizard.signature.showWindow', 'Show the window')}
                </button>
              </div>
            )}

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
                onClick={() => handleSignatureStep('dialog')}
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

      case 'payment': {
        // Check if this is a multi-plan enrollment
        const alternativePlanIds = enrollment?.alternative_payment_plan_ids || [];
        const hasMultiplePlans = alternativePlanIds.length > 1;

        return (
          <div className="space-y-6">
            <Alert className="border-primary/20 bg-primary/5">
              <CreditCard className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground" suppressHydrationWarning>
                {hasMultiplePlans
                  ? t('enrollment.wizard.payment.selectPlan', 'Select your preferred payment plan to continue.')
                  : t('enrollment.wizard.payment.info', 'Complete payment to activate your enrollment.')
                }
              </AlertDescription>
            </Alert>

            {/* Multi-Plan Selection UI */}
            {hasMultiplePlans && (
              <div className="space-y-4">
                {loadingPlans ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : availablePlans.length === 0 ? (
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No payment plans available. Check console for debugging information.
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Alternative plan IDs: {alternativePlanIds.join(', ') || 'none'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {availablePlans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;

                      // Calculate payment details
                      const depositAmount = plan.deposit_type === 'fixed'
                        ? plan.deposit_amount
                        : (plan.deposit_percentage && enrollment?.total_amount)
                          ? (enrollment.total_amount * plan.deposit_percentage / 100)
                          : 0;

                      const remainingAfterDeposit = enrollment?.total_amount
                        ? enrollment.total_amount - (depositAmount || 0)
                        : 0;

                      const installmentAmount = plan.installment_count
                        ? remainingAfterDeposit / plan.installment_count
                        : enrollment?.total_amount || 0;

                      const frequencyText = t(
                        `enrollment.paymentPlan.frequency.${plan.installment_frequency}`,
                        plan.installment_frequency || 'monthly'
                      );

                      return (
                        <Card
                          key={plan.id}
                          className={`cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary border-2 shadow-lg'
                              : 'border-border hover:border-primary/50 hover:shadow-md'
                          }`}
                          onClick={() => setSelectedPlanId(plan.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
                                {plan.plan_description && (
                                  <CardDescription className="mt-1">
                                    {plan.plan_description}
                                  </CardDescription>
                                )}
                              </div>
                              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                              }`}>
                                {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-3">
                            {/* ONE-TIME PAYMENT */}
                            {plan.plan_type === 'one_time' && (
                              <div className="py-4 text-center">
                                <div className="text-sm text-muted-foreground mb-2" suppressHydrationWarning>
                                  {t('enrollment.wizard.payment.oneTimePayment', 'Single Payment')}
                                </div>
                                <div className="text-2xl font-bold text-primary" dir="ltr">
                                  {enrollment?.currency} {enrollment?.total_amount.toFixed(2)}
                                </div>
                              </div>
                            )}

                            {/* DEPOSIT + INSTALLMENTS PLAN */}
                            {plan.plan_type === 'deposit' && (
                              <>
                                {/* Deposit Details */}
                                {depositAmount && depositAmount > 0 && (
                                  <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                                      {t('enrollment.wizard.payment.deposit', 'Initial Deposit')}
                                    </span>
                                    <span className="font-semibold" dir="ltr">
                                      {enrollment?.currency} {depositAmount.toFixed(2)}
                                    </span>
                                  </div>
                                )}

                                {/* Installments */}
                                {plan.installment_count && plan.installment_count > 0 && (
                                  <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                                      {t('enrollment.wizard.payment.installments', 'Installments')}
                                    </span>
                                    <span className="font-medium" dir="ltr">
                                      {plan.installment_count} × {enrollment?.currency} {installmentAmount.toFixed(2)}
                                      <span className="text-sm text-muted-foreground ltr:ml-1 rtl:mr-1">
                                        {frequencyText}
                                      </span>
                                    </span>
                                  </div>
                                )}

                                {/* Total Amount */}
                                <div className="flex justify-between items-center pt-2">
                                  <span className="text-sm font-medium" suppressHydrationWarning>
                                    {t('enrollment.wizard.payment.total', 'Total Amount')}
                                  </span>
                                  <span className="text-lg font-bold text-primary" dir="ltr">
                                    {enrollment?.currency} {enrollment?.total_amount.toFixed(2)}
                                  </span>
                                </div>
                              </>
                            )}

                            {/* RECURRING PLAN (No Deposit) */}
                            {plan.plan_type === 'recurring' && (
                              <>
                                <div className="flex justify-between items-center py-2 border-b">
                                  <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                                    {t('enrollment.wizard.payment.recurringPayments', 'Recurring Payments')}
                                  </span>
                                  <span className="font-medium" dir="ltr">
                                    {plan.installment_count} × {enrollment?.currency} {installmentAmount.toFixed(2)}
                                    <span className="text-sm text-muted-foreground ltr:ml-1 rtl:mr-1">
                                      {frequencyText}
                                    </span>
                                  </span>
                                </div>

                                {/* Total Amount */}
                                <div className="flex justify-between items-center pt-2">
                                  <span className="text-sm font-medium" suppressHydrationWarning>
                                    {t('enrollment.wizard.payment.total', 'Total Amount')}
                                  </span>
                                  <span className="text-lg font-bold text-primary" dir="ltr">
                                    {enrollment?.currency} {enrollment?.total_amount.toFixed(2)}
                                  </span>
                                </div>
                              </>
                            )}

                            {/* SUBSCRIPTION PLAN */}
                            {plan.plan_type === 'subscription' && (
                              <div className="py-4">
                                <div className="flex justify-between items-center py-2 border-b">
                                  <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                                    {t('enrollment.wizard.payment.subscriptionPrice', 'Subscription')}
                                  </span>
                                  <span className="font-semibold" dir="ltr">
                                    {enrollment?.currency} {enrollment?.total_amount.toFixed(2)}
                                    <span className="text-sm text-muted-foreground ltr:ml-1 rtl:mr-1">
                                      / {t(`enrollment.paymentPlan.interval.${plan.subscription_frequency || 'monthly'}`, plan.subscription_frequency || 'monthly')}
                                    </span>
                                  </span>
                                </div>

                                {plan.subscription_trial_days && plan.subscription_trial_days > 0 && (
                                  <div className="mt-3 text-sm text-emerald-600" suppressHydrationWarning>
                                    ✓ {plan.subscription_trial_days} {t('enrollment.wizard.payment.trialDays', 'days free trial')}
                                  </div>
                                )}

                                <div className="mt-2 text-xs text-muted-foreground" suppressHydrationWarning>
                                  {t('enrollment.wizard.payment.subscriptionRenews', 'Automatically renews until cancelled')}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Single Plan Display (No Selection Needed) */}
            {!hasMultiplePlans && (
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
            )}

            {/* A scheduled membership price, so the buyer knows before paying */}
            {enrollment?.upcoming_price && (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200" suppressHydrationWarning>
                {t('enrollment.pricing.upcoming', 'From {date} the price will be {price}')
                  .replace('{date}', new Date(`${enrollment.upcoming_price.effective_date}T12:00:00`).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }))
                  .replace('{price}', `${enrollment.currency} ${enrollment.upcoming_price.amount.toFixed(2)}`)}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {getPreviousStep() && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBack}
                  disabled={processing || selectingPlan}
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
                onClick={hasMultiplePlans ? handlePlanSelection : handlePaymentStep}
                disabled={selectingPlan || (hasMultiplePlans && !selectedPlanId)}
                suppressHydrationWarning
              >
                {selectingPlan ? (
                  <>
                    <Loader2 className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                    {t('enrollment.wizard.payment.selecting', 'Selecting...')}
                  </>
                ) : (
                  <>
                    {t('enrollment.wizard.payment.button', 'Proceed to Payment')}
                    <ArrowRight className="h-4 w-4 ltr:ml-2 rtl:mr-2 rtl:rotate-180" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      }

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

        // Logged in: no Welcome screen, just a moment while it finishes.
        if (skipWelcome) {
          return (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground" role="status">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span suppressHydrationWarning>{t('enrollment.wizard.complete.finalizing', 'Finalizing your enrollment...')}</span>
            </div>
          );
        }

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
                {t('enrollment.wizard.complete.congratulations', 'Congratulations!')}
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

  // A logged-in parent doesn't need the closing "Welcome" screen: once the
  // last step is done, finish the enrollment and go back to their page.
  const skipWelcome = !!enrollment?.user_id && (embedded || loggedIn);
  const autoCompletedRef = useRef(false);
  useEffect(() => {
    if (currentStep === 'complete' && skipWelcome && !autoCompletedRef.current) {
      autoCompletedRef.current = true;
      handleComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, skipWelcome]);

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
          direction: ltr !important;
          text-align: left !important;
        }
        .pac-item {
          padding: 8px 12px;
          line-height: 1.5;
          cursor: pointer;
          direction: ltr !important;
          text-align: left !important;
        }
        .pac-item-query {
          font-size: 14px;
          padding-right: 4px;
          direction: ltr !important;
        }
        .pac-matched {
          font-weight: 600;
        }
        .pac-icon {
          margin-top: 4px;
          margin-right: 8px;
        }
        /* Inside the portal's child page (framed): just the step, compact. */
        /* No page height inside the frame, so it can shrink to its content. */
        html.ips-embedded, html.ips-embedded body { min-height: 0 !important; height: auto !important; background: transparent; }
        html.ips-embedded body > div, html.ips-embedded main { min-height: 0 !important; }
        /* Embedded in a portal page (directly, or framed): just the steps,
           inside the page's own card, with the card's spacing. */
        .wizard-embedded.wizard-root { min-height: 0; background: transparent; padding: 16px 20px 20px; }
        /* Main action buttons: normal size, at the start, not full-width bars. */
        .wizard-embedded .wizard-content button.w-full { width: auto; min-width: 200px; padding-inline: 24px; }
        .wizard-embedded .wizard-content button.flex-1 { flex: 0 0 auto; min-width: 200px; padding-inline: 24px; }
        .wizard-embedded .wizard-inner { max-width: none; margin: 0; }
        .wizard-embedded .wizard-card { box-shadow: none; background: transparent; backdrop-filter: none; border-radius: 0; border: 0; }
        /* The page's card already says what this is: no second title, divider or help line. */
        .wizard-embedded .wizard-hero, .wizard-embedded .wizard-help,
        .wizard-embedded .wizard-step-header, .wizard-embedded .wizard-step-header-mobile { display: none !important; }
        .wizard-embedded .wizard-content { padding: 0; }
        .wizard-embedded .wizard-content > .space-y-6 > * + * { margin-top: 12px; }
      `}</style>
      <div className={`wizard-root ${embedded ? 'wizard-embedded' : 'min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-4 sm:py-8 px-4'}`} dir={direction}>
        <div className="wizard-inner max-w-3xl mx-auto">
        {/* Modern Card with Gradient Header */}
        <Card className="wizard-card shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-card/95">
          {/* Gradient Header */}
          <div className="wizard-hero relative bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground px-4 sm:px-8 py-6 sm:py-8">
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

          <CardContent className="wizard-content p-4 sm:p-8">
            {/* Wizard Step Indicator */}
            <WizardStepIndicator
              currentStep={currentStep}
              completedSteps={getCompletedSteps()}
              onStepClick={handleStepNavigation}
              showSignature={enrollment.requires_signature}
              showPayment={enrollment.payment_required}
              // Logged-in (existing) users skip contact details and password:
              // the bar shows only the steps they go through.
              showProfile={!enrollment.user_id}
              showPassword={!enrollment.user_id}
              showComplete={!skipWelcome}
              compact={embedded}
            />

            {/* Current Step Content */}
            <div className="space-y-6">
              {/* Step Header - Hidden on mobile, shown on desktop */}
              <div className="wizard-step-header hidden sm:flex items-center gap-4 pb-4 border-b">
                <div className="wizard-step-icon w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
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
              <div className="wizard-step-header-mobile sm:hidden pb-4 border-b">
                <h3 className="font-bold text-lg text-foreground mb-1" suppressHydrationWarning>
                  {getStepTitle(currentStep)}
                </h3>
                <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                  {getStepDescription(currentStep)}
                </p>
              </div>

              {/* Step Content (embedded: the payment opens here, in place) */}
              <div className="pt-2">
                {showPaymentInline ? (
                  <EnrollmentPayment
                    enrollmentId={enrollmentId}
                    token={enrollmentToken}
                    embedded
                    onBack={() => setShowPaymentInline(false)}
                    onDone={async () => {
                      // Same as coming back from the pay page: the database
                      // decides the next step.
                      setShowPaymentInline(false);
                      setIsReturningFromPayment(true);
                      await fetchEnrollmentData(0);
                      setInitialStepDetermined(true);
                    }}
                  />
                ) : (
                  renderStepContent()
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Help Text */}
        <p className="wizard-help text-center text-xs sm:text-sm text-muted-foreground mt-6 px-4" suppressHydrationWarning>
          {t('enrollment.wizard.help.text', 'Need help? Contact support for assistance with your enrollment.')}
        </p>
      </div>
    </div>

      {/* DocuSign signing, in a dialog on this page */}
      <Dialog
        open={!!signingUrl}
        onOpenChange={(open) => {
          if (!open) {
            setSigningUrl(null);
            // Closed by hand: check with DocuSign anyway, so a signed
            // agreement still moves the enrollment on.
            Promise.resolve(syncSignatureRef.current?.()).finally(() => setProcessing(false));
          }
        }}
      >
        <DialogContent dir={direction} className="max-w-5xl h-[90dvh] p-0 gap-0 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b pe-12">
            <DialogTitle suppressHydrationWarning>{t('enrollment.wizard.signature.dialogTitle', 'Sign the agreement')}</DialogTitle>
            <DialogDescription className="text-xs" suppressHydrationWarning>
              {t('enrollment.wizard.signature.how1', 'In the signing window, click "Next" at the top.')}{' '}
              {t('enrollment.wizard.signature.dialogHint', 'When you finish signing, this window closes and the enrollment continues.')}
            </DialogDescription>
          </div>
          {signingUrl && (
            <div className="relative flex-1 min-h-0">
              {/* DocuSign takes a few seconds to open: say so meanwhile. */}
              {!signingFrameLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground bg-background">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span suppressHydrationWarning>{t('enrollment.wizard.signature.loading', 'Opening the agreement...')}</span>
                </div>
              )}
              <iframe
                src={signingUrl}
                title={t('enrollment.wizard.signature.dialogTitle', 'Sign the agreement')}
                className="absolute inset-0 h-full w-full border-0"
                allow="clipboard-write"
                onLoad={() => setSigningFrameLoaded(true)}
              />
            </div>
          )}
          <div className="px-5 py-2 border-t text-xs text-muted-foreground">
            <button
              type="button"
              className="underline hover:text-foreground"
              onClick={() => {
                setSigningUrl(null);
                handleSignatureStep('popup');
              }}
              suppressHydrationWarning
            >
              {t('enrollment.wizard.signature.openWindow', 'Not loading? Open the signing in a new window')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
