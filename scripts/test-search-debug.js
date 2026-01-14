const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugSearch() {
  console.log('🔍 Debugging Chatbot Search\n');

  // 1. Check total courses
  const { data: allCourses } = await supabase
    .from('courses')
    .select('id, title, is_active, is_published')
    .eq('is_active', true)
    .eq('is_published', true);

  console.log(`📚 Total active published courses: ${allCourses?.length}`);
  console.log('Sample courses:', allCourses?.slice(0, 3).map(c => c.title));

  // 2. Check total lessons
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title, course_id');

  console.log(`\n📖 Total lessons: ${allLessons?.length}`);
  console.log('Sample lessons:', allLessons?.slice(0, 3).map(l => l.title));

  // 3. Check enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, user_id, product_id, status')
    .in('status', ['active', 'completed']);

  console.log(`\n👥 Total active/completed enrollments: ${enrollments?.length}`);

  // 4. Check products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*');

  if (productsError) {
    console.log(`\n⚠️  Error fetching products:`, productsError.message);
  } else {
    console.log(`\n📦 Total products: ${products?.length}`);
    if (products && products.length > 0) {
      console.log('First product fields:', Object.keys(products[0]));
      console.log('Product types:', [...new Set(products?.map(p => p.type))]);
    }
  }

  // 5. Show product to course mapping
  const courseProducts = products?.filter(p => p.course_id);
  const programProducts = products?.filter(p => p.program_id);

  console.log(`   - Course products: ${courseProducts?.length}`);
  console.log(`   - Program products: ${programProducts?.length}`);

  // 6. Check if program_courses table exists and has data
  try {
    const { data: programCourses, error } = await supabase
      .from('program_courses')
      .select('program_id, course_id')
      .limit(5);

    if (error) {
      console.log('\n⚠️  program_courses table does not exist or is empty');
    } else {
      console.log(`\n🔗 program_courses entries: ${programCourses?.length || 0}`);
    }
  } catch (e) {
    console.log('\n⚠️  program_courses table error:', e.message);
  }

  // 7. Check courses with program_id
  const { data: coursesWithProgram } = await supabase
    .from('courses')
    .select('id, title, program_id')
    .not('program_id', 'is', null);

  console.log(`\n📚 Courses with program_id: ${coursesWithProgram?.length}`);

  // 8. Sample enrollment -> product -> course path
  if (enrollments && enrollments.length > 0) {
    const sampleEnrollment = enrollments[0];
    const product = products?.find(p => p.id === sampleEnrollment.product_id);

    console.log('\n📋 Sample enrollment path:');
    console.log(`   Enrollment ID: ${sampleEnrollment.id}`);
    console.log(`   Product: ${product?.name} (type: ${product?.type})`);
    console.log(`   Product course_id: ${product?.course_id || 'null'}`);
    console.log(`   Product program_id: ${product?.program_id || 'null'}`);

    if (product?.course_id) {
      const course = allCourses?.find(c => c.id === product.course_id);
      console.log(`   ✅ Maps to course: ${course?.title || 'NOT FOUND'}`);
    } else if (product?.program_id) {
      const programCourses = coursesWithProgram?.filter(c => c.program_id === product.program_id);
      console.log(`   ✅ Maps to ${programCourses?.length || 0} courses via program`);
      if (programCourses && programCourses.length > 0) {
        console.log(`      Courses: ${programCourses.map(c => c.title).join(', ')}`);
      }
    }
  }

  // 9. Test the actual search function
  console.log('\n🧪 Testing search function...');
  if (enrollments && enrollments.length > 0) {
    const testUserId = enrollments[0].user_id;
    const { data: searchResults, error } = await supabase.rpc('search_user_content', {
      p_user_id: testUserId,
      p_query: 'שיעור',
      p_limit: 10
    });

    console.log(`   User ID: ${testUserId}`);
    console.log(`   Query: 'שיעור'`);
    console.log(`   Results: ${searchResults?.length || 0}`);
    if (error) console.log(`   Error: ${error.message}`);
    if (searchResults && searchResults.length > 0) {
      console.log(`   Sample result: ${searchResults[0].result_title}`);
    }
  }
}

debugSearch()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
