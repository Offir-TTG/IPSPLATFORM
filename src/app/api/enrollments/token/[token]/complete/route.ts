import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

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
    const { password, profile, docusignEnvelopeId, isExistingUser } = body;

    console.log('[Enrollment Complete] Received wizard data:', {
      hasPassword: !!password,
      hasProfile: !!profile,
      hasDocusignEnvelopeId: !!docusignEnvelopeId,
      isExistingUser,
      profile
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
    console.log('[Enrollment Complete] Querying enrollment with token:', params.token);

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
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          requires_signature,
          payment_model,
          keap_tag,
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

    const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;

    // Use profile data from request body (memory-based wizard approach)
    const profileData = profile;

    console.log('[Enrollment Complete] Using profile data from request body:', profileData);

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

    // If Setup Intent was used (installment plan with no deposit),
    // skip payment amount verification but verify card was saved
    if (usedSetupIntent) {
      console.log('[Enrollment Complete] Setup Intent detected - verifying card was saved');

      try {
        // Get Stripe credentials
        const { data: integration } = await supabase
          .from('integrations')
          .select('credentials')
          .eq('tenant_id', enrollment.tenant_id)
          .eq('integration_key', 'stripe')
          .single();

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
    } else if (paymentRequired) {
      // Check if this enrollment has a deposit payment schedule
      // This handles cases where product payment_model might be 'one_time' but enrollment uses deposit plan
      const { data: depositScheduleCheck } = await supabase
        .from('payment_schedules')
        .select('id, payment_type, status')
        .eq('enrollment_id', enrollment.id)
        .eq('payment_type', 'deposit')
        .single();

      const hasDepositSchedule = !!depositScheduleCheck;
      const isDepositPlan = product.payment_model === 'deposit_then_plan' || hasDepositSchedule;

      console.log('[Enrollment Complete] Is deposit plan?', isDepositPlan, 'payment_model:', product.payment_model, 'hasDepositSchedule:', hasDepositSchedule);

      if (isDepositPlan) {
        // For deposit plans: Check if deposit payment is completed
        // Use retry mechanism to handle race condition with webhook processing
        console.log('[Enrollment Complete] Checking deposit schedule for enrollment:', enrollment.id);

        let depositSchedule: any = null;
        let retryCount = 0;
        const maxRetries = 10; // Increased from 3 to handle webhook delays
        const retryDelay = 2000; // Increased to 2 seconds (total 20s wait time)

        while (retryCount < maxRetries) {
          const { data, error: scheduleError } = await supabase
            .from('payment_schedules')
            .select('*')
            .eq('enrollment_id', enrollment.id)
            .eq('payment_type', 'deposit')
            .single();

          console.log(`[Enrollment Complete] Deposit check attempt ${retryCount + 1}/${maxRetries}:`, {
            found: !!data,
            status: data?.status,
            scheduleId: data?.id,
            error: scheduleError,
          });

          if (data && data.status === 'paid') {
            depositSchedule = data;
            break;
          }

          // If not paid yet and we have retries left, wait and try again
          if (retryCount < maxRetries - 1) {
            console.log(`[Enrollment Complete] Deposit not paid yet, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }

          retryCount++;
        }

        if (!depositSchedule || depositSchedule.status !== 'paid') {
          console.error('[Enrollment Complete] Deposit not paid after retries:', {
            found: !!depositSchedule,
            status: depositSchedule?.status,
            scheduleId: depositSchedule?.id,
            retriesAttempted: retryCount,
          });

          // FALLBACK: Check Stripe API directly if webhook hasn't updated database yet
          // This handles race conditions where payment succeeds but webhook is delayed
          if (depositSchedule?.stripe_payment_intent_id) {
            console.log('[Enrollment Complete] Checking payment status directly from Stripe API...');

            try {
              // Get Stripe credentials
              const { data: integration } = await supabase
                .from('integrations')
                .select('credentials')
                .eq('tenant_id', enrollment.tenant_id)
                .eq('integration_key', 'stripe')
                .single();

              if (integration?.credentials?.secret_key) {
                const Stripe = (await import('stripe')).default;
                const stripe = new Stripe(integration.credentials.secret_key, {
                  apiVersion: '2023-10-16',
                });

                // Retrieve payment intent from Stripe
                const paymentIntent = await stripe.paymentIntents.retrieve(depositSchedule.stripe_payment_intent_id);

                console.log('[Enrollment Complete] Stripe API payment intent status:', {
                  id: paymentIntent.id,
                  status: paymentIntent.status,
                  amount: paymentIntent.amount,
                });

                // If payment succeeded in Stripe, manually process the webhook logic
                if (paymentIntent.status === 'succeeded') {
                  console.log('[Enrollment Complete] ⚠️ Payment succeeded in Stripe but webhook not processed yet');
                  console.log('[Enrollment Complete] Manually processing payment to unblock user...');

                  // Create payment record if it doesn't exist
                  const { data: existingPayment } = await supabase
                    .from('payments')
                    .select('id')
                    .eq('stripe_payment_intent_id', paymentIntent.id)
                    .eq('enrollment_id', enrollment.id)
                    .single();

                  let paymentRecordId: string | undefined = existingPayment?.id;

                  if (!existingPayment) {
                    // Create payment record with Stripe IDs
                    const stripeInvoiceId = paymentIntent.invoice as string | null;
                    const stripeCustomerId = paymentIntent.customer as string | null;
                    const chargeId = (paymentIntent as any).charges?.data?.[0]?.id;

                    const { data: newPayment, error: paymentError } = await supabase
                      .from('payments')
                      .insert({
                        tenant_id: enrollment.tenant_id,
                        enrollment_id: enrollment.id,
                        payment_schedule_id: depositSchedule.id,
                        product_id: enrollment.product_id,
                        stripe_payment_intent_id: paymentIntent.id,
                        stripe_invoice_id: stripeInvoiceId,
                        stripe_customer_id: stripeCustomerId,
                        amount: paymentIntent.amount / 100,
                        currency: paymentIntent.currency.toUpperCase(),
                        payment_type: depositSchedule.payment_type,
                        status: 'succeeded',
                        installment_number: parseInt(paymentIntent.metadata?.payment_number || '1'),
                        paid_at: new Date().toISOString(),
                        metadata: {
                          payment_type: depositSchedule.payment_type,
                          schedule_id: depositSchedule.id,
                          stripe_payment_method: paymentIntent.payment_method,
                          charge_id: chargeId,
                          manually_processed: true, // Flag to indicate this was processed by fallback
                        },
                      })
                      .select('id')
                      .single();

                    if (paymentError) {
                      console.error('[Enrollment Complete] Error creating payment record:', paymentError);
                    } else {
                      paymentRecordId = newPayment?.id;
                      console.log('[Enrollment Complete] ✓ Created payment record:', paymentRecordId);
                    }
                  }

                  // Update payment schedule to paid with Stripe IDs
                  if (paymentRecordId) {
                    const stripeInvoiceId = paymentIntent.invoice as string | null;

                    const { error: updateScheduleError } = await supabase
                      .from('payment_schedules')
                      .update({
                        status: 'paid',
                        paid_date: new Date().toISOString(),
                        payment_id: paymentRecordId,
                        stripe_invoice_id: stripeInvoiceId,
                        stripe_payment_intent_id: paymentIntent.id,
                      })
                      .eq('id', depositSchedule.id)
                      .eq('tenant_id', enrollment.tenant_id);

                    if (updateScheduleError) {
                      console.error('[Enrollment Complete] Error updating schedule:', updateScheduleError);
                    } else {
                      console.log('[Enrollment Complete] ✓ Updated payment schedule to paid');
                      // Update depositSchedule object so the check below passes
                      depositSchedule.status = 'paid';
                      depositSchedule.payment_id = paymentRecordId;
                    }
                  }

                  // Update enrollment payment status
                  const { error: updateEnrollmentError } = await supabase
                    .from('enrollments')
                    .update({
                      paid_amount: depositSchedule.amount,
                      payment_status: 'partial', // Deposit paid, installments remaining
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', enrollment.id)
                    .eq('tenant_id', enrollment.tenant_id);

                  if (updateEnrollmentError) {
                    console.error('[Enrollment Complete] Error updating enrollment:', updateEnrollmentError);
                  } else {
                    console.log('[Enrollment Complete] ✓ Updated enrollment payment status');
                  }

                  console.log('[Enrollment Complete] ✅ Fallback processing complete - allowing enrollment to proceed');
                } else {
                  // Payment not succeeded in Stripe either
                  console.error('[Enrollment Complete] Payment not succeeded in Stripe:', paymentIntent.status);
                  return NextResponse.json(
                    { error: `Payment not completed. Status: ${paymentIntent.status}` },
                    { status: 400 }
                  );
                }
              } else {
                console.error('[Enrollment Complete] Stripe integration not configured');
                return NextResponse.json(
                  { error: 'Deposit payment required but not completed' },
                  { status: 400 }
                );
              }
            } catch (stripeError) {
              console.error('[Enrollment Complete] Error checking Stripe API:', stripeError);
              return NextResponse.json(
                { error: 'Deposit payment required but not completed' },
                { status: 400 }
              );
            }
          } else {
            // No payment intent ID, can't check Stripe
            return NextResponse.json(
              { error: 'Deposit payment required but not completed' },
              { status: 400 }
            );
          }
        }
        // Deposit is paid - user can proceed with wizard completion
        console.log('[Enrollment Complete] Deposit plan: deposit paid, allowing completion');
      } else {
        // For one-time or subscription plans: Check if full payment is completed
        // Check both payment_status and paid_amount to handle various scenarios
        const paymentComplete =
          enrollment.payment_status === 'paid' ||
          enrollment.paid_amount >= enrollment.total_amount;

        console.log('[Enrollment Complete] Non-deposit plan payment check:', {
          paid_amount: enrollment.paid_amount,
          total_amount: enrollment.total_amount,
          payment_status: enrollment.payment_status,
          paymentComplete,
        });

        if (!paymentComplete) {
          // Before failing, check if schedules exist at all (race condition check)
          const { count: scheduleCount } = await supabase
            .from('payment_schedules')
            .select('*', { count: 'exact', head: true })
            .eq('enrollment_id', enrollment.id);

          console.log('[Enrollment Complete] Schedule count:', scheduleCount);

          // If no schedules exist, it might be a race condition - fail with more specific error
          if (scheduleCount === 0) {
            console.error('[Enrollment Complete] No schedules found - possible race condition');
            return NextResponse.json(
              { error: 'Payment schedules not yet created. Please try again in a moment.' },
              { status: 503 } // 503 Service Unavailable for temporary condition
            );
          }

          console.error('[Enrollment Complete] Payment required but not completed ERROR');
          return NextResponse.json(
            { error: 'Payment required but not completed' },
            { status: 400 }
          );
        }
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
          role: 'student',
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
          role: 'student',
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
          const { data: integration } = await supabase
            .from('integrations')
            .select('credentials')
            .eq('tenant_id', enrollment.tenant_id)
            .eq('integration_key', 'stripe')
            .single();

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
            const { data: integration } = await supabase
              .from('integrations')
              .select('credentials')
              .eq('tenant_id', enrollment.tenant_id)
              .eq('integration_key', 'stripe')
              .single();

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
      updated_at: new Date().toISOString()
    };

    // Save profile data ONLY for new users (existing users already have profile in users table)
    if (!isExistingUser && profileData) {
      enrollmentUpdate.wizard_profile_data = profileData;
    }

    // Save DocuSign envelope ID if provided
    if (docusignEnvelopeId) {
      enrollmentUpdate.docusign_envelope_id = docusignEnvelopeId;
    }

    console.log('[Enrollment Complete] Saving enrollment with wizard data:', enrollmentUpdate);

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

    // Sync to Keap CRM if configured
    if (product.keap_tag) {
      try {
        console.log('[Enrollment Complete] Syncing to Keap with tag:', product.keap_tag);

        const { syncStudentToKeap } = await import('@/lib/keap/syncService');

        // For existing users, fetch their profile from users table
        let keapProfileData = profileData;
        if (isExistingUser) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('email, first_name, last_name, phone')
            .eq('id', userId)
            .single();

          if (userProfile) {
            keapProfileData = userProfile;
          }
        }

        await syncStudentToKeap(
          {
            email: keapProfileData?.email || '',
            first_name: keapProfileData?.first_name,
            last_name: keapProfileData?.last_name,
            phone: keapProfileData?.phone
          },
          {
            tags: [product.keap_tag],
            create_note: `Enrolled via ${product.type || 'course'}: ${product.title}\nEnrollment Date: ${new Date().toLocaleDateString()}`
          }
        );

        console.log('[Enrollment Complete] Successfully synced to Keap');
      } catch (keapError) {
        // Log but don't fail enrollment if Keap fails
        console.error('[Enrollment Complete] Error syncing to Keap:', keapError);
      }
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

    return NextResponse.json({
      success: true,
      enrollment_id: enrollment.id,
      user_id: userId,
      status: 'active',
      redirect_url: shouldRedirectToDashboard ? '/dashboard' : null,
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
