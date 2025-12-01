import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
            deposit_percentage: plan.deposit_percentage
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

      return {
        id: enrollment.id,
        user_id: enrollment.user?.id || '',
        user_name: enrollment.user ? `${enrollment.user.first_name} ${enrollment.user.last_name}` : 'Unknown',
        user_email: enrollment.user?.email || '',
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
        created_at: enrollment.created_at || enrollment.enrolled_at,
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

    // Get tenant_id from the admin user
    const { data: adminData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!adminData) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Determine the final user_id (either provided or create invited user)
    let finalUserId: string;

    if (user_id) {
      // User selected from dropdown (existing user)
      finalUserId = user_id;
    } else {
      // New user - create invited user record
      // First, double-check user doesn't already exist
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail.toLowerCase())
        .eq('tenant_id', adminData.tenant_id)
        .single();

      if (existingUser) {
        // User exists - use their ID
        finalUserId = existingUser.id;
      } else {
        // Create invited user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: userEmail.toLowerCase(),
            first_name: userFirstName,
            last_name: userLastName,
            phone: userPhone || null,
            status: 'invited',
            invited_at: new Date().toISOString(),
            invited_by: user.id,
            tenant_id: adminData.tenant_id,
            role: 'student', // Default role
          })
          .select('id')
          .single();

        if (createError || !newUser) {
          console.error('Error creating invited user:', createError);
          return NextResponse.json(
            { error: 'Failed to create user invitation' },
            { status: 500 }
          );
        }

        finalUserId = newUser.id;
      }
    }

    // Fetch the product to get pricing information
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, type, price, currency, payment_model, payment_plan')
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

    // Check for existing enrollment
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

    // Create enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        tenant_id: adminData.tenant_id,
        user_id: finalUserId,
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
      })
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

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/enrollments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
