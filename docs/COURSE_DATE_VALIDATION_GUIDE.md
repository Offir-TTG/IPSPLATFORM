# Course Date Validation Implementation Guide

## Overview

This guide explains the complete date validation system for courses and lessons that has been implemented.

## What Has Been Completed

### 1. Backend API Endpoints ✅

Two validation endpoints have been created:

#### `/api/lms/courses/validate` (POST)
For validating **new courses** before creation.

**Request Body:**
```json
{
  "start_date": "2026-01-01",
  "end_date": "2026-02-01",
  "program_id": "uuid"
}
```

#### `/api/lms/courses/[id]/validate` (POST)
For validating **existing courses** when editing.

**Request Body:**
```json
{
  "start_date": "2026-01-01",
  "end_date": "2026-02-01"
}
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "canSave": true,  // false only if there are ERROR-level issues
    "warnings": [
      {
        "type": "warning",  // or "error"
        "message": "lms.courses.validation.lessons_outside_range",
        "details": {
          "count": 2,
          "lessons": [...],
          "courseStart": "2026-01-01",
          "courseEnd": "2026-02-01"
        }
      }
    ]
  }
}
```

### 2. Validation Rules Implemented

#### Warning-Level (Allow Save)
- **Lessons outside course date range**: Some lessons scheduled before course start or after course end
- **No end date**: Course has no end_date (lessons can extend indefinitely)
- **Course overlap**: Course dates overlap with other courses in the same program

#### Error-Level (Block Save)
- **Lesson time overlap**: Two lessons scheduled at the same time (conflicting schedule)

### 3. Translation Keys ✅

All translations have been added in both English and Hebrew:

```
lms.courses.validation.title
lms.courses.validation.lessons_outside_range
lms.courses.validation.lessons_outside_detail
lms.courses.validation.no_end_date
lms.courses.validation.lesson_overlap
lms.courses.validation.lesson_overlap_detail
lms.courses.validation.course_overlap
lms.courses.validation.course_overlap_detail
lms.courses.validation.save_anyway
lms.courses.validation.review
lms.courses.validation.cannot_save
```

### 4. UI Changes ✅

- **Course type badge** has been moved from the header to appear under the instructor name in both grid and list views

## Frontend Integration (To Be Implemented)

### Step 1: Add Validation State

In `src/app/admin/lms/courses/page.tsx`, add state for validation warnings:

```typescript
const [validationWarnings, setValidationWarnings] = useState<any[]>([]);
const [showValidationDialog, setShowValidationDialog] = useState(false);
```

### Step 2: Create Validation Function

```typescript
const validateCourseDates = async (courseData: any, courseId?: string) => {
  try {
    const endpoint = courseId
      ? `/api/lms/courses/${courseId}/validate`
      : `/api/lms/courses/validate`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_date: courseData.start_date,
        end_date: courseData.end_date,
        program_id: courseData.program_id,
      }),
    });

    const result = await response.json();

    if (result.success && result.data.warnings.length > 0) {
      setValidationWarnings(result.data.warnings);
      return result.data.canSave;
    }

    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return true; // Allow save on validation error
  }
};
```

### Step 3: Call Validation Before Save

Update `handleCreateCourse` and `handleUpdateCourse`:

```typescript
const handleCreateCourse = async () => {
  // ... existing validation ...

  // Call date validation
  const canSave = await validateCourseDates(newCourse);

  if (!canSave) {
    // Show error - cannot save due to critical issues
    toast({
      title: t('common.error', 'Error'),
      description: t('lms.courses.validation.cannot_save', 'Cannot save: Critical validation errors'),
      variant: 'destructive',
    });
    return;
  }

  if (validationWarnings.length > 0) {
    // Show confirmation dialog
    setShowValidationDialog(true);
    return; // Wait for user confirmation
  }

  // Proceed with save...
};
```

### Step 4: Add Validation Warning Component

Create a validation warning alert component to display in the dialog:

```tsx
{validationWarnings.length > 0 && (
  <Alert variant="warning" className="mb-4">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>{t('lms.courses.validation.title', 'Date Validation Warnings')}</AlertTitle>
    <AlertDescription>
      <ul className="list-disc pl-4 mt-2">
        {validationWarnings.map((warning, index) => (
          <li key={index}>
            {t(warning.message, warning.message)}
            {warning.details && (
              <div className="text-xs mt-1 text-muted-foreground">
                {JSON.stringify(warning.details)}
              </div>
            )}
          </li>
        ))}
      </ul>
    </AlertDescription>
  </Alert>
)}
```

### Step 5: Add Confirmation Dialog

```tsx
<Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t('lms.courses.validation.title', 'Date Validation Warnings')}</DialogTitle>
    </DialogHeader>

    {/* Display warnings */}
    <div className="space-y-2">
      {validationWarnings.map((warning, index) => (
        <Alert key={index} variant={warning.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>
            {t(warning.message, warning.message)}
          </AlertDescription>
        </Alert>
      ))}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowValidationDialog(false)}>
        {t('lms.courses.validation.review', 'Review Issues')}
      </Button>
      <Button onClick={() => {
        setShowValidationDialog(false);
        proceedWithSave(); // Call actual save function
      }}>
        {t('lms.courses.validation.save_anyway', 'Save Anyway')}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Testing the Validation

### Test Case 1: Lessons Outside Course Dates
1. Create a course with dates: Jan 1 - Jan 31, 2026
2. Add lessons scheduled in December 2025 or February 2026
3. Edit the course dates - you should see a warning

### Test Case 2: Lesson Time Overlap
1. Create a course
2. Add two lessons at the same date/time
3. Try to save - you should see an ERROR and be blocked

### Test Case 3: Course Overlap
1. Create Course A: Jan 1 - Feb 28, 2026
2. Create Course B in same program: Feb 1 - Mar 31, 2026
3. You should see a warning about overlapping dates

### Test Case 4: No End Date
1. Create a course with only a start_date, no end_date
2. You should see a warning that lessons can extend indefinitely

## Database Migration

Run the translation migration:

```bash
psql "postgresql://..." -f "supabase/migrations/20251125_add_course_validation_translations.sql"
```

Or apply it through Supabase SQL Editor.

## Summary

✅ **Completed:**
- Backend validation API endpoints
- Translation keys (English + Hebrew)
- Course type badge repositioned
- Validation logic for all overlap scenarios

📋 **To Do:**
- Integrate validation calls in frontend
- Add validation warning UI components
- Add confirmation dialog for warnings
- Test all validation scenarios

The backend is fully ready - just needs frontend integration!
