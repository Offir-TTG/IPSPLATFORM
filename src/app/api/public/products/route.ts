import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'program' or 'course'
    const limit = parseInt(searchParams.get('limit') || '6');
    const id = searchParams.get('id'); // Single product ID

    console.log('=== PUBLIC PRODUCTS API CALLED ===');
    console.log('Query params:', { type, limit, id });

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Build query for products
    let query = supabase
      .from('products')
      .select(`
        id,
        type,
        title,
        description,
        payment_model,
        price,
        currency,
        payment_plan,
        requires_signature,
        program_id,
        course_id,
        completion_benefit,
        completion_description,
        access_duration,
        access_description,
        programs!products_program_id_fkey (
          id,
          name,
          description,
          image_url
        ),
        courses!products_course_id_fkey (
          id,
          title,
          description,
          image_url,
          instructor_id,
          users!courses_instructor_id_fkey(first_name, last_name)
        )
      `)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true);

    // Filter by type if specified
    if (type) {
      query = query.eq('type', type);
    }

    // Filter by ID if specified (for detail pages)
    if (id) {
      query = query.eq('id', id);
    } else {
      // Apply limit only when not fetching single product
      query = query.limit(limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Enrich products with stats
    const enrichedProducts = await Promise.all(
      (products || []).map(async (product: any) => {
        let total_courses = 0;
        let total_lessons = 0;
        let total_hours = 0;
        let student_count = 0;
        let image_url = '';
        let content_name = '';
        let instructor = '';

        // Get content reference (program or course)
        if (product.type === 'program' && product.programs) {
          const program = Array.isArray(product.programs) ? product.programs[0] : product.programs;
          if (program) {
            content_name = program.name;
            image_url = program.image_url || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=400&fit=crop';

            // Get courses in this program with their modules and lessons
            const { data: programCoursesData } = await supabase
              .from('program_courses')
              .select(`
                course_id,
                courses (
                  id,
                  modules (
                    id,
                    lessons (
                      id,
                      duration
                    )
                  )
                )
              `)
              .eq('program_id', product.program_id);

            if (programCoursesData) {
              total_courses = programCoursesData.length;

              // Calculate total lessons and hours from all courses
              programCoursesData.forEach((pc: any) => {
                const course = pc.courses;
                if (course && course.modules) {
                  course.modules.forEach((module: any) => {
                    if (module.lessons) {
                      total_lessons += module.lessons.length;
                      module.lessons.forEach((lesson: any) => {
                        total_hours += (lesson.duration || 0);
                      });
                    }
                  });
                }
              });

              // Convert minutes to hours
              total_hours = Math.round(total_hours / 60);
            }
          }
        } else if (product.type === 'course' && product.courses) {
          const course = Array.isArray(product.courses) ? product.courses[0] : product.courses;
          if (course) {
            content_name = course.title;
            image_url = course.image_url || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=400&fit=crop';

            // Format instructor name
            const instructorData = course.users as any;
            instructor = instructorData
              ? `${instructorData.first_name || ''} ${instructorData.last_name || ''}`.trim()
              : '';

            // Get course with nested modules and lessons
            const { data: courseData } = await supabase
              .from('courses')
              .select(`
                id,
                modules (
                  id,
                  lessons (
                    id,
                    duration
                  )
                )
              `)
              .eq('id', product.course_id)
              .single();

            if (courseData && courseData.modules) {
              courseData.modules.forEach((module: any) => {
                if (module.lessons) {
                  total_lessons += module.lessons.length;
                  module.lessons.forEach((lesson: any) => {
                    total_hours += (lesson.duration || 0);
                  });
                }
              });

              // Convert minutes to hours
              total_hours = Math.round(total_hours / 60);
            }
          }
        }

        // Get enrollment count
        const { count } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', product.id);

        student_count = count || 0;

        return {
          id: product.id,
          title: product.title || content_name,
          description: product.description || (product.type === 'program'
            ? (Array.isArray(product.programs) ? product.programs[0]?.description : product.programs?.description)
            : (Array.isArray(product.courses) ? product.courses[0]?.description : product.courses?.description)),
          image_url,
          product_type: product.type,
          payment_model: product.payment_model,
          price: product.price,
          currency: product.currency || 'USD',
          payment_plan: product.payment_plan,
          requires_signature: product.requires_signature,
          completion_benefit: product.completion_benefit,
          completion_description: product.completion_description,
          access_duration: product.access_duration,
          access_description: product.access_description,
          instructor: instructor || undefined,
          total_courses,
          total_lessons,
          total_hours,
          student_count,
          // Include content references for detail pages
          program: product.type === 'program' ? (Array.isArray(product.programs) ? product.programs[0] : product.programs) : undefined,
          course: product.type === 'course' ? (Array.isArray(product.courses) ? product.courses[0] : product.courses) : undefined,
        };
      })
    );

    // If fetching single product, return just the product
    if (id) {
      const product = enrichedProducts[0];
      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        product,
      });
    }

    return NextResponse.json({
      success: true,
      products: enrichedProducts,
    });
  } catch (error) {
    console.error('Error in public products API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
