'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EnrollmentPayment from './EnrollmentPayment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Check, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
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
  /** Set by the team when payments start later than today. */
  payment_start_date?: string | null;
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

          // The one rule: already in this product → the portal (or Billing);
          // an open enrollment of their own in it → that one continues.
          // (Inside the portal the wizard is given the client's own
          // enrollment, so this only happens on a standalone link.)
          if (response.ok && data?.redirect && !embedded) {
            window.location.replace(data.redirect);
            return;
          }
          if (response.ok && data?.kind === 'continue' && data.wizard_url && !embedded) {
            window.location.replace(data.wizard_url);
            return;
          }

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

  // A returning client logs in on the main login page (/login), which links
  // this enrollment to their
  // account and opens it in their portal ("להשלמה" on the home page).
  // The token rides in the address (sessionStorage is kept as a fallback),
  // so it survives the login page opening in another tab.
  const goToLogin = () => {
    sessionStorage.setItem('enrollment_return_id', enrollmentId);
    sessionStorage.setItem('enrollment_return_token', enrollmentToken || '');
    const email = profileData.email?.trim();
    const query = new URLSearchParams();
    if (enrollmentToken) query.set('enroll', enrollmentToken);
    if (email) query.set('email', email);
    window.location.href = `/login${query.toString() ? `?${query}` : ''}`;
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

  // ----- The compact look (portal palette) -----

  /** Money in the enrollment's currency (it comes from the business settings). */
  const money = (amount: number): string => {
    const value = Math.round((Number(amount) || 0) * 100) / 100;
    const code = (enrollment?.currency || '').toUpperCase();
    const digits = Number.isInteger(value) ? 0 : 2;
    try {
      return new Intl.NumberFormat(isRTL ? 'he-IL' : 'en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: digits,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${code} ${value.toFixed(digits)}`.trim();
    }
  };

  const ui = {
    card: 'wizard-step-card grid gap-3 rounded-2xl border border-[#e9e3f1] bg-white p-4 text-[#221a2e]',
    title: 'wizard-step-title m-0 text-lg font-semibold',
    sub: 'm-0 -mt-2 text-[13.5px] text-[#73698a]',
    field: 'grid min-w-0 gap-1',
    label: 'text-[13.5px] font-semibold text-[#221a2e]',
    input: 'h-[42px] rounded-[10px] border-[#e9e3f1] bg-white px-3 text-[14.5px] text-[#221a2e] placeholder:text-[#a89fba]',
    inputErr: 'border-[#d0453a] bg-[#fff6f5]',
    err: 'text-[12.5px] font-semibold text-[#b3392f]',
    actions: 'flex flex-wrap items-center justify-between gap-2',
    primary: 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#5b3a8e] px-[22px] text-[15px] font-semibold text-white transition-colors hover:bg-[#4b2f77] disabled:cursor-not-allowed disabled:opacity-60',
    back: 'inline-flex items-center gap-1 px-1 py-2 text-sm font-semibold text-[#73698a] hover:text-[#221a2e] disabled:opacity-50',
    fine: 'text-xs text-[#73698a]',
  };

  /** "→ Back" to the previous step, when the flow has one. */
  const renderBack = (disabled: boolean) =>
    getPreviousStep() ? (
      <button type="button" onClick={handleBack} disabled={disabled} className={ui.back}>
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        {t('enrollment.wizard.back', 'Back')}
      </button>
    ) : (
      <span />
    );

  /** One line of numbered steps: only the steps this enrollment goes through. */
  const renderStepBar = () => {
    if (!enrollment) return null;
    const keys: WizardStep[] = [];
    if (!enrollment.user_id) keys.push('profile');
    if (enrollment.requires_signature) keys.push('signature');
    if (enrollment.payment_required) keys.push('payment');
    if (!enrollment.user_id) keys.push('password');
    if (!skipWelcome) keys.push('complete');
    const labels: Record<WizardStep, string> = {
      profile: t('enrollment.wizard.compact.step.profile', 'Details'),
      signature: t('enrollment.wizard.compact.step.signature', 'Signature'),
      payment: t('enrollment.wizard.compact.step.payment', 'Payment'),
      password: t('enrollment.wizard.compact.step.password', 'Password'),
      complete: t('enrollment.wizard.compact.step.complete', 'Done'),
    };

    // Inside the portal card: the step as one small line, not a bar.
    if (embedded) {
      const index = keys.indexOf(currentStep);
      if (index < 0) return null;
      const text = index === keys.length - 1
        ? t('enrollment.wizard.compact.pay.stepLast', 'Last step: {step}').replace('{step}', labels[currentStep])
        : t('enrollment.wizard.compact.pay.stepOf', 'Step {n} of {total}: {step}')
            .replace('{n}', String(index + 1))
            .replace('{total}', String(keys.length))
            .replace('{step}', labels[currentStep]);
      return <p className="wizard-step-line m-0 text-end text-[12.5px] text-[#73698a]">{text}</p>;
    }

    const completed = getCompletedSteps();
    return (
      <ol
        className="wizard-steps m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-[13px] text-[#73698a]"
        aria-label={t('enrollment.wizard.compact.steps', 'Enrollment steps')}
      >
        {keys.map((key, i) => {
          const now = key === currentStep;
          // Done steps can be opened again, as before.
          const done = completed.includes(key) && !now;
          const dot = (
            <span
              className={`grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] font-semibold ${
                done
                  ? 'bg-[#5b3a8e] text-white'
                  : now
                    ? 'bg-[#f1ebf8] text-[#5b3a8e] shadow-[inset_0_0_0_2px_#5b3a8e]'
                    : 'bg-[#e9e3f1] text-[#73698a]'
              }`}
              aria-hidden="true"
            >
              {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </span>
          );
          // On a phone only the current step's name shows.
          const label = <span className={now ? '' : 'max-sm:sr-only'}>{labels[key]}</span>;
          return (
            <li key={key} className="flex items-center gap-1.5" aria-current={now ? 'step' : undefined}>
              {i > 0 && <span className="h-px w-3.5 bg-[#e9e3f1]" aria-hidden="true" />}
              {done ? (
                <button type="button" onClick={() => handleStepNavigation(key)} className="inline-flex items-center gap-1.5 hover:text-[#221a2e]">
                  {dot}
                  {label}
                </button>
              ) : (
                <span className={`inline-flex items-center gap-1.5 ${now ? 'font-bold text-[#221a2e]' : ''}`}>
                  {dot}
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    );
  };

  /** How a plan charges, its per-payment amount, and what is charged today. */
  const describePlan = (plan: PaymentPlanTemplate) => {
    const total = enrollment?.total_amount || 0;
    const type = plan.plan_type as string;
    const count = plan.installment_count || 0;
    const freq = (plan.installment_frequency as string) || 'monthly';
    // Same deposit as the payment engine charges.
    const deposit =
      type === 'deposit'
        ? plan.deposit_type === 'percentage'
          ? (total * (plan.deposit_percentage || 0)) / 100
          : Number(plan.deposit_amount) || 0
        : 0;
    const each = count > 0 ? (total - deposit) / count : total;
    const countText = () => {
      if (freq === 'weekly') return t('enrollment.wizard.compact.plan.weekly', '{count} weekly payments').replace('{count}', String(count));
      if (freq === 'biweekly') return t('enrollment.wizard.compact.plan.biweekly', '{count} payments every two weeks').replace('{count}', String(count));
      if (freq === 'monthly') return t('enrollment.wizard.compact.plan.monthly', '{count} monthly payments').replace('{count}', String(count));
      return t('enrollment.wizard.compact.plan.custom', '{count} payments, every {days} days')
        .replace('{count}', String(count))
        .replace('{days}', String(plan.custom_frequency_days || ''));
    };
    const perText = (f: string) => {
      if (f === 'weekly') return t('enrollment.wizard.compact.per.weekly', 'per week');
      if (f === 'biweekly') return t('enrollment.wizard.compact.per.biweekly', 'every two weeks');
      if (f === 'monthly') return t('enrollment.wizard.compact.per.monthly', 'per month');
      if (f === 'yearly') return t('enrollment.wizard.compact.per.yearly', 'per year');
      return t('enrollment.wizard.compact.per.payment', 'per payment');
    };

    // today: an amount, 'none' (nothing is charged now), or null (not shown).
    let desc = '';
    let amount: string | null = money(total);
    let per: string | null = null;
    let today: number | 'none' | null = null;

    switch (type) {
      case 'one_time':
        desc = t('enrollment.wizard.compact.plan.oneTime', 'One payment');
        today = total;
        break;
      case 'deposit':
        desc = [
          deposit > 0 ? t('enrollment.wizard.compact.plan.deposit', 'Deposit {amount}').replace('{amount}', money(deposit)) : '',
          count > 0 ? countText() : '',
        ].filter(Boolean).join(' · ');
        if (count > 0) {
          amount = money(each);
          per = perText(freq);
        }
        today = deposit > 0 ? deposit : each;
        break;
      case 'recurring':
      case 'installments':
        if (count > 0) {
          desc = countText();
          amount = money(each);
          per = perText(freq);
          today = each;
        }
        break;
      case 'subscription': {
        const interval = plan.subscription_frequency || 'monthly';
        const trial = plan.subscription_trial_days || 0;
        desc = [
          interval === 'weekly'
            ? t('enrollment.wizard.compact.plan.subWeekly', 'Weekly membership, renews until cancelled')
            : interval === 'yearly'
              ? t('enrollment.wizard.compact.plan.subYearly', 'Yearly membership, renews until cancelled')
              : t('enrollment.wizard.compact.plan.subMonthly', 'Monthly membership, renews until cancelled'),
          trial > 0 ? t('enrollment.wizard.compact.plan.trial', '{days} days free trial').replace('{days}', String(trial)) : '',
        ].filter(Boolean).join(' · ');
        per = perText(interval);
        // With a free trial, what is charged today isn't known here.
        today = trial > 0 ? null : total;
        break;
      }
      case 'per_session':
        // Pay as you go: the card is saved now, each session charged when held.
        desc = t('enrollment.wizard.compact.plan.perSession', 'Paid per session, charged when each session is held');
        amount = null;
        today = 'none';
        break;
      default:
        desc = plan.plan_description || '';
    }
    return { desc, amount, per, today };
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'signature':
        return (
          <section className={ui.card}>
            <h2 className={ui.title}>{t('enrollment.wizard.compact.signature.title', 'Sign the agreement')}</h2>
            <p className={ui.sub}>{t('enrollment.wizard.compact.signature.sub', 'The agreement opens in a window here on the page. It takes a minute.')}</p>

            {/* How signing in DocuSign works: its own screen doesn't say. */}
            <ol className="m-0 grid list-none gap-1.5 p-0">
              {[
                t('enrollment.wizard.signature.how1', 'In the signing window, click "Next" at the top.'),
                t('enrollment.wizard.signature.how2', 'It takes you to the yellow "Sign" field. Click it and choose your signature.'),
                t('enrollment.wizard.signature.how3', 'Click "Finish". The enrollment continues here on its own.'),
              ].map((line, i) => (
                <li key={i} className="flex items-baseline gap-2 text-sm">
                  <span className="h-5 w-5 flex-none rounded-full bg-[#f1ebf8] text-center text-[11px] font-semibold leading-5 text-[#5b3a8e]" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>

            {signingInWindow && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#73698a]" role="status">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('enrollment.wizard.signature.waiting', 'The signing window is open. Waiting for your signature...')}</span>
                <button type="button" className="underline hover:text-[#221a2e]" onClick={() => signingPopupRef.current?.focus()}>
                  {t('enrollment.wizard.signature.showWindow', 'Show the window')}
                </button>
              </div>
            )}

            <div className={ui.actions}>
              {renderBack(processing)}
              <button type="button" className={ui.primary} onClick={() => handleSignatureStep('dialog')} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('enrollment.wizard.signature.sending', 'Opening signature...')}
                  </>
                ) : (
                  t('enrollment.wizard.compact.signature.button', 'Sign the agreement')
                )}
              </button>
            </div>
          </section>
        );

      case 'profile':
        return (
          <section className={ui.card}>
            <h2 className={ui.title}>{t('enrollment.wizard.compact.profile.title', 'Your details')}</h2>

            {/* Returning clients log in instead; the enrollment then continues in their portal. */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl bg-[#f1ebf8] px-3 py-2 text-sm">
              <span>
                <b className="font-semibold">{t('enrollment.wizard.profile.haveAccount', 'Already have an account?')}</b>{' '}
                {t('enrollment.wizard.compact.profile.loginStrip', 'Log in and the enrollment will continue in your portal.')}
              </span>
              <button
                type="button"
                onClick={goToLogin}
                className="rounded-[10px] border border-[#d9cbee] bg-white px-3.5 py-1.5 text-sm font-semibold text-[#5b3a8e] hover:bg-[#faf7fd]"
              >
                {t('enrollment.wizard.compact.profile.loginButton', 'Log in')}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {/* Email first, full width */}
              <div className={`${ui.field} sm:col-span-2`}>
                <Label htmlFor="email" className={ui.label}>
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
                  className={`${ui.input} ${emailError ? ui.inputErr : ''}`}
                />
                {emailError && (
                  <div className={ui.err}>
                    {emailError.includes('login') || emailError.includes('התחבר') ? (
                      <div className="flex flex-wrap items-center gap-1">
                        <span>{emailError.split('.')[0]}.</span>
                        <button type="button" onClick={goToLogin} className="underline hover:opacity-80">
                          {t('enrollment.wizard.profile.email.loginLink', 'Click here to login')}
                        </button>
                      </div>
                    ) : (
                      <p className="m-0">{emailError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className={ui.field}>
                <Label htmlFor="first_name" className={ui.label}>
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
                  className={`${ui.input} ${firstNameError ? ui.inputErr : ''}`}
                />
                {firstNameError && <p className={`m-0 ${ui.err}`}>{firstNameError}</p>}
              </div>

              <div className={ui.field}>
                <Label htmlFor="last_name" className={ui.label}>
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
                  className={`${ui.input} ${lastNameError ? ui.inputErr : ''}`}
                />
                {lastNameError && <p className={`m-0 ${ui.err}`}>{lastNameError}</p>}
              </div>

              <div className={ui.field}>
                <Label htmlFor="phone" className={ui.label}>
                  {t('enrollment.wizard.profile.phone', 'Phone')} *
                </Label>
                <PhoneInput
                  id="phone"
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
                  className={`phone-input-wizard ${phoneError ? 'phone-input-wizard-error' : ''}`}
                  smartCaret={true}
                  numberInputProps={{
                    maxLength: 17
                  }}
                />
                <style jsx global>{`
                  .phone-input-wizard {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    min-width: 0;
                    height: 42px;
                    padding: 0 12px;
                    border: 1px solid #e9e3f1;
                    border-radius: 10px;
                    font-size: 14.5px;
                    font-family: var(--font-family-primary);
                    background-color: #fff;
                    color: #221a2e;
                    direction: ltr;
                    transition: border-color 0.2s ease;
                  }
                  .phone-input-wizard.phone-input-wizard-error {
                    border-color: #d0453a;
                    background-color: #fff6f5;
                  }
                  .phone-input-wizard .PhoneInputInput {
                    min-width: 0;
                    padding: 0;
                    border: none;
                    outline: none;
                    font-size: 14.5px;
                    font-family: var(--font-family-primary);
                    background-color: transparent;
                    color: #221a2e;
                  }
                  .phone-input-wizard .PhoneInputInput:focus {
                    outline: none;
                  }
                  .phone-input-wizard .PhoneInputCountry {
                    padding-right: 0.5rem;
                  }
                `}</style>
                {phoneError && <p className={`m-0 ${ui.err}`}>{phoneError}</p>}
              </div>

              <div className={ui.field}>
                <Label htmlFor="address" className={ui.label}>
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
                  className={`${ui.input} text-left [direction:ltr] [unicode-bidi:bidi-override] ${addressError ? ui.inputErr : ''}`}
                  style={{ direction: 'ltr', textAlign: 'left' }}
                  required
                />
                {addressError && <p className={`m-0 ${ui.err}`}>{addressError}</p>}
                {googleMapsError && !addressError && (
                  <p className="m-0 text-[12.5px] text-amber-700">{googleMapsError}</p>
                )}
              </div>
            </div>

            <div className={ui.actions}>
              <span className={ui.fine}>{t('enrollment.wizard.compact.profile.allRequired', 'All fields are required')}</span>
              <button type="button" className={ui.primary} onClick={handleSaveProfile} disabled={processing || emailExistsDetected}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('enrollment.wizard.profile.saving', 'Saving...')}
                  </>
                ) : (
                  t('enrollment.wizard.compact.continue', 'Continue')
                )}
              </button>
            </div>
          </section>
        );

      case 'payment': {
        // Check if this is a multi-plan enrollment
        const alternativePlanIds = enrollment?.alternative_payment_plan_ids || [];
        const hasMultiplePlans = alternativePlanIds.length > 1;
        const selectedPlan = availablePlans.find((p) => p.id === selectedPlanId);
        // Payments that start on a later date: what is charged today isn't
        // known here, so the "Paying today" line is left out.
        const startsLater = !!enrollment?.payment_start_date && new Date(enrollment.payment_start_date) > new Date();
        const selectedToday = selectedPlan && !startsLater ? describePlan(selectedPlan).today : null;

        return (
          <section className={ui.card}>
            <h2 className={ui.title}>{t('enrollment.wizard.compact.payment.title', 'How would you like to pay?')}</h2>

            {/* Multi-plan selection: one row per plan */}
            {hasMultiplePlans && (
              loadingPlans ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-[#5b3a8e]" />
                </div>
              ) : availablePlans.length === 0 ? (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                  <p className="m-0 text-sm text-yellow-800">
                    No payment plans available. Check console for debugging information.
                  </p>
                  <p className="m-0 mt-1 text-xs text-yellow-600">
                    Alternative plan IDs: {alternativePlanIds.join(', ') || 'none'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2" role="radiogroup" aria-label={t('enrollment.wizard.compact.payment.title', 'How would you like to pay?')}>
                  {availablePlans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    const { desc, amount, per } = describePlan(plan);
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition-colors ${
                          isSelected
                            ? 'border-[#5b3a8e] bg-[#fbf9fe] shadow-[inset_0_0_0_1px_#5b3a8e]'
                            : 'border-[#e9e3f1] bg-white hover:border-[#c7b9de]'
                        }`}
                      >
                        <span
                          className={`h-[18px] w-[18px] flex-none rounded-full border-2 ${
                            isSelected ? 'border-[#5b3a8e] bg-[#5b3a8e] shadow-[inset_0_0_0_3px_#fff]' : 'border-[#c7b9de]'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className="block font-bold">{plan.plan_name}</span>
                          {desc && <span className="block text-[13px] text-[#73698a]">{desc}</span>}
                        </span>
                        {amount && (
                          <span className="ms-auto whitespace-nowrap text-end text-[15px] font-semibold">
                            {amount}
                            {per && <small className="block text-xs font-normal text-[#73698a]">{per}</small>}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )
            )}

            {/* What is charged now (for the chosen plan) */}
            {hasMultiplePlans && selectedToday !== null && (
              <div className="flex justify-between gap-3 border-t border-dashed border-[#e9e3f1] px-0.5 pt-2 text-sm">
                <span>{t('enrollment.wizard.compact.payment.today', 'Paying today')}</span>
                <b>{selectedToday === 'none' ? t('enrollment.wizard.compact.payment.nothingToday', 'Nothing today') : money(selectedToday)}</b>
              </div>
            )}

            {/* A single plan: the total, as before */}
            {!hasMultiplePlans && (
              <div className="flex justify-between gap-3 border-t border-dashed border-[#e9e3f1] px-0.5 pt-2 text-sm">
                <span>{t('enrollment.wizard.compact.payment.total', 'Total')}</span>
                <b>{money(enrollment?.total_amount || 0)}</b>
              </div>
            )}

            {/* A scheduled membership price, so the buyer knows before paying */}
            {enrollment?.upcoming_price && (
              <div className="rounded-xl border border-[#f4dfab] bg-[#fff8e8] px-3 py-2 text-[13.5px] font-medium text-[#5c4208]">
                {t('enrollment.pricing.upcoming', 'From {date} the price will be {price}')
                  .replace('{date}', new Date(`${enrollment.upcoming_price.effective_date}T12:00:00`).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }))
                  .replace('{price}', money(enrollment.upcoming_price.amount))}
              </div>
            )}

            <div className={ui.actions}>
              {renderBack(processing || selectingPlan)}
              <button
                type="button"
                className={ui.primary}
                onClick={hasMultiplePlans ? handlePlanSelection : handlePaymentStep}
                disabled={selectingPlan || (hasMultiplePlans && !selectedPlanId)}
              >
                {selectingPlan ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('enrollment.wizard.payment.selecting', 'Selecting...')}
                  </>
                ) : (
                  t('enrollment.wizard.compact.payment.continue', 'Continue to payment')
                )}
              </button>
            </div>
            <span className={ui.fine}>{t('enrollment.wizard.compact.payment.fine', 'Payment is secure. The card is saved for the next payments.')}</span>
          </section>
        );
      }

      case 'password':
        return (
          <section className={ui.card}>
            <h2 className={ui.title}>{t('enrollment.wizard.compact.password.title', 'Create a portal password')}</h2>
            <p className={ui.sub}>
              {t('enrollment.wizard.compact.password.sub', 'You will use it to log in to the portal and find "{product}" there.').replace('{product}', enrollment?.product_name || '')}
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className={ui.field}>
                <Label htmlFor="password" className={ui.label}>
                  {t('enrollment.wizard.password.label', 'Password')} *
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={wizardData.password}
                  onChange={(e) => setWizardData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={8}
                  className={ui.input}
                />
              </div>

              <div className={ui.field}>
                <Label htmlFor="confirm_password" className={ui.label}>
                  {t('enrollment.wizard.password.confirm', 'Confirm Password')} *
                </Label>
                <Input
                  id="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`${ui.input} ${confirmPassword && wizardData.password !== confirmPassword ? ui.inputErr : ''}`}
                />
                {confirmPassword && wizardData.password !== confirmPassword && (
                  <p className={`m-0 ${ui.err}`}>{t('enrollment.wizard.password.mismatch', 'Passwords do not match')}</p>
                )}
              </div>
            </div>

            <span className="text-[12.5px] text-[#73698a]">
              {t('enrollment.wizard.compact.password.hint', 'At least 8 characters. Mixing letters and numbers is recommended.')}
            </span>

            <div className={ui.actions}>
              {renderBack(processing)}
              <button
                type="button"
                className={ui.primary}
                onClick={handlePasswordSubmit}
                disabled={processing || !wizardData.password || wizardData.password.length < 8 || wizardData.password !== confirmPassword}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('enrollment.wizard.password.creating', 'Creating Account...')}
                  </>
                ) : (
                  t('enrollment.wizard.compact.password.button', 'Create account and finish')
                )}
              </button>
            </div>
          </section>
        );

      case 'complete':
        // Logged in: no closing screen, just a moment while it finishes.
        if (skipWelcome) {
          return (
            <section className={ui.card}>
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#73698a]" role="status">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('enrollment.wizard.complete.finalizing', 'Finalizing your enrollment...')}</span>
              </div>
            </section>
          );
        }

        return (
          <section className={`${ui.card} justify-items-center text-center`}>
            <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#e6f4ec] text-[#1f7a4a]" aria-hidden="true">
              <Check className="h-7 w-7" strokeWidth={3} />
            </span>
            <h2 className="m-0 text-lg font-semibold">{t('enrollment.wizard.compact.complete.title', 'You are enrolled')}</h2>
            <p className="m-0 text-[13.5px] text-[#73698a]">
              {t('enrollment.wizard.compact.complete.sub', '"{product}" is waiting for you in the portal.').replace('{product}', enrollment?.product_name || '')}
            </p>
            <button type="button" className={ui.primary} onClick={handleComplete} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('enrollment.wizard.complete.finalizing', 'Finalizing your enrollment...')}
                </>
              ) : (
                t('enrollment.wizard.compact.complete.button', 'Go to the portal')
              )}
            </button>
          </section>
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

  // The product's picture and whether it can be paid in installments, for the
  // summary row. Not when embedded: there the portal card names the product.
  const [summaryExtra, setSummaryExtra] = useState<{ imageUrl: string | null; installments: boolean }>({ imageUrl: null, installments: false });
  useEffect(() => {
    if (embedded || !enrollmentToken) return;
    let cancelled = false;
    fetch(`/api/enrollments/token/${enrollmentToken}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setSummaryExtra({
          imageUrl: typeof data.product_image_url === 'string' && data.product_image_url ? data.product_image_url : null,
          installments: data.payment_plan_data?.type === 'deposit_then_plan',
        });
      })
      .catch(() => {
        // The summary just shows the colored tile.
      });
    return () => {
      cancelled = true;
    };
  }, [embedded, enrollmentToken]);

  // The school's name and logo for the top bar (not when embedded).
  const [org, setOrg] = useState<{ name: string; logoUrl: string | null } | null>(null);
  useEffect(() => {
    if (embedded) return;
    fetch('/api/public/tenant')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.tenant && setOrg({ name: data.tenant.name ?? '', logoUrl: data.tenant.logo_url ?? null }))
      .catch(() => undefined);
  }, [embedded]);

  if (loading) {
    return (
      <div
        className={embedded ? 'flex items-center justify-center py-10' : 'min-h-screen flex items-center justify-center bg-[#f6f3fa]'}
        dir={direction}
      >
        <Loader2 className="h-8 w-8 animate-spin text-[#5b3a8e]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={embedded ? 'py-2' : 'min-h-screen bg-[#f6f3fa] px-4 py-6 sm:py-10'} dir={direction}>
        <section className="mx-auto grid w-full max-w-[640px] gap-3 rounded-2xl border border-[#e9e3f1] bg-white p-4 text-[#221a2e]">
          <h1 className="m-0 text-lg font-semibold text-[#b3392f]">
            {t('enrollment.wizard.error.title', 'Error')}
          </h1>
          <p className="m-0 text-sm text-[#73698a]">{error}</p>
          <div>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="min-h-[44px] rounded-xl border border-[#d9cbee] bg-white px-5 text-[15px] font-semibold text-[#5b3a8e] hover:bg-[#faf7fd]"
            >
              {t('enrollment.wizard.error.dashboard', 'Go to Dashboard')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!enrollment) {
    return null;
  }

  const productTypeKeys = ['program', 'course', 'bundle', 'session_pack', 'lecture', 'workshop'];
  const productTypeLabel = productTypeKeys.includes(enrollment.product_type)
    ? t(`enrollment.wizard.compact.type.${enrollment.product_type}`, enrollment.product_type.replace('_', ' '))
    : '';
  const offersInstallments = summaryExtra.installments || (enrollment.alternative_payment_plan_ids || []).length > 1;

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
        /* Embedded in a portal page (directly, or framed): the step row and
           the step itself, inside the page's own card, with its spacing. */
        .wizard-embedded.wizard-root { min-height: 0; background: transparent; padding: 14px; }
        .wizard-embedded .wizard-inner { max-width: none; margin: 0; }
        /* The page's card already names the product: no summary, second title or help line. */
        .wizard-embedded .wizard-summary, .wizard-embedded .wizard-help,
        .wizard-embedded .wizard-step-title { display: none !important; }
        .wizard-embedded .wizard-step-card { border: 0; border-radius: 0; padding: 0; background: transparent; }
        .wizard-embedded .wizard-step-card > .wizard-step-title + p { margin-top: 0; }
      `}</style>
      {/* Slim top bar (approved mockup): the school and help. Not in the portal. */}
      {!embedded && (
        <header className="flex items-center justify-between gap-2.5 border-b border-[#e9e3f1] bg-white px-4 py-2.5 text-[#221a2e]" dir={direction}>
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            {org?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-[#f0a66a] via-[#b85fa8] to-[#5b3a8e]" aria-hidden />
            )}
            <span className="truncate">{org?.name}</span>
          </span>
          <a href="/contact" className="text-[13px] text-[#73698a] no-underline hover:text-[#221a2e]">
            {t('auth.login.help', 'Help')}
          </a>
        </header>
      )}
      <div className={`wizard-root ${embedded ? 'wizard-embedded' : 'min-h-[calc(100dvh-49px)] bg-[#f6f3fa] px-4 py-4 sm:py-8'}`} dir={direction}>
        <div className="wizard-inner mx-auto grid w-full min-w-0 max-w-[640px] gap-3 text-[#221a2e]">
          {/* What is being enrolled in */}
          <div className="wizard-summary flex items-center gap-3 rounded-[14px] border border-[#e9e3f1] bg-white px-3 py-2.5">
            {summaryExtra.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={summaryExtra.imageUrl} alt="" className="h-[46px] w-[46px] flex-none rounded-[10px] object-cover" />
            ) : (
              <span className="h-[46px] w-[46px] flex-none rounded-[10px] bg-gradient-to-br from-[#8d6cc7] to-[#5b3a8e]" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="m-0 truncate text-base font-semibold">{enrollment.product_name}</h1>
              {productTypeLabel && <div className="text-[13px] text-[#73698a]">{productTypeLabel}</div>}
            </div>
            {enrollment.payment_required && enrollment.total_amount > 0 && (
              <div className="flex-none whitespace-nowrap text-end text-base font-bold">
                {money(enrollment.total_amount)}
                {offersInstallments && (
                  <small className="block text-xs font-normal text-[#73698a]">
                    {t('enrollment.wizard.compact.installmentsAvailable', 'Installments available')}
                  </small>
                )}
              </div>
            )}
          </div>

          {renderStepBar()}

          {/* Embedded: the payment opens here, in place */}
          {showPaymentInline ? (
            <div className="min-w-0">
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
            </div>
          ) : (
            renderStepContent()
          )}

          <p className="wizard-help m-0 text-center text-[12.5px] text-[#73698a]">
            {t('enrollment.wizard.compact.help', 'Need help? Contact us and we will be glad to help.')}
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
