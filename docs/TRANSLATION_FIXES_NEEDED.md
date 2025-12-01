# Translation Fixes Needed

## Problem
The course builder page has Hebrew fallback values in the `t()` function calls. These should all be in English, with the actual Hebrew translations coming from the database.

## How Translation Works
```typescript
t('translation.key', 'English Fallback')
```
- First tries to find 'translation.key' in the database for current language
- If not found, uses the English Fallback value
- Fallbacks should ALWAYS be in English

## Keys with Hebrew Fallbacks (Need to be Fixed to English)

### Line 230
- Current: `t('lms.builder.bulk_add_lessons', 'הוסף שיעורים בכמות')`
- Fixed: `t('lms.builder.bulk_add_lessons', 'Bulk Add Lessons')` ✅

### Lines 725, 728, 732 (Module deletion)
- Current: `t('lms.module.deleted_success', 'מודול נמחק בהצלחה')`
- Should be: `t('lms.module.deleted_success', 'Module deleted successfully')`

- Current: `t('lms.module.delete_failed', 'מחיקת מודול נכשלה')`
- Should be: `t('lms.module.delete_failed', 'Failed to delete module')`

### Bulk Lesson Dialog (Lines 2088+)

#### Series Information
- `t('lms.lesson.series_info_title', 'פרטי סדרה')` → `'Series Information'`
- `t('lms.lesson.series_name_label', 'שם הסדרה')` → `'Series Name'`
- `t('lms.lesson.series_name_placeholder', 'למשל, מבוא להורות')` → `'e.g., Introduction to Parenting'`
- `t('lms.lesson.series_name_help', 'זה ישמש למתן שמות לשיעורים ולפגישות Zoom')` → `'This will be used to name lessons and Zoom meetings'`
- `t('lms.lesson.title_pattern_label', 'תבנית כותרת שיעור')` → `'Lesson Title Pattern'`
- `t('lms.lesson.title_pattern_placeholder', 'מפגש {n}')` → `'Session {n}'`

#### Schedule Settings
- `t('lms.lesson.schedule_settings_title', 'הגדרות תזמון')` → `'Schedule Settings'`
- `t('lms.lesson.start_date_label', 'תאריך התחלה')` → `'Start Date'`
- `t('lms.lesson.time_of_day_label', 'שעת היום')` → `'Time of Day'`
- `t('lms.lesson.duration_minutes_label', 'משך (דקות)')` → `'Duration (minutes)'`
- `t('lms.lesson.timezone_label', 'אזור זמן')` → `'Timezone'`
- `t('lms.lesson.recurrence_pattern_label', 'תבנית חזרה')` → `'Recurrence Pattern'`
- `t('lms.lesson.recurrence_weekly', 'שבועי')` → `'Weekly'`
- `t('lms.lesson.recurrence_daily', 'יומי')` → `'Daily'`
- `t('lms.lesson.day_of_week_label', 'יום בשבוע')` → `'Day of Week'`

#### Days of Week
- `t('lms.lesson.day_sunday', 'ראשון')` → `'Sunday'`
- `t('lms.lesson.day_monday', 'שני')` → `'Monday'`
- `t('lms.lesson.day_tuesday', 'שלישי')` → `'Tuesday'`
- `t('lms.lesson.day_wednesday', 'רביעי')` → `'Wednesday'`
- `t('lms.lesson.day_thursday', 'חמישי')` → `'Thursday'`
- `t('lms.lesson.day_friday', 'שישי')` → `'Friday'`
- `t('lms.lesson.day_saturday', 'שבת')` → `'Saturday'`

#### Session Count
- `t('lms.lesson.number_of_sessions_label', 'מספר מפגשים')` → `'Number of Sessions'`

#### Zoom Integration
- `t('lms.lesson.bulk_zoom_title', 'אינטגרציה עם Zoom')` → `'Zoom Integration'`
- `t('lms.lesson.bulk_zoom_desc', 'צור פגישות Zoom אוטומטית לכל שיעור')` → `'Create Zoom meetings automatically for each lesson'`
- `t('lms.lesson.zoom_name_pattern_label', 'תבנית שם פגישת Zoom')` → `'Zoom Meeting Name Pattern'`
- `t('lms.lesson.zoom_name_pattern_placeholder', '{series_name} - מפגש {n}')` → `'{series_name} - Session {n}'`
- `t('lms.lesson.zoom_agenda_common_label', 'סדר יום פגישת Zoom (אופציונלי)')` → `'Zoom Meeting Agenda (Optional)'`
- `t('lms.lesson.zoom_agenda_common_placeholder', 'סדר יום משותף לכל המפגשים...')` → `'Common agenda for all sessions...'`
- `t('lms.lesson.zoom_recurring_option', 'צור כפגישת Zoom חוזרת (כל המפגשים מקושרים)')` → `'Create as recurring Zoom meeting (all sessions linked)'`

