# Course Builder Translation & RTL Implementation Guide

## Overview
This document outlines the required changes to add full translation and RTL support to the Course Builder page (`src/app/admin/lms/courses/[id]/page.tsx`).

## Status
✅ Translation SQL file created: `supabase/migrations/20251117_lms_builder_translations.sql`
✅ Direction and isRtl variables added to main component

## Required Changes

### 1. SortableModule Component (Lines 120-327)

**Add Props:**
```typescript
function SortableModule({
  module,
  onToggleExpand,
  onAddLesson,
  onEdit,
  onDelete,
  onDeleteLesson,
  onCreateZoomMeeting,
  creatingZoomFor,
  t,           // ADD
  direction,   // ADD
  isRtl        // ADD
}: {
  module: Module;
  onToggleExpand: () => void;
  onAddLesson: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteLesson: (lessonId: string) => void;
  onCreateZoomMeeting: (lessonId: string) => void;
  creatingZoomFor: string | null;
  t: any;           // ADD
  direction: string; // ADD
  isRtl: boolean;    // ADD
}) {
```

**Update Hardcoded Strings:**
- Line 183: `"Draft"` → `{t('lms.builder.draft', 'Draft')}`
- Line 187: `"Optional"` → `{t('lms.builder.optional', 'Optional')}`
- Line 205: `"Add Lesson"` → `{t('lms.builder.add_lesson', 'Add Lesson')}`
- Line 209: `"Edit Module"` → `{t('lms.builder.edit_module', 'Edit Module')}`
- Line 213: `"Delete Module"` → `{t('lms.builder.delete_module', 'Delete Module')}`
- Line 245: `"Published"` → `{t('lms.builder.published', 'Published')}`
- Line 252: `"Recorded"` → `{t('lms.builder.recorded', 'Recorded')}`
- Line 262: `"Zoom"` → Keep as is (brand name)
- Line 276: `"Creating..."` → `{t('common.creating', 'Creating...')}`
- Line 281: `"Add Zoom"` → Keep as is (brand name)
- Line 310: `"No lessons yet"` → `{t('lms.builder.no_lessons', 'No lessons yet')}`
- Line 318: `"Add First Lesson"` → `{t('lms.builder.add_first_lesson', 'Add First Lesson')}`

**Add RTL Support:**
- Line 162: Add `flex-row-reverse` when RTL for drag handle
- Line 179: Add RTL text alignment
- Line 202: Add `dir={direction}` to DropdownMenuContent
- Line 204-213: Add icon direction classes (mr-2 → isRtl ? 'ml-2' : 'mr-2')

### 2. Main Page Header (Lines 863-892)

**Current Code (Line 872):**
```typescript
{t('lms.builder.back', 'Back')}
```
✅ Already using translation

**Line 877:**
```typescript
{t('lms.builder.title', 'Course Builder')} - Drag & Drop Canvas
```
Change to:
```typescript
{t('lms.builder.title', 'Course Builder')} - {t('lms.builder.subtitle', 'Drag & Drop Canvas')}
```

**Lines 882-889:** Already using translations ✅

**Add RTL to Header (Line 863):**
```typescript
<div className="border-b px-6 py-4" dir={direction}>
```

**Add RTL to Buttons Container (Line 881):**
```typescript
<div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
```

### 3. Course Structure Section (Lines 895-920)

**Line 902:**
```typescript
<CardTitle>Course Structure</CardTitle>
```
Change to:
```typescript
<CardTitle className={isRtl ? 'text-right' : 'text-left'}>
  {t('lms.builder.course_structure', 'Course Structure')}
</CardTitle>
```

**Line 910:**
```typescript
Bulk Add Modules
```
Change to:
```typescript
{t('lms.builder.bulk_add_modules', 'Bulk Add Modules')}
```

**Line 917:**
```typescript
Add Module
```
Change to:
```typescript
{t('lms.builder.add_module', 'Add Module')}
```

