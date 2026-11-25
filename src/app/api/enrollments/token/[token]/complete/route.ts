import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { attachPersonIdentity } from '@/lib/persons/attach-identity';
import type Stripe from 'stripe';
import { getStripeClient } from '@/lib/payments/getStripeClient';
import { verifyDuePaid } from '@/lib/payments/dueSchedules';
import { loadIntegration } from '@/lib/integrations/store';
import { attachPendingChild } from '@/lib/family/coachingEnrollment';
import { clubLandingFor } from '@/lib/payments/clubLanding';
import { NEW_CLIENT_ROLE } from '@/lib/auth/roles';

// Creates the account and talks to Stripe, contacts and email in one request;
// the short default limit could cut it off halfway at busy times.
export const maxDuration = 60;

/**
 * POST /api/enrollments/token/:token/complete
 *
 * Complete the enrollment wizard and CREATE USER ACCOUNT
 * This is the ONLY endpoint that creates the user account
 * NO AUTHENTICATION REQUIRED - uses token validation
 * Uses admin client to bypass RLS since users are not authenticated yet
 *
 * MEMORY-BASED WIZARD APPROACH:
 * - Wizard keeps all data in React state during the flow
 * - This endpoint receives ALL wizard data in a single request
 * - Profile data, DocuSign envelope ID, and password all provided in request body
 * - This is the ONLY database write for the entire wizard flow
 *
 * Request Body:
 * - password: string (min 8 characters)
 * - profile: { first_name, last_name, email, phone, address }
 * - docusignEnvelopeId: string (optional, if signature was required)
 *
 * This should only be called after all required steps are complete:
 * - Signature (if required) - status checked in database
 * - Profile completion - validated from request body
 * - Payment (if required) - status checked in database
 *
 * Creates:
 * 1. Supabase Auth user with email/password
 * 2. User profile in users table
 * 3. Links enrollment to new user
 * 4. Saves wizard data to enrollment (single write)
 * 5. Activates enrollment
 * 6. Auto-logins the new user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Use admin client to bypass RLS - enrollment links are accessed by unauthenticated users
    const supabase = createAdminClient();
    const body = await request.json();
    const {
      password,
      profile,
      docusignEnvelopeId,
      isExistingUser,
      // Cross-platform identity (forwarded by the wizard frontend when
      // available; both optional — the helper falls back to email-based
      // get-or-create on IParentingSchool).
      person_token,
      source,
    } = body;

    console.log('[Enrollment Complete] Received wizard data:', {
      hasPassword: !!password,
      hasProfile: !!profile,
      hasDocusignEnvelopeId: !!docusignEnvelopeId,
      isExistingUser,
    });

    // TWO ENROLLMENT FLOWS:
    // 1. Existing user (isExistingUser=true): Skip account creation, just activate enrollment
    // 2. New user (isExistingUser=false): Create account and activate enrollment

    // Validate password ONLY for new users
    if (!isExistingUser && (!password || password.length < 8)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate profile data ONLY for new users (existing users already have profile)
    if (!isExistingUser && !profile) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      );
    }

    // Get enrollment with product details

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        product_id,
        total_amount,
        paid_amount,
        currency,
        status,
        payment_status,
        signature_status,
        tenant_id,
        token_expires_at,
        wizard_profile_data,
        stripe_setup_intent_id,
        stripe_customer_id,
        is_parent,
        payment_plan_id,
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          course_id,
          program_id,
          requires_signature,
          payment_model,
          crm_tag_slugs,
          metadata
        )
      `)
      .eq('enrollment_token', params.token)
      .single();

    console.log('[Enrollment Complete] Query result:', {
      hasEnrollment: !!enrollment,
      error: enrollmentError,
      enrollmentId: enrollment?.id
    });

    if (enrollmentError || !enrollment) {
      console.error('[Enrollment Complete] Failed to find enrollment:', {
        token: params.token,
        error: enrollmentError
      });
      return NextResponse.json({ error: 'Invalid enrollment token' }, { status: 404 });
    }

    // Verify token not expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Enrollment token has expired' }, { status: 410 });
    }

    // An enrollment the school cancelled or suspended can't be switched back
    // on by reopening the enrollment link.
    if (enrollment.status === 'cancelled' || enrollment.status === 'suspended') {
      return NextResponse.json(
        { error: 'This enrollment is no longer open. Please contact the school.' },
        { status: 409 }
      );
    }

    const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;

    // Use profile data from request body (memory-based wizard approach)
    const profileData = profile;

    console.log('[Enrollment Complete] Address parts received:', {
      address: profileData?.address ?? null,
      address_line1: profileData?.address_line1 ?? null,
      city: profileData?.city ?? null,
      region: profileData?.region ?? null,
      postal_code: profileData?.postal_code ?? null,
      country: profileData?.country ?? null,
    });

    // Validate all required steps are complete

    // 1. Check signature (if required)
    if (product.requires_signature && enrollment.signature_status !== 'completed') {
      return NextResponse.json(
        { error: 'Signature required but not completed' },
        { status: 400 }
      );
    }

    // 2. Check profile completion ONLY for new users (existing users already have complete profile)
    if (!isExistingUser) {
      const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'address'];
      const profileComplete = requiredFields.every(field => {
        const value = profileData[field];
        return value !== null && value !== undefined && value !== '';
      });

      if (!profileComplete) {
        return NextResponse.json(
          { error: 'Profile incomplete - please complete all required fields' },
          { status: 400 }
        );
      }
    }

    // 3. Check payment (if required)
    // CRITICAL: Parent enrollments skip payment verification (they can save cards but aren't charged)
    const isParentEnrollment = enrollment.is_parent === true;
    const paymentRequired = !isParentEnrollment && product.payment_model !== 'free' && enrollment.total_amount > 0;
    const usedSetupIntent = !!enrollment.stripe_setup_intent_id;

    console.log('[Enrollment Complete] Payment check:', {
      is_parent: isParentEnrollment,
      payment_model: product.payment_model,
      total_amount: enrollment.total_amount,
      paid_amount: enrollment.paid_amount,
      paymentRequired,
      usedSetupIntent,
    });

    if (isParentEnrollment) {
      console.log('[Enrollment Complete] Parent enrollment detected - skipping payment verification');
      // Parent enrollments can save/use cards but aren't charged during enrollment
      // Card save verification still happens below if usedSetupIntent is true
    }

    // A card saved for later payments must really be saved.
    if (usedSetupIntent) {
      console.log('[Enrollment Complete] Setup Intent detected - verifying card was saved');

      try {
        // Get Stripe credentials
        const { data: integration } = await loadIntegration(enrollment.tenant_id, 'stripe');

        if (integration?.credentials?.secret_key) {
          const Stripe = (await import('stripe')).default;
          const stripe = new Stripe(integration.credentials.secret_key, {
            apiVersion: '2023-10-16',
          });

          // Retrieve Setup Intent to verify it succeeded
          const setupIntent = await stripe.setupIntents.retrieve(enrollment.stripe_setup_intent_id);

          if (setupIntent.status !== 'succeeded') {
            console.error('[Enrollment Complete] Setup Intent not succeeded:', setupIntent.status);
            return NextResponse.json(
              { error: `Card setup ${setupIntent.status}. Please complete payment setup.` },
              { status: 400 }
            );
          }

          console.log('[Enrollment Complete] Setup Intent succeeded - card saved for future payments');

          // Attach payment method to customer if not already attached
          const paymentMethodId = setupIntent.payment_method as string;
          if (paymentMethodId && enrollment.stripe_customer_id) {
            try {
              // Check if already attached
              const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

              if (!paymentMethod.customer || paymentMethod.customer !== enrollment.stripe_customer_id) {
                // Attach to customer
                await stripe.paymentMethods.attach(paymentMethodId, {
                  customer: enrollment.stripe_customer_id
                });
                console.log('[Enrollment Complete] Attached payment method to customer');
              }

              // Set as default payment method
              await stripe.customers.update(enrollment.stripe_customer_id, {
                invoice_settings: { default_payment_method: paymentMethodId }
              });
              console.log('[Enrollment Complete] Set as default payment method');

            } catch (attachError) {
              console.error('[Enrollment Complete] Error attaching payment method:', attachError);
              // Don't fail enrollment - card is saved, just may not be default
            }
          }

        } else {
          console.error('[Enrollment Complete] Stripe integration not configured');
          return NextResponse.json(
            { error: 'Payment processing not configured' },
            { status: 500 }
          );
        }
      } catch (error: any) {
        console.error('[Enrollment Complete] Error verifying Setup Intent:', error);
        return NextResponse.json(
          { error: 'Failed to verify payment setup' },
          { status: 500 }
        );
      }
    }

    // Pay as you go (a per-session plan): nothing is charged at enrollment,
    // the card must be saved (verified above), and each session is charged
    // when it is held.
    // A plan of that type, or the product's own payment setting.
    let perSession = product.payment_model === 'per_session';
    if (!perSession && (enrollment as any).payment_plan_id) {
      const { data: plan } = await supabase.from('payment_plans').select('plan_type').eq('id', (enrollment as any).payment_plan_id).maybeSingle();
      perSession = plan?.plan_type === 'per_session';
    }
    if (perSession && paymentRequired && !usedSetupIntent) {
      return NextResponse.json({ error: 'Save a card to finish: each session is charged to it after it is held.' }, { status: 400 });
    }

    // Everything due today or earlier must be paid. This one rule covers
    // one-time payments, deposits and a plan's first installment, and asks
    // Stripe directly when a payment isn't marked paid yet. Saving a card is
    // only enough when nothing is due yet.
    if (paymentRequired && !perSession) {
      let stripeClient: Stripe | null = null;
      try {
        stripeClient = (await getStripeClient(enrollment.tenant_id)).stripe;
      } catch {
        stripeClient = null;
      }
      const due = await verifyDuePaid(supabase, stripeClient, enrollment.id, enrollment.product_id);
      if (!due.ok) {
        return NextResponse.json({ error: due.error }, { status: due.status });
      }
    }

    // ✅ ALL VALIDATION PASSED

    let userId: string;
    let authData: any = null;

    if (!isExistingUser) {
      // NEW USER FLOW: Create account with email/password

      // Check if user with this email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', profileData.email)
        .single();

      if (existingUser) {
        return NextResponse.json(
          {
            error: 'An account with this email already exists. Please login instead.',
            existing_user: true,
            login_url: `/login?email=${encodeURIComponent(profileData.email)}`
          },
          { status: 409 }
        );
      }

      // Create Supabase Auth user using admin.createUser to bypass email confirmation
      const { data: newAuthData, error: authError } = await supabase.auth.admin.createUser({
        email: profileData.email,
        password: password,
        email_confirm: true, // Mark email as confirmed immediately
        user_metadata: {
          first_name: profileData.first_name,
          last_name: profileData.last_name
        }
      });

      if (authError || !newAuthData.user) {
        console.error('Error creating auth user:', authError);
        return NextResponse.json(
          { error: 'Failed to create user account: ' + (authError?.message || 'Unknown error') },
          { status: 500 }
        );
      }

      console.log('[Enrollment Complete] Created auth user:', newAuthData.user.id);

      // Create user profile in users table BEFORE signing in
      // This must happen while we still have admin privileges
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: newAuthData.user.id,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          location: profileData.address, // Store full address in location field
          tenant_id: enrollment.tenant_id,
          role: NEW_CLIENT_ROLE,
          status: 'active', // Set to active immediately since enrollment is verified
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (userError) {
        console.error('Error creating user profile:', userError);
        // If user profile creation fails, we should clean up the auth user
        // But Supabase doesn't provide easy way to delete auth user from server
        // This is an edge case that should be handled by admin cleanup
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }

      // CRITICAL: Add user to tenant_users table BEFORE signing in
      // This must happen while we still have admin privileges (RLS bypass)
      const { error: tenantUserError } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: enrollment.tenant_id,
          user_id: newAuthData.user.id,
          role: NEW_CLIENT_ROLE,
          status: 'active',
          joined_at: new Date().toISOString(),
        });

      if (tenantUserError) {
        console.error('Error adding user to tenant_users:', tenantUserError);
        // This is critical for login to work - return error
        return NextResponse.json(
          { error: 'Failed to add user to tenant. Please contact support.' },
          { status: 500 }
        );
      }

      console.log('[Enrollment Complete] Created user profile and added to tenant_users:', newAuthData.user.id);

      // NOW sign in the user to get a session for auto-login
      // This happens AFTER all database writes that require admin privileges
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: password
      });

      if (signInError || !signInData.session) {
        console.error('[Enrollment Complete] Error signing in new user:', signInError);
        // User was created but couldn't sign in - this is ok, they can login manually
        // Don't fail the enrollment, just return without session
        authData = { user: newAuthData.user, session: null };
      } else {
        // Successfully got session for auto-login
        authData = signInData;
        console.log('[Enrollment Complete] Created session for auto-login');
      }

      userId = newAuthData.user.id;
      console.log('[Enrollment Complete] Created new user account and added to tenant_users:', userId);

      // CRITICAL: Link Stripe customer to newly created user
      // The deposit payment was made BEFORE the account was created
      // So the Stripe customer exists but isn't linked to the user yet
      // This is needed for future installment payments
      try {
        console.log('[Enrollment Complete] Linking Stripe customer to newly created user...');

        // Get ANY paid payment schedule to find the Stripe payment intent
        // This handles deposit, one-time, subscription, or any payment type
        const { data: depositSchedule } = await supabase
          .from('payment_schedules')
          .select('stripe_payment_intent_id')
          .eq('enrollment_id', enrollment.id)
          .eq('status', 'paid')
          .order('due_date', { ascending: true }) // Get the first payment
          .limit(1)
          .single();

        if (depositSchedule?.stripe_payment_intent_id) {
          console.log('[Enrollment Complete] Found paid payment intent:', depositSchedule.stripe_payment_intent_id);

          // Get Stripe credentials
          const { data: integration } = await loadIntegration(enrollment.tenant_id, 'stripe');

          if (integration?.credentials?.secret_key) {
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(integration.credentials.secret_key, {
              apiVersion: '2023-10-16',
            });

            // Retrieve payment intent to get customer ID
            const paymentIntent = await stripe.paymentIntents.retrieve(depositSchedule.stripe_payment_intent_id);

            if (paymentIntent.customer) {
              const stripeCustomerId = paymentIntent.customer as string;

              // Update Stripe customer with actual user email (was "Guest" during payment)
              try {
                await stripe.customers.update(stripeCustomerId, {
                  email: profileData.email,
                  name: `${profileData.first_name} ${profileData.last_name}`,
                  metadata: {
                    user_id: userId,
                    tenant_id: enrollment.tenant_id,
                  }
                });
                console.log(`[Enrollment Complete] ✓ Updated Stripe customer ${stripeCustomerId} with user email`);
              } catch (stripeUpdateError) {
                console.error('[Enrollment Complete] Error updating Stripe customer:', stripeUpdateError);
                // Continue anyway - customer is functional even with guest email
              }

              // Update user with Stripe customer ID
              const { error: updateUserError } = await supabase
                .from('users')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', userId);

              if (updateUserError) {
                console.error('[Enrollment Complete] Error linking Stripe customer to user:', updateUserError);
                // Don't fail enrollment - this can be fixed later by admin
              } else {
                console.log(`[Enrollment Complete] ✓ Linked Stripe customer ${stripeCustomerId} to user ${userId}`);
              }
            } else {
              console.warn('[Enrollment Complete] ⚠️ Payment intent has no customer ID');
            }
          } else {
            console.warn('[Enrollment Complete] ⚠️ Stripe integration not configured');
          }
        } else {
          console.log('[Enrollment Complete] No paid payment found - might be free enrollment');
        }
      } catch (stripeError) {
        console.error('[Enrollment Complete] Error linking Stripe customer:', stripeError);
        // Don't fail enrollment - this can be fixed later by admin or webhook
      }

    } else {
      // EXISTING USER FLOW: User account already exists, just activate enrollment
      // enrollment.user_id should already be set by admin
      if (!enrollment.user_id) {
        return NextResponse.json(
          { error: 'Enrollment user_id missing for existing user flow' },
          { status: 400 }
        );
      }

      userId = enrollment.user_id;
      console.log('[Enrollment Complete] Activating enrollment for existing user:', userId);

      // CRITICAL: Update Stripe customer with user info for existing users too
      // The payment was made before completion, so Stripe customer still shows "Guest"
      try {
        console.log('[Enrollment Complete] Updating Stripe customer for existing user...');

        // Get user profile to update Stripe customer
        const { data: userProfile } = await supabase
          .from('users')
          .select('email, first_name, last_name, stripe_customer_id')
          .eq('id', userId)
          .single();

        if (!userProfile) {
          console.warn('[Enrollment Complete] User profile not found for existing user');
        } else {
          // Get ANY paid payment schedule to find the Stripe payment intent
          // This handles deposit, one-time, subscription, or any payment type
          const { data: depositSchedule } = await supabase
            .from('payment_schedules')
            .select('stripe_payment_intent_id')
            .eq('enrollment_id', enrollment.id)
            .eq('status', 'paid')
            .order('due_date', { ascending: true }) // Get the first payment
            .limit(1)
            .single();

          if (depositSchedule?.stripe_payment_intent_id) {
            console.log('[Enrollment Complete] Found paid payment intent:', depositSchedule.stripe_payment_intent_id);

            // Get Stripe credentials
            const { data: integration } = await loadIntegration(enrollment.tenant_id, 'stripe');

            if (integration?.credentials?.secret_key) {
              const Stripe = (await import('stripe')).default;
              const stripe = new Stripe(integration.credentials.secret_key, {
                apiVersion: '2023-10-16',
              });

              // Retrieve payment intent to get customer ID
              const paymentIntent = await stripe.paymentIntents.retrieve(depositSchedule.stripe_payment_intent_id);

              if (paymentIntent.customer) {
                const stripeCustomerId = paymentIntent.customer as string;

                // Update Stripe customer with actual user info (was "Guest" during payment)
                try {
                  await stripe.customers.update(stripeCustomerId, {
                    email: userProfile.email,
                    name: `${userProfile.first_name} ${userProfile.last_name}`,
                    metadata: {
                      user_id: userId,
                      tenant_id: enrollment.tenant_id,
                    }
                  });
                  console.log(`[Enrollment Complete] ✓ Updated Stripe customer ${stripeCustomerId} for existing user`);
                } catch (stripeUpdateError) {
                  console.error('[Enrollment Complete] Error updating Stripe customer:', stripeUpdateError);
                }

                // Update user with Stripe customer ID if not already set
                if (!userProfile.stripe_customer_id) {
                  const { error: updateUserError } = await supabase
                    .from('users')
                    .update({ stripe_customer_id: stripeCustomerId })
                    .eq('id', userId);

                  if (updateUserError) {
                    console.error('[Enrollment Complete] Error linking Stripe customer to user:', updateUserError);
                  } else {
                    console.log(`[Enrollment Complete] ✓ Linked Stripe customer ${stripeCustomerId} to existing user`);
                  }
                }
              }
            }
          }
        }
      } catch (stripeError) {
        console.error('[Enrollment Complete] Error updating Stripe customer for existing user:', stripeError);
        // Don't fail enrollment - this can be fixed later
      }
    }

    // Activate enrollment and save wizard data
    const enrollmentUpdate: any = {
      user_id: userId, // Link to new or existing user
      status: 'active',
      enrolled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // The link has done its job. It stays usable for one more hour (the
      // wizard's last screen reads it), then stops working instead of
      // exposing the client's details for the rest of the week.
      token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    // Save profile data ONLY for new users (existing users already have profile in users table)
    if (!isExistingUser && profileData) {
      enrollmentUpdate.wizard_profile_data = profileData;
    }

    // Save DocuSign envelope ID if provided
    if (docusignEnvelopeId) {
      enrollmentUpdate.docusign_envelope_id = docusignEnvelopeId;
    }


    const { error: updateError } = await supabase
      .from('enrollments')
      .update(enrollmentUpdate)
      .eq('id', enrollment.id);

    if (updateError) {
      console.error('Error activating enrollment:', updateError);
      return NextResponse.json(
        { error: 'Failed to activate enrollment' },
        { status: 500 }
      );
    }

    // Child coaching opened for a parent who had no account: the account
    // exists now, so the child is created under it and linked. A failure is
    // logged for the team; it never blocks the enrollment.
    const childLink = await attachPendingChild(enrollment.id, userId);
    if (!childLink.ok) {
      console.error('[Enrollment Complete] Child not linked:', enrollment.id, childLink.error);
    }

    // Trigger enrollment.completed event
    try {
      const { processTriggerEvent } = await import('@/lib/email/triggerEngine');
      await processTriggerEvent({
        eventType: 'enrollment.completed',
        tenantId: enrollment.tenant_id,
        eventData: {
          enrollmentId: enrollment.id,
          userId: userId,
          productId: enrollment.product_id,
          productName: product?.title || '',
          productType: product?.type || '',
          totalAmount: enrollment.total_amount,
          paidAmount: enrollment.paid_amount,
          currency: enrollment.currency,
          paymentStatus: enrollment.payment_status,
          email: profileData?.email || profile?.email,
          userName: profileData?.first_name || profile?.first_name,
          languageCode: profileData?.language || 'en',
        },
        userId: userId,
        metadata: {
          isExistingUser,
          completedAt: new Date().toISOString(),
        },
      });
    } catch (triggerError) {
      console.error('Error processing enrollment.completed trigger:', triggerError);
      // Don't fail enrollment if trigger fails
    }

    // Log successful enrollment completion
    await supabase.from('audit_events').insert({
      tenant_id: enrollment.tenant_id,
      user_id: userId,
      action: 'enrollment_completed',
      resource_type: 'enrollment',
      resource_id: enrollment.id,
      details: {
        product_id: product.id,
        product_name: product.title,
        via_wizard: true,
        unauthenticated_flow: !isExistingUser,
        existing_user_flow: isExistingUser
      },
      created_at: new Date().toISOString()
    });

    // Determine dashboard access based on user's total enrollments
    // Dashboard access if user has at least ONE non-parent enrollment
    let shouldRedirectToDashboard = true; // Default to dashboard
    let showConfirmation = false;

    try {
      console.log('[Enrollment Complete] Checking dashboard access for user:', userId);

      // Get ALL active enrollments for this user
      const { data: userEnrollments } = await supabase
        .from('enrollments')
        .select('id, is_parent')
        .eq('user_id', userId)
        .eq('status', 'active');

      console.log('[Enrollment Complete] Found enrollments:', userEnrollments?.length || 0);

      // Check if user has at least one non-parent enrollment
      const hasStudentEnrollment = userEnrollments?.some(e => {
        const isParent = e.is_parent === true;
        console.log('[Enrollment Complete] Enrollment', e.id, '- is_parent:', isParent);
        return !isParent; // Has dashboard access if enrollment is NOT a parent enrollment
      }) || false;

      console.log('[Enrollment Complete] Has non-parent enrollment (dashboard access):', hasStudentEnrollment);

      shouldRedirectToDashboard = hasStudentEnrollment;
      showConfirmation = !hasStudentEnrollment;

    } catch (error) {
      console.error('[Enrollment Complete] Error checking dashboard access:', error);
      // On error, default to dashboard redirect (safe default)
      shouldRedirectToDashboard = true;
      showConfirmation = false;
    }

    // The CRM tags this enrollment brought, saved on it (when it has none
    // yet), so the admin can find every enrollment with tag X later. An
    // error (the column's SQL not run yet) changes nothing else.
    if (Array.isArray(product?.crm_tag_slugs) && product.crm_tag_slugs.length > 0) {
      await supabase
        .from('enrollments')
        .update({ crm_tag_slugs: product.crm_tag_slugs })
        .eq('id', enrollment.id)
        .eq('crm_tag_slugs', '{}')
        .then(() => undefined, () => undefined);
    }

    // ─── Cross-platform person identity ───────────────────────────────
    // For new users: resolve a person_id via IParentingSchool (signed
    // token OR get-or-create by email) and stamp users.person_id.
    // Emit person.enrolled and person.became_customer (this route always
    // represents a finalised enrollment — free OR paid).
    // For existing users: the same check by email (refresh), so a contact
    // deleted from the CRM is created again and the link is updated.
    try {
      if (!isExistingUser) {
        const profileEmail = profileData?.email ?? profile?.email;
        if (profileEmail) {
          await attachPersonIdentity({
            supabase,
            userId,
            email: profileEmail,
            firstName: profileData?.first_name ?? null,
            lastName: profileData?.last_name ?? null,
            phone: profileData?.phone ?? null,
            locale: profileData?.language ?? null,
            country: profileData?.country ?? null,
            // Structured address components from Google Places. The
            // wizard parses address_components into these fields; we
            // forward each one so the CRM admin's contact-detail
            // shows separate inputs. address_line1 falls back to the
            // formatted single-string address when Google didn't
            // return a street_number + route (e.g., when the user
            // typed a city-level address without a street).
            addressLine1: profileData?.address_line1 ?? profileData?.address ?? null,
            city: profileData?.city ?? null,
            region: profileData?.region ?? null,
            postalCode: profileData?.postal_code ?? null,
            personToken: person_token ?? null,
            source: source ?? null,
            emitEnrolledEvent: true,
            emitBecameCustomer: {
              firstPurchaseAt: new Date().toISOString(),
              productSummary: {
                product_name: product?.title ?? "",
                product_type: product?.type ?? null,
                amount: enrollment.total_amount ?? 0,
                currency: (enrollment.currency ?? "USD").toUpperCase(),
              },
              crmTagSlugs: Array.isArray(product?.crm_tag_slugs)
                ? product.crm_tag_slugs
                : [],
            },
          });
        }
      } else {
        // Existing user: check the CRM by email every time. It finds the
        // contact (and updates it with these details) or creates it again
        // if it is gone; a changed id replaces the saved one. Then the
        // enrollment, the purchase and the product's tags are sent.
        const { data: linkedUser } = await supabase
          .from('users')
          .select('person_id, email, first_name, last_name, phone, location')
          .eq('id', userId)
          .maybeSingle();
        const email = linkedUser?.email ?? profileData?.email ?? profile?.email;
        if (email) {
          await attachPersonIdentity({
            supabase,
            userId,
            email,
            firstName: profileData?.first_name ?? linkedUser?.first_name ?? null,
            lastName: profileData?.last_name ?? linkedUser?.last_name ?? null,
            phone: profileData?.phone ?? linkedUser?.phone ?? null,
            locale: profileData?.language ?? null,
            country: profileData?.country ?? null,
            addressLine1: profileData?.address_line1 ?? profileData?.address ?? (linkedUser as { location?: string | null } | null)?.location ?? null,
            city: profileData?.city ?? null,
            region: profileData?.region ?? null,
            postalCode: profileData?.postal_code ?? null,
            personToken: person_token ?? null,
            source: source ?? null,
            refresh: true,
            emitEnrolledEvent: true,
            emitBecameCustomer: {
              firstPurchaseAt: new Date().toISOString(),
              productSummary: {
                product_name: product?.title ?? "",
                product_type: product?.type ?? null,
                amount: enrollment.total_amount ?? 0,
                currency: (enrollment.currency ?? "USD").toUpperCase(),
              },
              crmTagSlugs: Array.isArray(product?.crm_tag_slugs)
                ? product.crm_tag_slugs
                : [],
            },
          });
        }
      }
    } catch (identityError) {
      // Cross-platform identity is best-effort — never block the
      // enrollment-complete response on a downstream notification glitch.
      console.error('[Enrollment Complete] person-identity attach failed:', identityError);
    }

    // A club membership lands on the club's own page in the portal.
    const clubLanding =
      !enrollment.is_parent && shouldRedirectToDashboard
        ? await clubLandingFor(supabase, product as any, (enrollment as any).payment_plan_id).catch(() => null)
        : null;

    return NextResponse.json({
      success: true,
      enrollment_id: enrollment.id,
      user_id: userId,
      status: 'active',
      // Child coaching lands on the child's page in the portal (intake next);
      // a club on the club's page.
      redirect_url: childLink.ok && childLink.child_id
        ? `/children/${childLink.child_id}?enrollment=complete`
        : clubLanding ?? (shouldRedirectToDashboard ? '/dashboard' : null),
      show_confirmation: showConfirmation,
      session: authData?.session || null, // Return session for auto-login (only for new users)
      message: isExistingUser
        ? 'Enrollment activated successfully'
        : 'Account created and enrollment activated successfully'
    });

  } catch (error: any) {
    console.error('Error in POST /api/enrollments/token/:token/complete:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
