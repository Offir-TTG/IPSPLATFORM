-- Profile Edit and Social Media Translations

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id from existing data
    SELECT tenant_id INTO v_tenant_id FROM public.translations LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant_id found in translations table';
    END IF;

    -- English translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        -- Edit Profile Dialog
        ('en', 'user.profile.edit.title', 'Edit Profile', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.edit.description', 'Update your profile information', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.edit.first_name', 'First Name', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.edit.last_name', 'Last Name', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.edit.phone', 'Phone', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.edit.bio', 'Bio', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.edit.location', 'Location', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.edit.timezone', 'Timezone', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.edit.location_placeholder', 'Tel Aviv, Israel', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.edit.timezone_placeholder', 'Asia/Jerusalem', 'user', v_tenant_id, NOW(), NOW()),

        -- Social Links Section
        ('en', 'user.profile.social.title', 'Social Links', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.social.website', 'Website', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.social.website_placeholder', 'yoursite.com', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.social.linkedin', 'LinkedIn', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.social.linkedin_placeholder', 'linkedin.com/in/yourprofile', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.social.facebook', 'Facebook', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.social.facebook_placeholder', 'facebook.com/yourprofile', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.social.instagram', 'Instagram', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.social.instagram_placeholder', 'instagram.com/yourprofile', 'user', v_tenant_id, NOW(), NOW()),

        -- Dialog Actions
        ('en', 'user.profile.edit.cancel', 'Cancel', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.edit.save', 'Save Changes', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.edit.saving', 'Saving...', 'user', v_tenant_id, NOW(), NOW()),

        -- Avatar Upload Dialog
        ('en', 'user.profile.avatar.title', 'Change Avatar', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.avatar.description', 'Upload a new profile picture. Maximum file size: 2MB', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.avatar.select', 'Click to select an image', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.avatar.formats', 'PNG, JPG, GIF up to 2MB', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.avatar.upload', 'Upload Avatar', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.avatar.uploading', 'Uploading...', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.avatar.error_size', 'File size must be less than 2MB', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.avatar.error_select', 'Please select an image file', 'user', v_tenant_id, NOW(), NOW()),

        -- Success/Error Messages
        ('en', 'user.profile.message.update_success', 'Profile updated successfully', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.message.update_error', 'Failed to update profile', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.message.avatar_success', 'Avatar updated successfully', 'user', v_tenant_id, NOW(), NOW()),
        ('en', 'user.profile.message.avatar_error', 'Failed to upload avatar', 'user', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    -- Hebrew translations
    INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, created_at, updated_at)
    VALUES
        -- Edit Profile Dialog
        ('he', 'user.profile.edit.title', 'עריכת פרופיל', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.edit.description', 'עדכן את פרטי הפרופיל שלך', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.edit.first_name', 'שם פרטי', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.edit.last_name', 'שם משפחה', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.edit.phone', 'טלפון', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.edit.bio', 'אודות', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.edit.location', 'מיקום', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.edit.timezone', 'אזור זמן', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.edit.location_placeholder', 'תל אביב, ישראל', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.edit.timezone_placeholder', 'Asia/Jerusalem', 'user', v_tenant_id, NOW(), NOW()),

        -- Social Links Section
        ('he', 'user.profile.social.title', 'קישורים חברתיים', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.social.website', 'אתר אינטרנט', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.social.website_placeholder', 'yoursite.com', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.social.linkedin', 'לינקדאין', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.social.linkedin_placeholder', 'linkedin.com/in/yourprofile', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.social.facebook', 'פייסבוק', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.social.facebook_placeholder', 'facebook.com/yourprofile', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.social.instagram', 'אינסטגרם', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.social.instagram_placeholder', 'instagram.com/yourprofile', 'user', v_tenant_id, NOW(), NOW()),

        -- Dialog Actions
        ('he', 'user.profile.edit.cancel', 'ביטול', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.edit.save', 'שמור שינויים', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.edit.saving', 'שומר...', 'user', v_tenant_id, NOW(), NOW()),

        -- Avatar Upload Dialog
        ('he', 'user.profile.avatar.title', 'שנה תמונת פרופיל', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.avatar.description', 'העלה תמונת פרופיל חדשה. גודל קובץ מקסימלי: 2MB', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.avatar.select', 'לחץ לבחירת תמונה', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.avatar.formats', 'PNG, JPG, GIF עד 2MB', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.avatar.upload', 'העלה תמונה', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.avatar.uploading', 'מעלה...', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.avatar.error_size', 'גודל הקובץ חייב להיות פחות מ-2MB', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.avatar.error_select', 'אנא בחר קובץ תמונה', 'user', v_tenant_id, NOW(), NOW()),

        -- Success/Error Messages
        ('he', 'user.profile.message.update_success', 'הפרופיל עודכן בהצלחה', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.message.update_error', 'עדכון הפרופיל נכשל', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.message.avatar_success', 'תמונת הפרופיל עודכנה בהצלחה', 'user', v_tenant_id, NOW(), NOW()),
        ('he', 'user.profile.message.avatar_error', 'העלאת תמונת הפרופיל נכשלה', 'user', v_tenant_id, NOW(), NOW())
    ON CONFLICT (tenant_id, language_code, translation_key)
    DO UPDATE SET
        translation_value = EXCLUDED.translation_value,
        context = EXCLUDED.context,
        updated_at = NOW();

    RAISE NOTICE 'Successfully added/updated profile edit translations for tenant %', v_tenant_id;
END $$;
