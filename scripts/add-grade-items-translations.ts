import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addGradeItemsTranslations() {
  const translations = [
    // Page title and subtitle
    { key: 'admin.grading.items.title', en: 'Grade Items', he: 'פריטי ציון' },
    { key: 'admin.grading.items.subtitle', en: 'Manage assignments, quizzes, and exams', he: 'נהל משימות, בחנים ומבחנים' },
    { key: 'admin.grading.items.addItem', en: 'Add Item', he: 'הוסף פריט' },

    // Empty state
    { key: 'admin.grading.items.empty.title', en: 'No Grade Items', he: 'אין פריטי ציון' },
    { key: 'admin.grading.items.empty.description', en: 'Add grade items like assignments, quizzes, and exams', he: 'הוסף פריטי ציון כמו משימות, בחנים ומבחנים' },
    { key: 'admin.grading.items.empty.addFirst', en: 'Add First Item', he: 'הוסף פריט ראשון' },

    // List labels
    { key: 'admin.grading.items.uncategorized', en: 'Uncategorized', he: 'ללא קטגוריה' },
    { key: 'admin.grading.items.extraCredit', en: 'Extra Credit', he: 'נקודות בונוס' },
    { key: 'admin.grading.items.draft', en: 'Draft', he: 'טיוטה' },
    { key: 'admin.grading.items.due', en: 'Due', he: 'תאריך הגשה' },
    { key: 'admin.grading.items.noLateSubmission', en: 'No late submissions', he: 'ללא הגשות מאוחרות' },

    // Dialog
    { key: 'admin.grading.items.dialog.add', en: 'Add Grade Item', he: 'הוסף פריט ציון' },
    { key: 'admin.grading.items.dialog.edit', en: 'Edit Grade Item', he: 'ערוך פריט ציון' },
    { key: 'admin.grading.items.dialog.addDescription', en: 'Create a new assignment, quiz, or exam', he: 'צור משימה, בחן או מבחן חדש' },
    { key: 'admin.grading.items.dialog.editDescription', en: 'Update the grade item details', he: 'עדכן את פרטי פריט הציון' },

    // Form fields
    { key: 'admin.grading.items.form.name', en: 'Item Name', he: 'שם הפריט' },
    { key: 'admin.grading.items.form.namePlaceholder', en: 'e.g., Homework 1, Midterm Exam', he: 'למשל, שיעורי בית 1, מבחן אמצע' },
    { key: 'admin.grading.items.form.description', en: 'Description (optional)', he: 'תיאור (אופציונלי)' },
    { key: 'admin.grading.items.form.descriptionPlaceholder', en: 'Optional description', he: 'תיאור אופציונלי' },
    { key: 'admin.grading.items.form.category', en: 'Category', he: 'קטגוריה' },
    { key: 'admin.grading.items.form.selectCategory', en: 'Select a category (optional)', he: 'בחר קטגוריה (אופציונלי)' },
    { key: 'admin.grading.items.form.noCategory', en: 'No category', he: 'ללא קטגוריה' },
    { key: 'admin.grading.items.form.maxPoints', en: 'Max Points', he: 'מקסימום נקודות' },
    { key: 'admin.grading.items.form.dueDate', en: 'Due Date (optional)', he: 'תאריך הגשה (אופציונלי)' },
    { key: 'admin.grading.items.form.availableFrom', en: 'Available From', he: 'זמין מתאריך' },
    { key: 'admin.grading.items.form.availableUntil', en: 'Available Until', he: 'זמין עד תאריך' },
    { key: 'admin.grading.items.form.isPublished', en: 'Published (visible to students)', he: 'פורסם (גלוי לסטודנטים)' },
    { key: 'admin.grading.items.form.isExtraCredit', en: 'Extra Credit', he: 'נקודות בונוס' },
    { key: 'admin.grading.items.form.allowLateSubmission', en: 'Allow late submissions', he: 'אפשר הגשות מאוחרות' },
    { key: 'admin.grading.items.form.displayOrder', en: 'Display Order', he: 'סדר תצוגה' },

    // Validation messages
    { key: 'admin.grading.items.validation.nameRequired', en: 'Please enter an item name', he: 'אנא הזן שם פריט' },
    { key: 'admin.grading.items.validation.maxPointsPositive', en: 'Max points must be greater than 0', he: 'מקסימום נקודות חייב להיות גדול מ-0' },

    // Success messages
    { key: 'admin.grading.items.success.created', en: 'Grade item created successfully', he: 'פריט הציון נוצר בהצלחה' },
    { key: 'admin.grading.items.success.updated', en: 'Grade item updated successfully', he: 'פריט הציון עודכן בהצלחה' },
    { key: 'admin.grading.items.success.deleted', en: 'Grade item deleted successfully', he: 'פריט הציון נמחק בהצלחה' },

    // Error messages
    { key: 'admin.grading.items.error.load', en: 'Failed to load grade items', he: 'טעינת פריטי הציון נכשלה' },
    { key: 'admin.grading.items.error.save', en: 'Failed to save grade item', he: 'שמירת פריט הציון נכשלה' },
    { key: 'admin.grading.items.error.delete', en: 'Failed to delete grade item', he: 'מחיקת פריט הציון נכשלה' },

    // Confirm messages
    { key: 'admin.grading.items.confirm.delete', en: 'Are you sure you want to delete this grade item?', he: 'האם אתה בטוח שברצונך למחוק את פריט הציון הזה?' },
  ];

  console.log('Starting to add grade items translations...\n');

  for (const translation of translations) {
    try {
      // Check if translation already exists
      const { data: existing } = await supabase
        .from('translations')
        .select('id')
        .eq('key', translation.key)
        .eq('tenant_id', null)
        .maybeSingle();

      if (existing) {
        console.log(`⏭️  Skipping ${translation.key} (already exists)`);
        continue;
      }

      // Insert English translation
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          key: translation.key,
          language: 'en',
          value: translation.en,
          tenant_id: null,
        });

      if (enError) {
        console.error(`❌ Error adding English for ${translation.key}:`, enError.message);
        continue;
      }

      // Insert Hebrew translation
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          key: translation.key,
          language: 'he',
          value: translation.he,
          tenant_id: null,
        });

      if (heError) {
        console.error(`❌ Error adding Hebrew for ${translation.key}:`, heError.message);
        continue;
      }

      console.log(`✅ Added ${translation.key}`);
    } catch (error: any) {
      console.error(`❌ Error processing ${translation.key}:`, error.message);
    }
  }

  console.log('\n✅ Grade items translations added successfully!');
}

addGradeItemsTranslations().catch(console.error);
