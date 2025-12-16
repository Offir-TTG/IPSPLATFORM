import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addNumericRanges() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('🎓 Adding numeric grade ranges...\n');

  try {
    // Find the numeric scale
    console.log('Finding numeric grading scale...');
    const { data: scales, error: scalesError } = await supabase
      .from('grading_scales')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('scale_type', 'numeric')
      .order('created_at', { ascending: false })
      .limit(1);

    if (scalesError) {
      console.error('❌ Error finding grading scale:', scalesError);
      return;
    }

    if (!scales || scales.length === 0) {
      console.error('❌ No numeric grading scale found');
      return;
    }

    const scale = scales[0];
    console.log(`✅ Found scale: "${scale.name}"`);
    console.log(`   ID: ${scale.id}`);
    console.log('');

    // Check if this scale already has grade ranges
    const { data: existingRanges } = await supabase
      .from('grade_ranges')
      .select('id')
      .eq('grading_scale_id', scale.id);

    if (existingRanges && existingRanges.length > 0) {
      console.log(`⚠️  This scale already has ${existingRanges.length} grade ranges.`);
      console.log('   Skipping to avoid duplicates.');
      return;
    }

    // Create numeric grade ranges
    const numericRanges = [
      {
        grade_label: '90-100',
        min_percentage: 90,
        max_percentage: 100,
        gpa_value: null,
        display_order: 1,
        color_code: '#4CAF50', // Green
        is_passing: true,
      },
      {
        grade_label: '80-89',
        min_percentage: 80,
        max_percentage: 89.99,
        gpa_value: null,
        display_order: 2,
        color_code: '#8BC34A', // Light Green
        is_passing: true,
      },
      {
        grade_label: '70-79',
        min_percentage: 70,
        max_percentage: 79.99,
        gpa_value: null,
        display_order: 3,
        color_code: '#FFEB3B', // Yellow
        is_passing: true,
      },
      {
        grade_label: '60-69',
        min_percentage: 60,
        max_percentage: 69.99,
        gpa_value: null,
        display_order: 4,
        color_code: '#FF9800', // Orange
        is_passing: true,
      },
      {
        grade_label: '0-59',
        min_percentage: 0,
        max_percentage: 59.99,
        gpa_value: null,
        display_order: 5,
        color_code: '#F44336', // Red
        is_passing: false,
      },
    ];

    const rangesToCreate = numericRanges.map((range) => ({
      tenant_id: tenantId,
      grading_scale_id: scale.id,
      ...range,
    }));

    console.log('Adding numeric grade ranges...');
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

    // Display the created ranges
    console.log('📊 Grade Ranges Summary:');
    console.log('='.repeat(60));
    console.log(`Scale: ${scale.name}`);
    console.log(`Type: ${scale.scale_type}`);
    console.log('');
    console.log('Grade Ranges:');
    console.log('-'.repeat(60));
    console.log('Grade      | Range          | Passing | Color');
    console.log('-'.repeat(60));

    if (ranges) {
      for (const range of ranges.sort((a, b) => a.display_order - b.display_order)) {
        const gradeStr = range.grade_label.padEnd(10);
        const rangeStr = `${range.min_percentage}-${range.max_percentage}`.padEnd(14);
        const passingStr = (range.is_passing ? 'Yes' : 'No').padEnd(7);
        console.log(
          `${gradeStr} | ${rangeStr} | ${passingStr} | ${range.color_code}`
        );
      }
    }

    console.log('-'.repeat(60));
    console.log('');
    console.log('✅ Numeric grade ranges added successfully!');
    console.log('');
    console.log('💡 View your grading scale at:');
    console.log(`   http://localhost:3000/admin/grading/scales/${scale.id}`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addNumericRanges().catch(console.error);
