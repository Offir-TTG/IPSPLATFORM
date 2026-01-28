import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * This script helps add translated product titles to existing products.
 *
 * Product titles are now stored in metadata as:
 * {
 *   "title_en": "English Title",
 *   "title_he": "כותרת בעברית"
 * }
 *
 * This allows the UI to display the correct language based on user preference.
 *
 * Usage:
 * 1. Review the products list below
 * 2. Add translations for each product
 * 3. Run: npx tsx scripts/add-product-title-translations.ts
 */

interface ProductTranslation {
  productId: string;
  titleEn: string;
  titleHe: string;
}

// Add your product translations here
// To find product IDs, run: SELECT id, title FROM products;
const productTranslations: ProductTranslation[] = [
  {
    productId: 'da9a72b9-a619-4bf8-9287-9c74207bfbc1',
    titleEn: 'Mentoring Program',
    titleHe: 'תוכנית ליווי'
  },
  {
    productId: '2043949a-b9bb-443c-b3eb-9913675a9898',
    titleEn: 'Parent Instructor Training Program 2027',
    titleHe: 'התוכנית להכשרת מדריכי הורים 2027'
  },
  {
    productId: '94348433-8926-450a-a6c1-1462eef12439',
    titleEn: 'Trial Course',
    titleHe: 'קורס ניסיון'
  },
  {
    productId: 'b0c6cec6-5f35-48f6-bfa1-e89b9d2f9cc6',
    titleEn: 'Focus and Concentration Course 2',
    titleHe: 'קורס קשב וריכוז 2'
  },
  {
    productId: '1c641cbf-9719-4204-9c6c-d82631aece04',
    titleEn: 'Parent Instructor Training Program 2026',
    titleHe: 'התוכנית להכשרת מדריכי הורים 2026'
  },
];

async function addProductTitleTranslations() {
  console.log('🌍 Adding Product Title Translations\n');
  console.log('=' .repeat(60));

  if (productTranslations.length === 0) {
    console.log('\n⚠️  No translations configured.');
    console.log('\nTo add translations:');
    console.log('1. Find product IDs: SELECT id, title, type FROM products;');
    console.log('2. Add translations to the productTranslations array in this script');
    console.log('3. Run this script again\n');
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  for (const translation of productTranslations) {
    console.log(`\n📦 Processing product: ${translation.productId}`);

    try {
      // Get current product
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('id, title, metadata')
        .eq('id', translation.productId)
        .single();

      if (fetchError || !product) {
        console.log(`   ❌ Product not found: ${fetchError?.message || 'Not found'}`);
        failureCount++;
        continue;
      }

      console.log(`   Current title: ${product.title}`);

      // Prepare updated metadata
      const updatedMetadata = {
        ...(product.metadata || {}),
        title_en: translation.titleEn,
        title_he: translation.titleHe
      };

      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          metadata: updatedMetadata
        })
        .eq('id', translation.productId);

      if (updateError) {
        console.log(`   ❌ Failed to update: ${updateError.message}`);
        failureCount++;
        continue;
      }

      console.log(`   ✅ Added translations:`);
      console.log(`      EN: ${translation.titleEn}`);
      console.log(`      HE: ${translation.titleHe}`);
      successCount++;

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      failureCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📈 Total: ${productTranslations.length}`);

  if (successCount > 0) {
    console.log('\n🎉 Translations added successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Test the enrollment dialogs');
    console.log('   2. Verify language switcher shows correct titles');
    console.log('   3. Check both Hebrew and English displays');
  }
}

// Helper: List all products for reference
async function listProducts() {
  console.log('📋 Current Products\n');
  console.log('=' .repeat(60));

  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, type, is_active, metadata')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('❌ Error fetching products:', error.message);
    return;
  }

  if (!products || products.length === 0) {
    console.log('No products found.');
    return;
  }

  products.forEach((product, index) => {
    console.log(`\n${index + 1}. ${product.title}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Type: ${product.type}`);
    console.log(`   Active: ${product.is_active ? 'Yes' : 'No'}`);

    const hasTranslations = product.metadata?.title_en || product.metadata?.title_he;
    if (hasTranslations) {
      console.log(`   Translations:`);
      if (product.metadata.title_en) {
        console.log(`      EN: ${product.metadata.title_en}`);
      }
      if (product.metadata.title_he) {
        console.log(`      HE: ${product.metadata.title_he}`);
      }
    } else {
      console.log(`   Translations: ❌ Not configured`);
    }
  });

  console.log('\n' + '='.repeat(60));
}

// Main
const command = process.argv[2];

if (command === 'list') {
  listProducts().then(() => process.exit(0));
} else {
  addProductTitleTranslations().then(() => process.exit(0));
}
