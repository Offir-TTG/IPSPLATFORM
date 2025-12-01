-- Add translations for product components (PaymentPlanConfig, ContentSelector, DocuSignConfig)

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the default tenant UUID
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;

  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  -- Insert English and Hebrew translations
  INSERT INTO translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES

    -- =====================================================
    -- Payment Plan Configuration
    -- =====================================================

    -- Payment plan descriptions
    ('en', 'products.payment_plan.one_time_desc', 'Customer pays the full amount upfront in a single payment.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.one_time_desc', 'הלקוח משלם את המחיר המלא מראש בתשלום אחד.', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.free_desc', 'No payment required. This product is free for all users.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.free_desc', 'אין צורך בתשלום. מוצר זה חינמי לכל המשתמשים.', 'admin', NOW(), NOW(), tenant_uuid),

    -- Deposit section
    ('en', 'products.payment_plan.deposit', 'Initial Deposit', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit', 'מקדמה ראשונית', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.deposit_desc', 'Amount customer pays upfront before installments begin', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_desc', 'סכום שהלקוח משלם מראש לפני תחילת התשלומים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.deposit_type', 'Deposit Type', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_type', 'סוג מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.no_deposit', 'No Deposit', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.no_deposit', 'ללא מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.percentage', 'Percentage', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.percentage', 'אחוז', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.fixed_amount', 'Fixed Amount', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.fixed_amount', 'סכום קבוע', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.deposit_percentage', 'Deposit Percentage', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_percentage', 'אחוז מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.deposit_calc', 'Deposit:', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_calc', 'מקדמה:', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.deposit_amount', 'Deposit Amount', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_amount', 'סכום מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.start_delay', 'Start Delay (days)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.start_delay', 'עיכוב התחלה (ימים)', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.start_delay_desc', 'Days between deposit and first installment', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.start_delay_desc', 'ימים בין המקדמה לתשלום הראשון', 'admin', NOW(), NOW(), tenant_uuid),

    -- Installments section
    ('en', 'products.payment_plan.installments', 'Installment Plan', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.installments', 'תוכנית תשלומים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.installments_desc', 'Configure recurring payment schedule', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.installments_desc', 'הגדר לוח תשלומים חוזר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.number_installments', 'Number of Installments', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.number_installments', 'מספר תשלומים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.frequency', 'Payment Frequency', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.frequency', 'תדירות תשלום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.weekly', 'Weekly', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.weekly', 'שבועי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.biweekly', 'Bi-weekly', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.biweekly', 'דו-שבועי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.monthly', 'Monthly', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.monthly', 'חודשי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.quarterly', 'Quarterly', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.quarterly', 'רבעוני', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.annually', 'Annually', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.annually', 'שנתי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.custom', 'Custom', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.custom', 'מותאם אישית', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.custom_days', 'Custom Frequency (days)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.custom_days', 'תדירות מותאמת (ימים)', 'admin', NOW(), NOW(), tenant_uuid),

    -- Subscription section
    ('en', 'products.payment_plan.subscription', 'Subscription Configuration', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.subscription', 'הגדרת מנוי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.subscription_desc', 'Recurring subscription billing', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.subscription_desc', 'חיוב מנוי חוזר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.billing_interval', 'Billing Interval', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.billing_interval', 'מרווח חיוב', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.trial_days', 'Trial Period (days)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.trial_days', 'תקופת ניסיון (ימים)', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.trial_desc', 'Free trial period before first charge', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.trial_desc', 'תקופת ניסיון חינמית לפני חיוב ראשון', 'admin', NOW(), NOW(), tenant_uuid),

    -- Preview section
    ('en', 'products.payment_plan.preview', 'Payment Preview', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.preview', 'תצוגה מקדימה של תשלום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.total_price', 'Total Price', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.total_price', 'מחיר כולל', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.initial_deposit', 'Initial Deposit', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.initial_deposit', 'מקדמה ראשונית', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.installment_amount', 'Installment Amount', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.installment_amount', 'סכום תשלום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.payment_schedule', 'Payment Schedule', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.payment_schedule', 'לוח תשלומים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.total_collected', 'Total to be Collected', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.total_collected', 'סה"כ לגבייה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.subscription_price', 'Subscription Price', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.subscription_price', 'מחיר מנוי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.trial_period', 'Trial Period', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.trial_period', 'תקופת ניסיון', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.days', 'days', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.days', 'ימים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.first_charge', 'First Charge', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.first_charge', 'חיוב ראשון', 'admin', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- Content Selector
    -- =====================================================

    ('en', 'products.bundle', 'Bundle', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.bundle', 'חבילה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.product_type', 'Product Type', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.product_type', 'סוג מוצר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.type_desc', 'Select the type of content this product will provide access to', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.type_desc', 'בחר את סוג התוכן שהמוצר יספק גישה אליו', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.select_program', 'Select Program', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.select_program', 'בחר תוכנית', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.select_program_placeholder', 'Choose a program...', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.select_program_placeholder', 'בחר תוכנית...', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.no_programs', 'No programs available', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.no_programs', 'אין תוכניות זמינות', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.select_course', 'Select Course', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.select_course', 'בחר קורס', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.select_course_placeholder', 'Choose a standalone course...', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.select_course_placeholder', 'בחר קורס עצמאי...', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.no_standalone_courses', 'No standalone courses available', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.no_standalone_courses', 'אין קורסים עצמאיים זמינים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.no_courses', 'No courses available', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.no_courses', 'אין קורסים זמינים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.select_courses_bundle', 'Select Courses for Bundle', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.select_courses_bundle', 'בחר קורסים לחבילה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.session_count', 'Number of Sessions', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.session_count', 'מספר מפגשים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.session_count_placeholder', 'e.g., 10', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.session_count_placeholder', 'למשל, 10', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.session_count_desc', 'Number of sessions included in this pack', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.session_count_desc', 'מספר מפגשים הכלולים בחבילה זו', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.no_content_selection', 'No specific content selection required for this product type. You can add details in the title and description.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.no_content_selection', 'אין צורך בבחירת תוכן ספציפי עבור סוג מוצר זה. ניתן להוסיף פרטים בכותרת ובתיאור.', 'admin', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- DocuSign & Keap Configuration
    -- =====================================================

    ('en', 'products.docusign.title', 'DocuSign Integration', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.title', 'אינטגרציית DocuSign', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.description', 'Require electronic signature before enrollment completion', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.description', 'דרוש חתימה אלקטרונית לפני השלמת הרישום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.require_signature', 'Require Signature', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.require_signature', 'דרוש חתימה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.require_signature_desc', 'Students must sign a document via DocuSign to complete enrollment', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.require_signature_desc', 'תלמידים חייבים לחתום על מסמך דרך DocuSign כדי להשלים את הרישום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.template_id', 'DocuSign Template ID', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.template_id', 'מזהה תבנית DocuSign', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.template_id_placeholder', 'e.g., 12345678-abcd-1234-abcd-123456789abc', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.template_id_placeholder', 'למשל, 12345678-abcd-1234-abcd-123456789abc', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.template_id_desc', 'The ID of the DocuSign template to use for this product', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.template_id_desc', 'מזהה תבנית ה-DocuSign לשימוש במוצר זה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.info', 'When a user enrolls in this product, they will receive a DocuSign envelope to complete before their enrollment is finalized.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.info', 'כאשר משתמש נרשם למוצר זה, הוא יקבל מעטפת DocuSign להשלמה לפני סיום הרישום שלו.', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.title', 'Keap Integration', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.title', 'אינטגרציית Keap', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.description', 'Automatically tag contacts in Keap when they enroll', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.description', 'תייג אוטומטית אנשי קשר ב-Keap כאשר הם נרשמים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.tag', 'Keap Tag', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.tag', 'תגית Keap', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.tag_placeholder', 'e.g., Program: Advanced Leadership', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.tag_placeholder', 'למשל, תוכנית: מנהיגות מתקדמת', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.tag_desc', 'Tag to apply to contacts when they enroll in this product (optional)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.tag_desc', 'תגית להחלה על אנשי קשר כאשר הם נרשמים למוצר זה (אופציונלי)', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.info', 'Contacts will be tagged with this tag in Keap upon enrollment.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.info', 'אנשי קשר יתויגו עם תגית זו ב-Keap עם הרישום.', 'admin', NOW(), NOW(), tenant_uuid)

  ON CONFLICT (language_code, translation_key, tenant_id) DO UPDATE
  SET translation_value = EXCLUDED.translation_value,
      updated_at = NOW();

  RAISE NOTICE 'Product components translations added successfully';
END$$;
