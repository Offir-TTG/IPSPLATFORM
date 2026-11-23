-- The agreement signing dialog in the enrollment wizard (he + en).
-- Already applied on 22 Nov 2026; kept for other environments. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'user', NOW(), NOW()
FROM (VALUES
  ('en', 'enrollment.wizard.signature.dialogTitle', 'Sign the agreement'),
  ('he', 'enrollment.wizard.signature.dialogTitle', 'חתימה על ההסכם'),
  ('en', 'enrollment.wizard.signature.dialogHint', 'When you finish signing, this window closes and the enrollment continues.'),
  ('he', 'enrollment.wizard.signature.dialogHint', 'בסיום החתימה החלון ייסגר וההרשמה תמשיך.'),
  ('en', 'enrollment.wizard.signature.openWindow', 'Not loading? Open the signing in a new window'),
  ('he', 'enrollment.wizard.signature.openWindow', 'לא נטען? פתיחת החתימה בחלון חדש'),
  ('en', 'enrollment.wizard.signature.declined', 'The agreement was declined. Contact us if this was a mistake.'),
  ('he', 'enrollment.wizard.signature.declined', 'ההסכם נדחה. אם זו טעות, אפשר לפנות אלינו.'),
  ('en', 'enrollment.wizard.signature.notSigned', 'The agreement was not signed yet. You can sign it whenever you are ready.'),
  ('he', 'enrollment.wizard.signature.notSigned', 'ההסכם עוד לא נחתם. אפשר לחתום מתי שנוח.'),
  ('en', 'enrollment.wizard.signature.returned', 'Thank you. You can go back to the enrollment.'),
  ('he', 'enrollment.wizard.signature.returned', 'תודה. אפשר לחזור להרשמה.'),
  ('en', 'enrollment.wizard.signature.returning', 'One moment...'),
  ('he', 'enrollment.wizard.signature.returning', 'רגע...'),
  ('en', 'enrollment.wizard.signature.loading', 'Opening the agreement...'),
  ('he', 'enrollment.wizard.signature.loading', 'פותחים את ההסכם...'),
  ('en', 'enrollment.wizard.signature.howTitle', 'How to sign'),
  ('he', 'enrollment.wizard.signature.howTitle', 'איך חותמים'),
  ('en', 'enrollment.wizard.signature.how1', 'In the signing window, click "Next" at the top.'),
  ('he', 'enrollment.wizard.signature.how1', 'בחלון החתימה לוחצים על "הבא" למעלה.'),
  ('en', 'enrollment.wizard.signature.how2', 'It takes you to the yellow "Sign" field. Click it and choose your signature.'),
  ('he', 'enrollment.wizard.signature.how2', 'הוא מוביל לשדה החתימה הצהוב. לוחצים עליו ובוחרים חתימה.'),
  ('en', 'enrollment.wizard.signature.how3', 'Click "Finish". The enrollment continues here on its own.'),
  ('he', 'enrollment.wizard.signature.how3', 'לוחצים "סיום". ההרשמה תמשיך כאן לבד.'),
  ('en', 'enrollment.wizard.signature.waiting', 'The signing window is open. Waiting for your signature...'),
  ('he', 'enrollment.wizard.signature.waiting', 'חלון החתימה פתוח. מחכים לחתימה...'),
  ('en', 'enrollment.wizard.signature.showWindow', 'Show the window'),
  ('he', 'enrollment.wizard.signature.showWindow', 'הצגת החלון')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
