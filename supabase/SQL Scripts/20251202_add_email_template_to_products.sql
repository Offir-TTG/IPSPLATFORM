-- ============================================================================
-- Add Email Template Configuration to Products
-- ============================================================================
-- This migration allows each product to specify which email template(s) to use
-- for enrollment invitations, confirmations, and other communications.
-- ============================================================================

-- Add email template fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS enrollment_invitation_template_key TEXT,
ADD COLUMN IF NOT EXISTS enrollment_confirmation_template_key TEXT,
ADD COLUMN IF NOT EXISTS enrollment_reminder_template_key TEXT;

-- Add comments
COMMENT ON COLUMN products.enrollment_invitation_template_key IS 'Email template key for enrollment invitations (defaults to enrollment.invitation)';
COMMENT ON COLUMN products.enrollment_confirmation_template_key IS 'Email template key for enrollment confirmations (defaults to enrollment.confirmation)';
COMMENT ON COLUMN products.enrollment_reminder_template_key IS 'Email template key for enrollment reminders';

-- Add foreign key constraints to ensure template exists
-- Note: This is a soft constraint - if NULL, use default template
-- Using DO block to check if constraint exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_invitation_template'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT fk_products_invitation_template
      FOREIGN KEY (enrollment_invitation_template_key, tenant_id)
      REFERENCES email_templates(template_key, tenant_id)
      ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_confirmation_template'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT fk_products_confirmation_template
      FOREIGN KEY (enrollment_confirmation_template_key, tenant_id)
      REFERENCES email_templates(template_key, tenant_id)
      ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_reminder_template'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT fk_products_reminder_template
      FOREIGN KEY (enrollment_reminder_template_key, tenant_id)
      REFERENCES email_templates(template_key, tenant_id)
      ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- Create index for faster template lookups
CREATE INDEX IF NOT EXISTS idx_products_invitation_template
ON products(enrollment_invitation_template_key)
WHERE enrollment_invitation_template_key IS NOT NULL;

-- Add translations for product email template selection
INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
VALUES
  -- English
  (NULL, 'products.email_templates.section_title', 'en', 'Email Templates', 'admin'),
  (NULL, 'products.email_templates.section_description', 'en', 'Customize which email templates to use for this product', 'admin'),
  (NULL, 'products.email_templates.invitation_label', 'en', 'Enrollment Invitation Template', 'admin'),
  (NULL, 'products.email_templates.invitation_help', 'en', 'Template used when admin sends enrollment link to a user', 'admin'),
  (NULL, 'products.email_templates.confirmation_label', 'en', 'Enrollment Confirmation Template', 'admin'),
  (NULL, 'products.email_templates.confirmation_help', 'en', 'Template sent when user completes enrollment', 'admin'),
  (NULL, 'products.email_templates.reminder_label', 'en', 'Enrollment Reminder Template', 'admin'),
  (NULL, 'products.email_templates.reminder_help', 'en', 'Template for reminders about incomplete enrollments', 'admin'),
  (NULL, 'products.email_templates.use_default', 'en', 'Use Default Template', 'admin'),

  -- Hebrew
  (NULL, 'products.email_templates.section_title', 'he', 'תבניות אימייל', 'admin'),
  (NULL, 'products.email_templates.section_description', 'he', 'התאמה אישית של תבניות האימייל עבור מוצר זה', 'admin'),
  (NULL, 'products.email_templates.invitation_label', 'he', 'תבנית הזמנה להרשמה', 'admin'),
  (NULL, 'products.email_templates.invitation_help', 'he', 'תבנית המשמשת כאשר מנהל שולח קישור הרשמה למשתמש', 'admin'),
  (NULL, 'products.email_templates.confirmation_label', 'he', 'תבנית אישור הרשמה', 'admin'),
  (NULL, 'products.email_templates.confirmation_help', 'he', 'תבנית הנשלחת כאשר משתמש משלים הרשמה', 'admin'),
  (NULL, 'products.email_templates.reminder_label', 'he', 'תבנית תזכורת הרשמה', 'admin'),
  (NULL, 'products.email_templates.reminder_help', 'he', 'תבנית לתזכורות על הרשמות לא שלמות', 'admin'),
  (NULL, 'products.email_templates.use_default', 'he', 'השתמש בתבנית ברירת מחדל', 'admin')
ON CONFLICT (translation_key, language_code, context) DO UPDATE
SET translation_value = EXCLUDED.translation_value;
