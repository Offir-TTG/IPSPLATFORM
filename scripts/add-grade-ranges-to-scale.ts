import { createClient } from '@supabase/supabase-js';
import { STANDARD_LETTER_GRADES } from '@/types/grading';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addGradeRangesToScale() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('🎓 Adding grade ranges to your grading scale...\n');

  try {
    // 1. Get the most recently created grading scale
    console.log('Finding your grading scale...');
    const { data: scales, error: scalesError } = await supabase
      .from('grading_scales')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (scalesError) {
      console.error('❌ Error finding grading scale:', scalesError);
      return;
    }

    if (!scales || scales.length === 0) {
      console.error('❌ No grading scales found for this tenant');
      return;
    }

    const scale = scales[0];
    console.log(`✅ Found scale: "${scale.name}" (${scale.scale_type})`);
    console.log(`   ID: ${scale.id}`);
    console.log('');

    // 2. Check if this scale already has grade ranges
    const { data: existingRanges } = await supabase
      .from('grade_ranges')
      .select('id')
      .eq('grading_scale_id', scale.id);

    if (existingRanges && existingRanges.length > 0) {
      console.log(`⚠️  This scale already has ${existingRanges.length} grade ranges.`);
      console.log('   Skipping to avoid duplicates.');
      console.log('');
      return;
    }

    // 3. Add grade ranges based on scale type
    let rangesToCreate;

    if (scale.scale_type === 'letter') {
      // Use standard A-F letter grades
      rangesToCreate = STANDARD_LETTER_GRADES.map((range) => ({
        tenant_id: tenantId,
        grading_scale_id: scale.id,
        ...range,
      }));
      console.log('Adding standard A-F letter grade ranges...');
    } else if (scale.scale_type === 'passfail') {
      // Pass/Fail ranges
      rangesToCreate = [
        {
          tenant_id: tenantId,
          grading_scale_id: scale.id,
          grade_label: 'Pass',
          min_percentage: 60,
          max_percentage: 100,
          gpa_value: null,
          display_order: 1,
          color_code: '#4CAF50',
          is_passing: true,
        },
        {
          tenant_id: tenantId,
          grading_scale_id: scale.id,
          grade_label: 'Fail',
          min_percentage: 0,
          max_percentage: 59.99,
          gpa_value: null,
          display_order: 2,
          color_code: '#F44336',
          is_passing: false,
        },
      ];
      console.log('Adding Pass/Fail grade ranges...');
    } else if (scale.scale_type === 'numeric') {
      // Numeric ranges (10-point increments)
      rangesToCreate = [
        { grade_label: '90-100', min_percentage: 90, max_percentage: 100, color_code: '#4CAF50', display_order: 1 },
        { grade_label: '80-89', min_percentage: 80, max_percentage: 89.99, color_code: '#8BC34A', display_order: 2 },
        { grade_label: '70-79', min_percentage: 70, max_percentage: 79.99, color_code: '#FFEB3B', display_order: 3 },
        { grade_label: '60-69', min_percentage: 60, max_percentage: 69.99, color_code: '#FF9800', display_order: 4 },
        { grade_label: '0-59', min_percentage: 0, max_percentage: 59.99, color_code: '#F44336', display_order: 5, is_passing: false },
      ].map((range) => ({
        tenant_id: tenantId,
        grading_scale_id: scale.id,
        gpa_value: null,
        is_passing: range.is_passing ?? true,
        ...range,
      }));
      console.log('Adding numeric grade ranges...');
    } else {
      console.log('⚠️  Custom scale type - you will need to add grade ranges manually through the UI');
      return;
    }

    // 4. Insert the grade ranges
    const { data: ranges, error: rangesError } = await supabase
      .from('grade_ranges')
      .insert(rangesToCreate)
      .select();

    if (rangesError) {
      console.error('❌ Error creating grade ranges:', rangesError);
      return;
    }

    console.log(`✅ Created ${ranges?.length} grade ranges`);
    console.log('');

    // 5. Display the created ranges
    console.log('📊 Grade Ranges Summary:');
    console.log('='.repeat(70));
    console.log(`Scale: ${scale.name}`);
    console.log(`Type: ${scale.scale_type}`);
    console.log('');
    console.log('Grade Ranges:');
    console.log('-'.repeat(70));
    console.log('Grade      | Range          | GPA  | Passing | Color');
    console.log('-'.repeat(70));

    if (ranges) {
      for (const range of ranges.sort((a, b) => a.display_order - b.display_order)) {
        const gradeStr = range.grade_label.padEnd(10);
        const rangeStr = `${range.min_percentage}-${range.max_percentage}`.padEnd(14);
        const gpaStr = (range.gpa_value?.toFixed(1) ?? 'N/A').padEnd(4);
        const passingStr = (range.is_passing ? 'Yes' : 'No').padEnd(7);
        console.log(
          `${gradeStr} | ${rangeStr} | ${gpaStr} | ${passingStr} | ${range.color_code || 'N/A'}`
        );
      }
    }

    console.log('-'.repeat(70));
    console.log('');
    console.log('✅ Grade ranges added successfully!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('1. Go to http://localhost:3000/admin/grading/scales');
    console.log('2. You should see your scale with all the grade ranges');
    console.log('3. You can now assign this scale to courses');
    console.log('4. Create grade categories for each course (Homework, Exams, etc.)');
    console.log('5. Start grading student assignments');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addGradeRangesToScale().catch(console.error);
