-- Translations for the redesigned Products list (/admin/payments/products),
-- its drawer and the product wizard page. Existing products.* and
-- admin.payments.products.* keys are reused; only new wording is here.
-- Safe to re-run.

DO $$
DECLARE
  keys text[] := ARRAY[
    'admin.products.list.count',
    'admin.products.list.kpiAll',
    'admin.products.list.product',
    'admin.products.list.price',
    'admin.products.drawer.description',
    'admin.products.drawer.access',
    'admin.products.drawer.yes',
    'admin.products.drawer.no',
    'admin.products.drawer.crmTags',
    'admin.products.drawer.about',
    'admin.products.drawer.edit',
    'admin.products.drawer.copyLink',
    'admin.products.wizard.backToList',
    'admin.products.wizard.delete',
    'admin.products.wizard.notFound',
    'admin.products.wizard.unsaved',
    'admin.products.wizard.newNote',
    'admin.products.wizard.discard'
  ];
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key = ANY (keys);

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.products.list.count', '{count} products', 'admin', NULL, 'admin'),
    ('he', 'admin.products.list.count', '{count} מוצרים', 'admin', NULL, 'admin'),
    ('en', 'admin.products.list.kpiAll', 'All products', 'admin', NULL, 'admin'),
    ('he', 'admin.products.list.kpiAll', 'כל המוצרים', 'admin', NULL, 'admin'),
    ('en', 'admin.products.list.product', 'Product', 'admin', NULL, 'admin'),
    ('he', 'admin.products.list.product', 'מוצר', 'admin', NULL, 'admin'),
    ('en', 'admin.products.list.price', 'Price', 'admin', NULL, 'admin'),
    ('he', 'admin.products.list.price', 'מחיר', 'admin', NULL, 'admin'),
    ('en', 'admin.products.drawer.description', 'Product summary', 'admin', NULL, 'admin'),
    ('he', 'admin.products.drawer.description', 'סיכום המוצר', 'admin', NULL, 'admin'),
    ('en', 'admin.products.drawer.access', 'Access', 'admin', NULL, 'admin'),
    ('he', 'admin.products.drawer.access', 'גישה', 'admin', NULL, 'admin'),
    ('en', 'admin.products.drawer.yes', 'Yes', 'admin', NULL, 'admin'),
    ('he', 'admin.products.drawer.yes', 'כן', 'admin', NULL, 'admin'),
    ('en', 'admin.products.drawer.no', 'No', 'admin', NULL, 'admin'),
    ('he', 'admin.products.drawer.no', 'לא', 'admin', NULL, 'admin'),
    ('en', 'admin.products.drawer.crmTags', 'CRM tags', 'admin', NULL, 'admin'),
    ('he', 'admin.products.drawer.crmTags', 'תגיות CRM', 'admin', NULL, 'admin'),
    ('en', 'admin.products.drawer.about', 'Description', 'admin', NULL, 'admin'),
    ('he', 'admin.products.drawer.about', 'תיאור', 'admin', NULL, 'admin'),
    ('en', 'admin.products.drawer.edit', 'Edit product', 'admin', NULL, 'admin'),
    ('he', 'admin.products.drawer.edit', 'עריכת המוצר', 'admin', NULL, 'admin'),
    ('en', 'admin.products.drawer.copyLink', 'Copy link', 'admin', NULL, 'admin'),
    ('he', 'admin.products.drawer.copyLink', 'העתקת קישור', 'admin', NULL, 'admin'),
    ('en', 'admin.products.wizard.backToList', 'Back to products', 'admin', NULL, 'admin'),
    ('he', 'admin.products.wizard.backToList', 'חזרה למוצרים', 'admin', NULL, 'admin'),
    ('en', 'admin.products.wizard.delete', 'Delete', 'admin', NULL, 'admin'),
    ('he', 'admin.products.wizard.delete', 'מחיקה', 'admin', NULL, 'admin'),
    ('en', 'admin.products.wizard.notFound', 'This product was not found. It may have been deleted.', 'admin', NULL, 'admin'),
    ('he', 'admin.products.wizard.notFound', 'המוצר לא נמצא. ייתכן שנמחק.', 'admin', NULL, 'admin'),
    ('en', 'admin.products.wizard.unsaved', 'You have unsaved changes', 'admin', NULL, 'admin'),
    ('he', 'admin.products.wizard.unsaved', 'יש שינויים שלא נשמרו', 'admin', NULL, 'admin'),
    ('en', 'admin.products.wizard.newNote', 'New product, not saved yet', 'admin', NULL, 'admin'),
    ('he', 'admin.products.wizard.newNote', 'מוצר חדש, עדיין לא נשמר', 'admin', NULL, 'admin'),
    ('en', 'admin.products.wizard.discard', 'Discard', 'admin', NULL, 'admin'),
    ('he', 'admin.products.wizard.discard', 'ביטול השינויים', 'admin', NULL, 'admin');
END $$;
