# Complete Grading System - Implementation Plan

## Overview
This document outlines the complete implementation of the grading system for the LMS platform.

## ✅ Completed

### Database Schema
- [x] `grading_scales` table - Base grading scales (A-F, Pass/Fail, etc.)
- [x] `grade_ranges` table - Individual grade ranges (A=90-100, etc.)
- [x] `courses.grading_scale_id` column - Link courses to grading scales
- [x] `grade_categories` table - Weighted components (Homework 20%, Exams 50%)
- [x] `grade_items` table - Individual assignments, quizzes, exams
- [x] `student_grades` table - Individual student scores
- [x] `student_course_grades` view - Calculated final grades
- [x] Helper functions: `calculate_category_grade()`, `get_letter_grade()`
- [x] RLS policies for all tables

### TypeScript Types
- [x] `GradingScale`, `GradeRange` types
- [x] `GradeCategory`, `GradeItem`, `StudentGrade` types
- [x] All Create/Update input types
- [x] `StudentCourseGrade` view type

### UI Pages - Grading Scales
- [x] `/admin/grading/scales` - List all grading scales
- [x] `/admin/grading/scales/[id]` - Manage grade ranges for a scale
- [x] Create/Edit/Delete grading scales
- [x] Create/Edit/Delete grade ranges
- [x] RTL support
- [x] Translations (English + Hebrew)

### API Routes - Grading Scales
- [x] `GET/POST /api/admin/grading/scales` - List/create scales
- [x] `GET/PUT/DELETE /api/admin/grading/scales/[id]` - Get/update/delete scale
- [x] `GET/POST /api/admin/grading/scales/[id]/ranges` - List/create ranges
- [x] `PUT/DELETE /api/admin/grading/scales/[id]/ranges/[rangeId]` - Update/delete range

## 🚧 To Build

### 1. Course Integration (PRIORITY 1)
**Goal**: Link courses to grading scales

#### Files to Create/Modify:
- [ ] Modify `/src/app/admin/lms/courses/[id]/page.tsx`
  - Add grading scale selector to course settings
  - Display selected grading scale

#### API Routes to Create:
- [ ] `PUT /api/admin/lms/courses/[id]` (modify existing)
  - Add `grading_scale_id` to update payload

### 2. Grade Categories Management (PRIORITY 2)
**Goal**: Create weighted grade categories for courses (Homework 20%, Exams 50%)

#### Pages to Create:
- [ ] `/src/app/admin/lms/courses/[id]/grading/categories/page.tsx`
  - List all grade categories for a course
  - Create/Edit/Delete categories
  - Set weights (must total 100%)
  - Set drop_lowest for each category
  - Visual weight distribution chart

#### API Routes to Create:
- [ ] `GET /api/admin/lms/courses/[courseId]/grading/categories`
  - List all categories for a course
- [ ] `POST /api/admin/lms/courses/[courseId]/grading/categories`
  - Create new category
  - Validate weights total ≤ 100%
- [ ] `PUT /api/admin/lms/courses/[courseId]/grading/categories/[id]`
  - Update category
- [ ] `DELETE /api/admin/lms/courses/[courseId]/grading/categories/[id]`
  - Delete category
  - Only if no grade items assigned

### 3. Grade Items Management (PRIORITY 3)
**Goal**: Create individual assignments, quizzes, exams

#### Pages to Create:
- [ ] `/src/app/admin/lms/courses/[id]/grading/items/page.tsx`
  - List all grade items grouped by category
  - Create/Edit/Delete grade items
  - Set max_points, due dates
  - Publish/unpublish items
  - Mark as extra credit

#### API Routes to Create:
- [ ] `GET /api/admin/lms/courses/[courseId]/grading/items`
  - List all grade items for a course
- [ ] `POST /api/admin/lms/courses/[courseId]/grading/items`
  - Create new grade item
- [ ] `PUT /api/admin/lms/courses/[courseId]/grading/items/[id]`
  - Update grade item
- [ ] `DELETE /api/admin/lms/courses/[courseId]/grading/items/[id]`
  - Delete grade item
  - Only if no student grades exist

### 4. Gradebook (PRIORITY 4)
**Goal**: Instructor view to grade all students

#### Pages to Create:
- [ ] `/src/app/admin/lms/courses/[id]/gradebook/page.tsx`
  - Spreadsheet-like interface
  - Rows = students
  - Columns = grade items
  - Enter points earned for each student/item
  - Show calculated final grades
  - Export to CSV/Excel

