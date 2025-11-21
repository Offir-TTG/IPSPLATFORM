/**
 * Script to clear the translations cache
 */

async function clearTranslationsCache() {
  console.log('Clearing translations cache...\n');

  try {
    const response = await fetch('http://localhost:3000/api/translations', {
      method: 'POST',
    });

    const data = await response.json();

    if (data.success) {
      console.log('✓ Translation cache cleared successfully');
      console.log('  Message:', data.message);
    } else {
      console.error('❌ Failed to clear cache:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearTranslationsCache();
