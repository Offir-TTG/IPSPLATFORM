$file = "src\app\admin\lms\courses\[id]\page.tsx"
$content = Get-Content $file -Raw

# Define replacements (Hebrew -> English)
$replacements = @{
    "t\('lms.builder.bulk_add_lessons', 'הוסף שיעורים בכמות'\)" = "t('lms.builder.bulk_add_lessons', 'Bulk Add Lessons')"
    "t\('lms.module.deleted_success', 'מודול נמחק בהצלחה'\)" = "t('lms.module.deleted_success', 'Module deleted successfully')"
    "t\('lms.module.delete_failed', 'מחיקת מודול נכשלה'\)" = "t('lms.module.delete_failed', 'Failed to delete module')"
    "t\('lms.lesson.series_info_title', 'פרטי סדרה'\)" = "t('lms.lesson.series_info_title', 'Series Information')"
    "t\('lms.lesson.series_name_label', 'שם הסדרה'\)" = "t('lms.lesson.series_name_label', 'Series Name')"
    "t\('lms.lesson.series_name_placeholder', 'למשל, מבוא להורות'\)" = "t('lms.lesson.series_name_placeholder', 'e.g., Introduction to Parenting')"
    "t\('lms.lesson.series_name_help', 'זה ישמש למתן שמות לשיעורים ולפגישות Zoom'\)" = "t('lms.lesson.series_name_help', 'This will be used to name lessons and Zoom meetings')"
    "t\('lms.lesson.title_pattern_label', 'תבנית כותרת שיעור'\)" = "t('lms.lesson.title_pattern_label', 'Lesson Title Pattern')"
    "t\('lms.lesson.title_pattern_placeholder', 'מפגש \{n\}'\)" = "t('lms.lesson.title_pattern_placeholder', 'Session {n}')"
    "t\('lms.lesson.schedule_settings_title', 'הגדרות תזמון'\)" = "t('lms.lesson.schedule_settings_title', 'Schedule Settings')"
    "t\('lms.lesson.start_date_label', 'תאריך התחלה'\)" = "t('lms.lesson.start_date_label', 'Start Date')"
    "t\('lms.lesson.time_of_day_label', 'שעת היום'\)" = "t('lms.lesson.time_of_day_label', 'Time of Day')"
    "t\('lms.lesson.duration_minutes_label', 'משך \(דקות\)'\)" = "t('lms.lesson.duration_minutes_label', 'Duration (minutes)')"
    "t\('lms.lesson.timezone_label', 'אזור זמן'\)" = "t('lms.lesson.timezone_label', 'Timezone')"
    "t\('lms.lesson.recurrence_pattern_label', 'תבנית חזרה'\)" = "t('lms.lesson.recurrence_pattern_label', 'Recurrence Pattern')"
    "t\('lms.lesson.recurrence_weekly', 'שבועי'\)" = "t('lms.lesson.recurrence_weekly', 'Weekly')"
    "t\('lms.lesson.recurrence_daily', 'יומי'\)" = "t('lms.lesson.recurrence_daily', 'Daily')"
    "t\('lms.lesson.day_of_week_label', 'יום בשבוע'\)" = "t('lms.lesson.day_of_week_label', 'Day of Week')"
    "t\('lms.lesson.day_sunday', 'ראשון'\)" = "t('lms.lesson.day_sunday', 'Sunday')"
    "t\('lms.lesson.day_monday', 'שני'\)" = "t('lms.lesson.day_monday', 'Monday')"
    "t\('lms.lesson.day_tuesday', 'שלישי'\)" = "t('lms.lesson.day_tuesday', 'Tuesday')"
    "t\('lms.lesson.day_wednesday', 'רביעי'\)" = "t('lms.lesson.day_wednesday', 'Wednesday')"
    "t\('lms.lesson.day_thursday', 'חמישי'\)" = "t('lms.lesson.day_thursday', 'Thursday')"
    "t\('lms.lesson.day_friday', 'שישי'\)" = "t('lms.lesson.day_friday', 'Friday')"
    "t\('lms.lesson.day_saturday', 'שבת'\)" = "t('lms.lesson.day_saturday', 'Saturday')"
    "t\('lms.lesson.number_of_sessions_label', 'מספר מפגשים'\)" = "t('lms.lesson.number_of_sessions_label', 'Number of Sessions')"
    "t\('lms.lesson.bulk_zoom_title', 'אינטגרציה עם Zoom'\)" = "t('lms.lesson.bulk_zoom_title', 'Zoom Integration')"
    "t\('lms.lesson.bulk_zoom_desc', 'צור פגישות Zoom אוטומטית לכל שיעור'\)" = "t('lms.lesson.bulk_zoom_desc', 'Create Zoom meetings automatically for each lesson')"
}

foreach ($pattern in $replacements.Keys) {
    $replacement = $replacements[$pattern]
    $content = $content -replace $pattern, $replacement
}

$content | Set-Content $file -NoNewline
Write-Host "Translations fixed successfully"
