import { createClient } from '@supabase/supabase-js';
import { STANDARD_LETTER_GRADES } from '@/types/grading';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDefaultGradingScale() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac'; // Your tenant ID

  console.log('🎓 Setting up default grading scale...\n');

  try {
    // 1. Create the grading scale
    console.log('Creating Standard Letter Grade (A-F) scale...');
    const { data: scale, error: scaleError } = await supabase
      .from('grading_scales')
      .insert({
        tenant_id: tenantId,
        name: 'Standard Letter Grade (A-F)',
        description: 'Traditional US letter grading system with GPA values',
        scale_type: 'letter',
        is_default: true,
        is_active: true,
      })
      .select()
      .single();

    if (scaleError) {
      console.error('❌ Error creating grading scale:', scaleError);
      return;
    }

    console.log('✅ Grading scale created:', scale.id);
    console.log('');

    // 2. Create grade ranges
    console.log('Creating grade ranges...');
    const rangesToCreate = STANDARD_LETTER_GRADES.map((range) => ({
      tenant_id: tenantId,
      grading_scale_id: scale.id,
      ...range,
    }));

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

    // 3. Display the created scale
    console.log('📊 Grading Scale Summary:');
    console.log('='.repeat(60));
    console.log(`Scale: ${scale.name}`);
    console.log(`Type: ${scale.scale_type}`);
    console.log(`Default: ${scale.is_default}`);
    console.log('');
    console.log('Grade Ranges:');
    console.log('-'.repeat(60));
    console.log('Grade | Range      | GPA  | Passing | Color');
    console.log('-'.repeat(60));

    if (ranges) {
      for (const range of ranges.sort((a, b) => a.display_order - b.display_order)) {
        const rangeStr = `${range.min_percentage.toString().padEnd(5)}-${range.max_percentage.toString().padEnd(5)}`;
        const gpaStr = range.gpa_value?.toFixed(1) ?? 'N/A';
        const passingStr = range.is_passing ? 'Yes' : 'No';
        console.log(
          `${range.grade_label.padEnd(5)} | ${rangeStr} | ${gpaStr.padEnd(4)} | ${passingStr.padEnd(7)} | ${range.color_code || 'N/A'}`
        );
      }
    }

    console.log('-'.repeat(60));
    console.log('');
    console.log('✅ Default grading scale setup complete!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('1. Configure courses to use this grading scale');
    console.log('2. Set up grade categories for each course');
    console.log('3. Start grading assignments');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupDefaultGradingScale().catch(console.error);