#### Zoom Security Settings
- `t('lms.zoom.security_settings_title', 'הגדרות אבטחה')` → `'Security Settings'`
- `t('lms.zoom.passcode_label', 'סיסמת פגישה (אופציונלי)')` → `'Meeting Passcode (Optional)'`
- `t('lms.zoom.passcode_placeholder', 'הזן סיסמה...')` → `'Enter passcode...'`
- `t('lms.zoom.passcode_help', 'סיסמה למניעת גישה לא מורשית (6-10 תווים)')` → `'Passcode to prevent unauthorized access (6-10 characters)'`
- `t('lms.zoom.waiting_room_label', 'חדר המתנה')` → `'Waiting Room'`
- `t('lms.zoom.join_before_host_label', 'אפשר משתתפים להצטרף לפני המארח')` → `'Allow participants to join before host'`
- `t('lms.zoom.mute_upon_entry_label', 'השתק משתתפים בכניסה')` → `'Mute participants upon entry'`
- `t('lms.zoom.require_authentication_label', 'דרוש אימות להצטרפות')` → `'Require authentication to join'`

#### Zoom Video/Audio Settings
- `t('lms.zoom.video_audio_settings_title', 'הגדרות וידאו ואודיו')` → `'Video & Audio Settings'`
- `t('lms.zoom.host_video_label', 'הפעל וידאו מארח בכניסה')` → `'Start host video on join'`
- `t('lms.zoom.participant_video_label', 'הפעל וידאו משתתפים בכניסה')` → `'Start participant video on join'`
- `t('lms.zoom.audio_options_label', 'אפשרויות שמע')` → `'Audio Options'`
- `t('lms.zoom.audio_both', 'טלפון ומחשב')` → `'Phone and Computer'`
- `t('lms.zoom.audio_telephony', 'טלפון בלבד')` → `'Phone Only'`
- `t('lms.zoom.audio_voip', 'מחשב בלבד')` → `'Computer Only'`

#### Zoom Recording Settings
- `t('lms.zoom.recording_settings_title', 'הגדרות הקלטה')` → `'Recording Settings'`
- `t('lms.zoom.auto_recording_label', 'הקלטה אוטומטית')` → `'Auto Recording'`
- `t('lms.zoom.recording_none', 'ללא הקלטה')` → `'No Recording'`
- `t('lms.zoom.recording_local', 'הקלטה מקומית')` → `'Local Recording'`
- `t('lms.zoom.recording_cloud', 'הקלטה בענן')` → `'Cloud Recording'`
- `t('lms.zoom.record_speaker_view_label', 'הקלט דובר פעיל עם שיתוף מסך')` → `'Record active speaker with screen sharing'`
- `t('lms.zoom.recording_disclaimer_label', 'הצג הצהרת הקלטה')` → `'Show recording disclaimer'`

#### Preview
- `t('lms.lesson.preview_title', 'תצוגה מקדימה')` → `'Preview'`
- `t('lms.lesson.preview_text', 'זה יצור {count} שיעורים...')` → `'This will create {count} lessons...'`
- `t('lms.lesson.preview_weekly', 'כל שבוע')` → `'weekly'`
- `t('lms.lesson.preview_daily', 'יומי')` → `'daily'`
- `t('lms.lesson.preview_with_zoom', ', כל אחד עם פגישת Zoom')` → `', each with a Zoom meeting'`

#### Timezone Options
- `t('lms.lesson.timezone_group_common', 'נפוצים')` → `'Common'`
- `t('lms.lesson.timezone_jerusalem', 'ירושלים (GMT+2/+3)')` → `'Jerusalem (GMT+2/+3)'`
- `t('lms.lesson.timezone_newyork', 'ניו יורק (GMT-5/-4)')` → `'New York (GMT-5/-4)'`
- `t('lms.lesson.timezone_losangeles', 'לוס אנג\'לס (GMT-8/-7)')` → `'Los Angeles (GMT-8/-7)'`
- `t('lms.lesson.timezone_london', 'לונדון (GMT+0/+1)')` → `'London (GMT+0/+1)'`
- `t('lms.lesson.timezone_group_americas', 'אמריקה')` → `'Americas'`
- `t('lms.lesson.timezone_group_europe', 'אירופה')` → `'Europe'`
- `t('lms.lesson.timezone_group_asia', 'אסיה')` → `'Asia'`
- `t('lms.lesson.timezone_group_pacific', 'אוקיינוסיה')` → `'Pacific'`
- `t('lms.lesson.timezone_group_africa', 'אפריקה')` → `'Africa'`
- `t('lms.lesson.timezone_group_other', 'אחר')` → `'Other'`

## Action Required

1. **Immediate Fix**: Replace all Hebrew fallback values with English in the source code
2. **Database Migration**: Ensure all these translation keys exist in the database with proper Hebrew translations
3. **Verification**: Test with both English and Hebrew language settings to confirm translations work correctly

## Notes

- The fallback parameter in `t()` function is ONLY used when the database doesn't have a translation
- For production use, all keys should have database translations in both Hebrew and English
- Users will select their language, and the system fetches the appropriate translations from the database
