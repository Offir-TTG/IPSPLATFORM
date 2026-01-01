import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testCommandPaletteCourses() {
  try {
    console.log('\n=== Testing Command Palette Course Fetch ===\n');

    // Get all enrollments
    const { data: allEnrollments } = await supabase
      .from('enrollments')
      .select(`
        id,
        product_id,
        status,
        products (
          id,
          title,
          type,
          course_id,
          program_id
        )
      `);

    console.log(`Total enrollments: ${allEnrollments?.length || 0}\n`);

    if (allEnrollments) {
      const statusBreakdown = allEnrollments.reduce((acc: any, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      }, {});
      console.log('Status breakdown:', statusBreakdown);

      const typeBreakdown = allEnrollments.reduce((acc: any, e) => {
        const type = (e.products as any)?.type || 'null';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      console.log('Type breakdown:', typeBreakdown, '\n');
    }

    // Filter like the command palette does
    const { data: filteredEnrollments } = await supabase
      .from('enrollments')
      .select(`
        id,
        product_id,
        products (
          id,
          title,
          type,
          course_id,
          program_id
        )
      `)
      .in('status', ['active', 'completed']);

    console.log(`\nFiltered (active/completed): ${filteredEnrollments?.length || 0}\n`);

    if (filteredEnrollments) {
      // Apply the same filter as command palette
      const courses = filteredEnrollments
        .filter(e => {
          const product = e.products as any;
          return product && product.type === 'course' && product.course_id;
        })
        .map(e => {
          const product = (e.products as any);
          return {
            id: product.id,
            courseId: product.course_id,
            title: product.title,
            type: 'course' as const
          };
        });

      console.log(`Courses that will show in command palette: ${courses.length}\n`);

      if (courses.length > 0) {
        console.log('Courses:');
        courses.forEach((c, i) => {
          console.log(`${i + 1}. ${c.title}`);
          console.log(`   Product ID: ${c.id}`);
          console.log(`   Course ID: ${c.courseId}`);
          console.log(`   Navigate to: /courses/${c.courseId}\n`);
        });
      }

      // Check for courses that are excluded
      const excluded = filteredEnrollments.filter(e => {
        const product = e.products as any;
        return !(product && product.type === 'course' && product.course_id);
      });

      if (excluded.length > 0) {
        console.log(`\nExcluded from command palette: ${excluded.length}\n`);
        excluded.forEach((e, i) => {
          const product = e.products as any;
          console.log(`${i + 1}. ${product?.title || 'No title'}`);
          console.log(`   Type: ${product?.type || 'null'}`);
          console.log(`   Course ID: ${product?.course_id || 'null'}`);
          console.log(`   Program ID: ${product?.program_id || 'null'}\n`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testCommandPaletteCourses();
