import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { generatePaymentSchedules } from '@/lib/payments/paymentEngine';

export const dynamic = 'force-dynamic';

// GET /api/admin/enrollments - List all enrollments (with filters)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const programId = searchParams.get('program_id');
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search');

    let query = supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        product_id,
        payment_plan_id,
        total_amount,
        paid_amount,
        currency,
        status,
        payment_status,
        next_payment_date,
        payment_start_date,
        enrolled_at,
        created_at,
        expires_at,
        wizard_profile_data,
        invitation_sent_at,
        user:users!enrollments_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          payment_model,
          payment_plan,
          program:programs!products_program_id_fkey (
            id,
            name
          ),
          course:courses!products_course_id_fkey (
            id,
            title
          )
        ),
        payment_plan:payment_plans!enrollments_payment_plan_id_fkey (
          id,
          plan_name
        )
      `)
      .order('enrolled_at', { ascending: false });

    if (productId) query = query.eq('product_id', productId);
    if (userId) query = query.eq('user_id', userId);
    if (status) query = query.eq('status', status);
    if (paymentStatus) query = query.eq('payment_status', paymentStatus);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching enrollments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    // Enrollments fetched from database

    // Transform data to match frontend expectations
    let enrollments = (data || []).map((enrollment: any) => {
      // Determine product name based on type
      let productName = enrollment.product?.title || 'N/A';
      if (enrollment.product?.program) {
        productName = enrollment.product.program.name;
      } else if (enrollment.product?.course) {
        productName = enrollment.product.course.title;
      }

      // Determine payment plan info (translation key + data) from either payment_plan template or product
      let paymentPlanKey = 'admin.enrollments.paymentPlan.notAvailable';
      let paymentPlanData: any = {};

      if (enrollment.payment_plan?.plan_name) {
        // If using template-based payment plan, use the plan name directly
        paymentPlanKey = 'custom';
        paymentPlanData = { name: enrollment.payment_plan.plan_name };
      } else if (enrollment.product?.payment_model) {
        // Otherwise, generate translation key from product's payment model
        const model = enrollment.product.payment_model;
        const plan = enrollment.product.payment_plan || {};

        if (model === 'one_time') {
          paymentPlanKey = 'admin.enrollments.paymentPlan.oneTime';
        } else if (model === 'deposit_then_plan') {
          paymentPlanKey = 'admin.enrollments.paymentPlan.deposit';
          paymentPlanData = {
            count: plan.installments || 'N',
            frequency: plan.frequency || 'monthly',
            deposit_type: plan.deposit_type,
            deposit_amount: plan.deposit_amount,
            deposit_percentage: plan.deposit_percentage,
            installments: plan.installments,
            installment_amount: plan.installment_amount
          };
        } else if (model === 'subscription') {
          paymentPlanKey = 'admin.enrollments.paymentPlan.subscription';
          paymentPlanData = {
            interval: plan.subscription_interval || 'monthly'
          };
        } else if (model === 'free') {
          paymentPlanKey = 'admin.enrollments.paymentPlan.free';
        }
      }

      // MEMORY-BASED WIZARD: Get user data from wizard_profile_data if user doesn't exist yet
      let userName: string;
      let userEmail: string;

      

      if (enrollment.user) {
        // User exists - use user table data
        userName = `${enrollment.user.first_name} ${enrollment.user.last_name}`;
        userEmail = enrollment.user.email;
        
      } else if (enrollment.wizard_profile_data) {
        // User doesn't exist yet - use wizard_profile_data
        userName = `${enrollment.wizard_profile_data.first_name || ''} ${enrollment.wizard_profile_data.last_name || ''}`.trim();
        userEmail = enrollment.wizard_profile_data.email || '';
        
      } else {
        // No user data available
        userName = 'Unknown';
        userEmail = '';
        
      }

      return {
        id: enrollment.id,
        user_id: enrollment.user?.id || '',
        user_name: userName,
        user_email: userEmail,
        product_id: enrollment.product_id,
        product_name: productName,
        product_type: enrollment.product?.type || 'N/A',
        payment_plan_id: enrollment.payment_plan_id || '',
        payment_plan_key: paymentPlanKey,
        payment_plan_data: paymentPlanData,
        payment_model: enrollment.product?.payment_model,
        payment_plan: enrollment.product?.payment_plan,
        total_amount: enrollment.total_amount || 0,
        paid_amount: enrollment.paid_amount || 0,
        currency: enrollment.currency || 'USD',
        payment_status: enrollment.payment_status || 'pending',
        status: enrollment.status || 'active',
        next_payment_date: enrollment.next_payment_date,
        payment_start_date: enrollment.payment_start_date,
        enrolled_at: enrollment.enrolled_at,
        created_at: enrollment.created_at || enrollment.enrolled_at,
        expires_at: enrollment.expires_at || null,
        invitation_sent_at: enrollment.invitation_sent_at || null,
      };
    });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      enrollments = enrollments.filter((e: any) =>
        e.user_name.toLowerCase().includes(searchLower) ||
        e.user_email.toLowerCase().includes(searchLower) ||
        e.product_name.toLowerCase().includes(searchLower)
      );
    }

    // Apply program_id filter if provided (filter by program within product)
    if (programId) {
      enrollments = enrollments.filter((e: any) => {
        const enrollment: any = data?.find((d: any) => d.id === e.id);
        // Check if product has a program reference that matches the programId
        return enrollment?.product?.program?.id === programId;
      });
    }

    return NextResponse.json({ enrollments });

  } catch (error) {
    console.error('Error in GET /api/admin/enrollments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/enrollments - Enroll user in product (program/course)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      user_id,
      create_new_user,
      new_user,
      product_id,
      payment_plan_id,
      status = 'draft',
      waive_payment = false, // Admin override to waive payment requirement
      expires_at = null, // Optional expiration date for the enrollment
      // Legacy fields (kept for backwards compatibility)
      email,
      first_name,
      last_name,
      phone,
    } = body;

    // Extract user fields from either new_user object or legacy fields
    const userEmail = new_user?.email || email;
    const userFirstName = new_user?.first_name || first_name;
    const userLastName = new_user?.last_name || last_name;
    const userPhone = new_user?.phone || phone;

    // Either user_id OR user details must be provided
    if (!user_id && (!userEmail || !userFirstName || !userLastName)) {
      return NextResponse.json(
        { error: 'Either user_id OR user details (email, first_name, last_name) are required' },
        { status: 400 }
      );
    }

    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      );
    }

    // Get tenant_id and verify admin user exists in users table
    const { data: adminData } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single();

    if (!adminData) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Fetch the product to get pricing information FIRST (validate before creating user)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, type, price, currency, payment_model, payment_plan, payment_start_date')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Determine total amount based on payment model and admin override
    let totalAmount = 0;
    let currency = product.currency || 'USD';
    let paymentStatus = 'pending';

    if (waive_payment) {
      // Admin override: waive payment requirement (scholarship, staff, etc.)
      totalAmount = 0;
      paymentStatus = 'paid';
    } else if (product.payment_model !== 'free') {
      totalAmount = product.price || 0;
      paymentStatus = 'pending';
    } else {
      // Product is free
      totalAmount = 0;
      paymentStatus = 'paid';
    }

    // MEMORY-BASED WIZARD APPROACH:
    // - If user_id provided: Use existing user
    // - If no user_id: DO NOT create user yet - store info in wizard_profile_data
    // - User will be created at END of wizard when they complete it
    let finalUserId: string | null = null;
    let wizardProfileData: any = null;

    if (user_id) {
      // Using existing user - verify they exist and fetch their profile
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, phone, location')
        .eq('id', user_id)
        .eq('tenant_id', adminData.tenant_id)
        .single();

      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      finalUserId = user_id;

      // Store existing user's profile in wizard_profile_data
      // This allows wizard to skip profile step if user profile is complete
      wizardProfileData = {
        email: existingUser.email,
        first_name: existingUser.first_name || '',
        last_name: existingUser.last_name || '',
        phone: existingUser.phone || '',
        address: existingUser.location || '', // Using location field from users table
      };

      console.log('[Admin Enrollment] Fetched existing user profile for wizard:', {
        email: existingUser.email,
        has_phone: !!existingUser.phone,
        has_location: !!existingUser.location,
      });
    } else {
      // NO USER_ID - Memory-based wizard approach
      // Check if email already exists first
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', userEmail.toLowerCase())
        .eq('tenant_id', adminData.tenant_id);

      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json(
          { error: `A user with email ${userEmail} already exists in this tenant` },
          { status: 409 }
        );
      }

      // DO NOT create user yet!
      // Store user info in wizard_profile_data for later use
      // User will be created when they complete the wizard
      wizardProfileData = {
        email: userEmail.toLowerCase(),
        first_name: userFirstName,
        last_name: userLastName,
        phone: userPhone || null,
      };

      console.log('[Admin Enrollment] Storing user info in wizard_profile_data for wizard completion:', wizardProfileData);

      // Leave finalUserId as null - enrollment will be linked to user later
      finalUserId = null;
    }

    // Check for existing enrollment (only if we have a user_id)
    if (finalUserId) {
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', finalUserId)
        .eq('product_id', product_id)
        .eq('tenant_id', adminData.tenant_id)
        .single();

      if (existingEnrollment) {
        return NextResponse.json(
          { error: 'User is already enrolled in this product' },
          { status: 409 }
        );
      }
    } else {
      // For new users (no user_id yet), check by email in wizard_profile_data
      // This prevents duplicate enrollments for the same email
      const { data: existingEnrollments } = await supabase
        .from('enrollments')
        .select('id, wizard_profile_data')
        .eq('product_id', product_id)
        .eq('tenant_id', adminData.tenant_id)
        .is('user_id', null);

      if (existingEnrollments && existingEnrollments.length > 0) {
        const duplicateEnrollment = existingEnrollments.find(
          (e: any) => e.wizard_profile_data?.email?.toLowerCase() === userEmail.toLowerCase()
        );

        if (duplicateEnrollment) {
          return NextResponse.json(
            { error: 'An enrollment for this email and product already exists' },
            { status: 409 }
          );
        }
      }
    }

    // Create enrollment
    const enrollmentData: any = {
      tenant_id: adminData.tenant_id,
      user_id: finalUserId, // null if new user (wizard will link later)
      product_id,
      payment_plan_id: payment_plan_id || null,
      total_amount: totalAmount,
      paid_amount: waive_payment ? totalAmount : 0,
      currency,
      status,
      payment_status: paymentStatus,
      payment_waived: waive_payment,
      enrollment_type: 'admin_assigned',
      created_by: user.id,
      expires_at: expires_at || null,
      payment_start_date: body.payment_start_date || product.payment_start_date || null, // Admin override or copy from product
    };

    // Save wizard profile data for both new and existing users
    // - For EXISTING users (finalUserId set): Store complete profile from users table
    //   If profile is complete (has phone, address) → wizard will skip profile step
    //   If profile is incomplete → wizard will show profile step
    // - For NEW users (!finalUserId): Store only email and name
    //   Wizard will always show profile step for phone and address
    if (wizardProfileData) {
      if (finalUserId) {
        // Existing user - store complete profile
        enrollmentData.wizard_profile_data = {
          email: wizardProfileData.email,
          first_name: wizardProfileData.first_name || '',
          last_name: wizardProfileData.last_name || '',
          phone: wizardProfileData.phone || '',
          address: wizardProfileData.address || ''
        };
        console.log('[Admin Enrollment] Saving existing user complete profile for wizard:', {
          email: wizardProfileData.email,
          has_phone: !!wizardProfileData.phone,
          has_address: !!wizardProfileData.address
        });
      } else {
        // New user - store only email and name (user fills phone/address in wizard)
        enrollmentData.wizard_profile_data = {
          email: wizardProfileData.email,
          first_name: wizardProfileData.first_name || '',
          last_name: wizardProfileData.last_name || ''
          // DO NOT include phone, address - user will fill these in wizard
        };
        console.log('[Admin Enrollment] Saving email and name for new user invitation:', {
          email: wizardProfileData.email,
          first_name: wizardProfileData.first_name,
          last_name: wizardProfileData.last_name
        });
      }
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert(enrollmentData)
      .select(`
        id,
        user_id,
        product_id,
        payment_plan_id,
        total_amount,
        paid_amount,
        currency,
        status,
        payment_status,
        enrolled_at,
        created_at,
        user:users!enrollments_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type
        ),
        payment_plan:payment_plans!enrollments_payment_plan_id_fkey (
          id,
          plan_name
        )
      `)
      .single();

    if (error) {
      console.error('Error creating enrollment:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create enrollment' },
        { status: 500 }
      );
    }

    // Generate payment schedules if payment is required and not waived
    if (!waive_payment && totalAmount > 0) {
      try {
        // Determine payment plan to use
        let paymentPlan = null;

        if (payment_plan_id) {
          // Fetch the payment plan template
          const { data: planData } = await supabase
            .from('payment_plans')
            .select('*')
            .eq('id', payment_plan_id)
            .eq('tenant_id', adminData.tenant_id)
            .single();

          if (planData) {
            paymentPlan = planData;
          }
        }

        // If no payment plan template, use product's payment model
        if (!paymentPlan && product.payment_model) {
          const paymentConfig = product.payment_plan || {};

          if (product.payment_model === 'one_time') {
            paymentPlan = {
              plan_type: 'one_time',
              currency: product.currency || 'USD',
            };
          } else if (product.payment_model === 'deposit_then_plan') {
            paymentPlan = {
              plan_type: 'deposit',
              deposit_type: paymentConfig.deposit_type || 'percentage',
              deposit_amount: paymentConfig.deposit_amount,
              deposit_percentage: paymentConfig.deposit_percentage,
              installment_count: paymentConfig.installments || 1,
              installment_frequency: paymentConfig.frequency || 'monthly',
              currency: product.currency || 'USD',
            };
          } else if (product.payment_model === 'recurring') {
            paymentPlan = {
              plan_type: 'recurring',
              installment_count: paymentConfig.installments || 1,
              installment_frequency: paymentConfig.frequency || 'monthly',
              currency: product.currency || 'USD',
            };
          }
        }

        // Generate schedules if we have a payment plan
        if (paymentPlan) {
          // Determine start date with priority: enrollment.payment_start_date → product.payment_start_date → now
          // Parse date-only values as local midnight to avoid timezone shifts
          let startDate: Date;
          if (enrollmentData.payment_start_date) {
            const dateOnly = enrollmentData.payment_start_date.split('T')[0];
            startDate = new Date(dateOnly + 'T00:00:00');
          } else if (product.payment_start_date) {
            const dateOnly = product.payment_start_date.split('T')[0];
            startDate = new Date(dateOnly + 'T00:00:00');
          } else {
            startDate = new Date();
          }

          console.log(`[Admin Enrollment] Generating schedules with start date: ${startDate.toISOString()}`);

          // Use correct function signature: (enrollmentId, tenantId, plan, totalAmount, startDate)
          const schedules = generatePaymentSchedules(
            data.id,
            adminData.tenant_id,
            paymentPlan,
            totalAmount,
            startDate
          );

          // Insert schedules into database
          if (schedules && schedules.length > 0) {
            const { error: scheduleError } = await supabase
              .from('payment_schedules')
              .insert(schedules);

            if (scheduleError) {
              console.error('Error creating payment schedules:', scheduleError);
              // Don't fail enrollment creation if schedule generation fails
              // Admin can manually create schedules later
            } else {
              console.log(`[Admin Enrollment] Created ${schedules.length} payment schedules for enrollment ${data.id}`);
            }
          }
        }
      } catch (scheduleError) {
        console.error('Error generating payment schedules:', scheduleError);
        // Don't fail enrollment creation if schedule generation fails
      }
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/enrollments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