**Line 937:**
```typescript
<p className="text-lg font-medium mb-2">No modules yet</p>
```
Change to:
```typescript
<p className="text-lg font-medium mb-2">{t('lms.builder.no_modules', 'No modules yet')}</p>
```

**Line 939:**
```typescript
Start building your course by adding modules
```
Change to:
```typescript
{t('lms.builder.start_building', 'Start building your course by adding modules')}
```

**Line 943:**
```typescript
Create Your First Module
```
Change to:
```typescript
{t('lms.builder.create_first_module', 'Create Your First Module')}
```

**Pass Props to SortableModule (Line 948):**
```typescript
<SortableModule
  key={module.id}
  module={module}
  onToggleExpand={() => toggleModuleExpansion(module.id)}
  onAddLesson={() => {
    setSelectedModule(module);
    setShowLessonDialog(true);
  }}
  onEdit={() => {
    // ... existing code
  }}
  onDelete={() => handleDeleteModule(module.id)}
  onDeleteLesson={(lessonId) => handleDeleteLesson(lessonId, module.id)}
  onCreateZoomMeeting={handleCreateZoomMeeting}
  creatingZoomFor={creatingZoomFor}
  t={t}           // ADD
  direction={direction}   // ADD
  isRtl={isRtl}   // ADD
/>
```

### 4. Course Overview Statistics (Lines 995-1022)

**Line 996:**
```typescript
<CardTitle>Course Overview</CardTitle>
```
Change to:
```typescript
<CardTitle className={isRtl ? 'text-right' : 'text-left'}>
  {t('lms.builder.course_overview', 'Course Overview')}
</CardTitle>
```

**Lines 1001, 1007, 1013, 1019:**
```typescript
<p className="text-sm text-muted-foreground">Total Modules</p>
<p className="text-sm text-muted-foreground">Total Lessons</p>
<p className="text-sm text-muted-foreground">Total Duration</p>
<p className="text-sm text-muted-foreground">Published Modules</p>
```
Change to:
```typescript
<p className={`text-sm text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
  {t('lms.builder.total_modules', 'Total Modules')}