#### API Routes to Create:
- [ ] `GET /api/admin/lms/courses/[courseId]/gradebook`
  - Get full gradebook data
  - Returns all students, all grade items, all grades
  - Returns calculated final percentages and letter grades
- [ ] `POST /api/admin/lms/courses/[courseId]/gradebook/batch`
  - Batch update multiple student grades at once
  - For quick data entry

### 5. Student Grading Interface (PRIORITY 5)
**Goal**: Grade individual students on individual assignments

#### Pages to Create:
- [ ] `/src/app/admin/lms/courses/[id]/grading/students/[studentId]/items/[itemId]/page.tsx`
  - Grade one student on one assignment
  - Show submission (if exists)
  - Enter points earned
  - Add feedback
  - Mark as late, excused, etc.

#### API Routes to Create:
- [ ] `GET /api/admin/lms/courses/[courseId]/grading/students/[studentId]/items/[itemId]`
  - Get grade for specific student/item
- [ ] `PUT /api/admin/lms/courses/[courseId]/grading/students/[studentId]/items/[itemId]`
  - Update grade for specific student/item
- [ ] `POST /api/admin/lms/courses/[courseId]/grading/items/[itemId]/grades`
  - Create grades for all enrolled students (initialize)

### 6. Student Grade View (PRIORITY 6)
**Goal**: Students see their own grades

#### Pages to Create:
- [ ] `/src/app/(user)/courses/[id]/grades/page.tsx`
  - Student view of their grades
  - List all grade items with their scores
  - Show category breakdowns
  - Show calculated final grade
  - Show letter grade and GPA

#### API Routes to Create:
- [ ] `GET /api/user/courses/[courseId]/grades`
  - Get current user's grades for a course
  - Returns all graded items, calculated percentage, letter grade

### 7. Reports & Analytics (PRIORITY 7)
**Goal**: Grade distribution, statistics

#### Pages to Create:
- [ ] `/src/app/admin/lms/courses/[id]/grading/reports/page.tsx`
  - Grade distribution histogram
  - Average, median, min, max per assignment
  - Class average
  - Passing rate
  - Students at risk (below passing)

#### API Routes to Create:
- [ ] `GET /api/admin/lms/courses/[courseId]/grading/reports`
  - Get statistics and analytics

## Navigation Structure

```
Admin Dashboard
└── Grading
    └── Grading Scales (/admin/grading/scales) ✅
        └── Scale Detail (/admin/grading/scales/[id]) ✅

└── LMS
    └── Courses (/admin/lms/courses)
        └── Course Detail (/admin/lms/courses/[id])
            ├── Overview (current page)
            ├── Grading Setup 🆕
            │   ├── Select Grading Scale 🆕
            │   ├── Grade Categories 🆕
            │   └── Grade Items 🆕
            ├── Gradebook 🆕
            └── Reports 🆕

User Dashboard
└── My Courses
    └── Course Detail
        └── My Grades 🆕
```

## Implementation Order

### Phase 1: Foundation (30 min)
1. Run SQL schema migrations ✅
2. Update TypeScript types ✅
3. Add grading scale selector to course form

### Phase 2: Setup (1-2 hours)
4. Create grade categories management page
5. Create grade categories API routes
6. Create grade items management page
7. Create grade items API routes

### Phase 3: Grading (1-2 hours)
8. Create gradebook page
9. Create gradebook API routes
10. Create student grading interface
11. Create student grading API routes

### Phase 4: Student View (30 min)
12. Create student grade view page
13. Create student grade view API route

### Phase 5: Polish (30 min)
14. Add all translations
15. Create reports page
16. Documentation

## Key Features

### Auto-Calculations
- Percentage = (points_earned / max_points) * 100
- Category grade = weighted average of items in category (with drop_lowest)
- Final grade = weighted sum of category grades
- Letter grade = lookup in grading scale based on final percentage

### Validation Rules
- Category weights must total ≤ 100%
- Points earned cannot exceed max_points
- Only published items count towards final grade
- Excused assignments don't count against student

### Security
- Students can only see published grade items
- Students can only see their own grades
- Instructors/Admins can manage all grades
- Private notes only visible to instructors

## SQL Files
1. `20251215_complete_grading_system.sql` - Main schema ✅
2. `20251215_grading_complete_translations.sql` - All translations (to create)

## Estimated Time
- **Total**: 4-5 hours for complete implementation
- **MVP** (Categories + Items + Gradebook): 2-3 hours
- **Full System**: 4-5 hours