</p>
<p className={`text-sm text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
  {t('lms.builder.total_lessons', 'Total Lessons')}
</p>
<p className={`text-sm text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
  {t('lms.builder.total_duration', 'Total Duration')}
</p>
<p className={`text-sm text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
  {t('lms.builder.published_modules', 'Published Modules')}
</p>
```

**Line 1011:**
```typescript
{modules.reduce((acc, m) => acc + (m.duration_minutes || 0), 0)} min
```
Change to:
```typescript
{modules.reduce((acc, m) => acc + (m.duration_minutes || 0), 0)} {t('lms.builder.minutes_abbr', 'min')}
```

### 5. Module Dialog (Lines 1028-1094)

**Line 1030:**
```typescript
<DialogContent className="max-w-2xl">
```
Change to:
```typescript
<DialogContent className="max-w-2xl" dir={direction}>
```

**Line 1032:**
```typescript
<DialogTitle>Create Module</DialogTitle>
```
Change to:
```typescript
<DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
  {t('lms.builder.create_module', 'Create Module')}
</DialogTitle>
```

**Line 1039:**
```typescript
<Label>Module Title</Label>
```
Change to:
```typescript
<Label className={isRtl ? 'text-right' : 'text-left'}>
  {t('lms.builder.module_title', 'Module Title')}
</Label>
```

**Line 1042:**
```typescript
<Input ... />
```
Add:
```typescript
<Input className={isRtl ? 'text-right' : 'text-left'} ... />
```

**Similar changes for:**
- Line 1046: Description label
- Line 1050: Textarea (add dir and className)
- Line 1056: Duration label
- Line 1060: Input (add className)
- Line 1072: "Published" label
- Line 1081: "Optional" label

**Line 1086-1090:**
```typescript
<DialogFooter>
  <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
    Cancel
  </Button>
  <Button onClick={handleCreateModule}>
    Create Module
  </Button>
</DialogFooter>
```
Change to:
```typescript
<DialogFooter className={isRtl ? 'flex-row-reverse gap-3' : 'gap-3'}>
  <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
    {t('lms.builder.cancel', 'Cancel')}
  </Button>
  <Button onClick={handleCreateModule}>
    {t('lms.builder.create_module', 'Create Module')}
  </Button>
</DialogFooter>
```

### 6. Lesson Dialog (Lines 1096-1151)

**Similar pattern as Module Dialog:**
- Add `dir={direction}` to DialogContent
- Add RTL classes to DialogTitle, Labels
- Translate all hardcoded strings
- Add RTL to DialogFooter

**Line 1100:**
```typescript
<DialogTitle>Add Lesson to {selectedModule?.title}</DialogTitle>
```
Change to:
```typescript
<DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
  {t('lms.builder.add_lesson_to', 'Add Lesson to {module}').replace('{module}', selectedModule?.title || '')}
</DialogTitle>
```

### 7. Bulk Module Dialog (Lines 1153-1211)

**Similar pattern as above dialogs**

**Line 1157:**
```typescript
<DialogTitle>Bulk Create Modules</DialogTitle>
```
Change to:
```typescript
<DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
  {t('lms.builder.bulk_create_modules', 'Bulk Create Modules')}
</DialogTitle>
```

**Line 1164:**
```typescript
<Label>Number of Modules</Label>
```
Change to:
```typescript
<Label className={isRtl ? 'text-right' : 'text-left'}>
  {t('lms.builder.number_of_modules', 'Number of Modules')}
</Label>
```

**Line 1175:**
```typescript
<Label>Title Pattern</Label>
```
Change to:
```typescript
<Label className={isRtl ? 'text-right' : 'text-left'}>
  {t('lms.builder.title_pattern', 'Title Pattern')}
</Label>
```

**Line 1180:**
```typescript
placeholder="Module {n}"
```
Change to:
```typescript
placeholder={t('lms.builder.title_pattern_help', 'Module {n}')}
```

**Line 1185:**
```typescript
<div className="text-xs text-muted-foreground">
  <strong>Preview:</strong>
```
Change to:
```typescript
<div className={`text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
  <strong>{t('lms.builder.preview_label', 'Preview:')}</strong>
```

**Line 1196:**
```typescript
{parseInt(bulkModuleForm.count) > 3 && (
  <div>... and more</div>
)}
```
Change to:
```typescript
{parseInt(bulkModuleForm.count) > 3 && (
  <div>{t('lms.builder.and_more', '...and more')}</div>
)}
```

**Line 1207:**
```typescript
Create {bulkModuleForm.count} Modules
```
Change to:
```typescript
{t('lms.builder.create_modules_count', 'Create {count} Modules').replace('{count}', bulkModuleForm.count)}
```

## Additional Translations Needed

Add these to the translation SQL file:
```sql
(v_tenant_id, 'he', 'lms.builder.draft', 'טיוטה', 'admin', NOW(), NOW()),
(v_tenant_id, 'he', 'lms.builder.recorded', 'מוקלט', 'admin', NOW(), NOW()),
```

## Testing Checklist

- [ ] Run translation migration
- [ ] Test in Hebrew (RTL) mode
- [ ] Test in English (LTR) mode
- [ ] Verify all dialogs have proper RTL support
- [ ] Verify all dropdown menus align correctly
- [ ] Verify drag handles work in both directions
- [ ] Verify all text is translated
- [ ] Verify statistics display correctly
- [ ] Test module creation/editing
- [ ] Test lesson creation/deletion
- [ ] Test bulk module creation

## Implementation Priority

1. ✅ Add direction/isRtl variables
2. SortableModule component (HIGH - most visible)
3. Page header (HIGH - first thing users see)
4. Dialogs (MEDIUM - frequent user interaction)
5. Statistics section (LOW - informational)

## Notes

- The file is 1200+ lines, making inline edits error-prone
- Consider breaking this into smaller components
- All icon mr-2/ml-2 classes need conditional RTL support
- All DialogFooter components need RTL flex-row-reverse
- All Labels need RTL text alignment
- All Inputs/Textareas need RTL dir and className support
