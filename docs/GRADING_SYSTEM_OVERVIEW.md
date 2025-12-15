# Grading System Overview

## Introduction

The Grading System is a comprehensive school-like grading module for the LMS platform. It provides flexible grade calculation, multiple grading scales, weighted categories, GPA tracking, and complete audit trails.

## Features

### 1. Configurable Grading Scales
- **Letter Grades** (A-F with + and - modifiers)
- **Numeric Grades** (0-100 percentage)
- **Pass/Fail** systems
- **Custom Scales** for special requirements
- Multiple scales per tenant
- Default scale selection

### 2. Grade Categories & Weighting
- Create categories like "Homework", "Exams", "Participation", "Final Project"
- Assign weight percentages (e.g., Homework 20%, Exams 50%, Final 30%)
- Drop N lowest scores per category
- Flexible category configuration per course

### 3. Assignment Grading
- Points-based grading (points earned / points possible)
- Automatic percentage calculation
- Letter grade assignment
- Detailed feedback system
- Late submission penalties
- Extra credit support
- Excused assignment handling

### 4. Course Grade Calculation
- **Weighted Average Method**: Categories contribute based on their weight
- **Total Points Method**: Sum all points earned / sum all points possible
- **Custom Methods**: Extensible for special calculation needs
- Automatic grade updates
- Real-time calculation

### 5. GPA Tracking
- Cumulative GPA across all courses
- Semester/Term GPA
- Credit hours tracking
- Detailed calculation breakdown
- Transfer credit support

### 6. Grade History & Audit Trail
- Track all grade changes
- Record who made changes and when
- Store reasons for grade modifications
- Complete transparency

### 7. Student View
- View individual assignment grades
- See current course grade
- Category breakdown display
- GPA dashboard
- Grade history access

### 8. Instructor/Admin Features
- Gradebook view for entire class
- Bulk grade entry
- Grade statistics and analytics
- Grade distribution charts
- Export functionality
- Release/hide grades control

## Database Schema

### Core Tables

#### 1. `grading_scales`
Defines grading scales for the tenant.

```sql
- id: UUID (Primary Key)
- tenant_id: UUID (Foreign Key)
- name: TEXT (e.g., "Standard Letter Grade (A-F)")
- scale_type: TEXT ('letter', 'numeric', 'passfail', 'custom')
- is_default: BOOLEAN
- is_active: BOOLEAN
```

#### 2. `grade_ranges`
Defines grade ranges within a scale.

```sql
- id: UUID (Primary Key)
- grading_scale_id: UUID (Foreign Key)
- grade_label: TEXT (e.g., "A", "B+")
- min_percentage: NUMERIC(5,2) (90.00)
- max_percentage: NUMERIC(5,2) (100.00)
- gpa_value: NUMERIC(4,2) (4.0)
- color_code: TEXT (for UI - "#4CAF50")
- is_passing: BOOLEAN
```

#### 3. `grade_categories`
Defines weighted categories for courses.

```sql
- id: UUID (Primary Key)
- course_id: UUID (Foreign Key)
- name: TEXT (e.g., "Homework")
- weight_percentage: NUMERIC(5,2) (20.00)
- drop_lowest: INTEGER (0)
- display_order: INTEGER
```

#### 4. `course_grading_config`
Configuration for each course's grading system.

```sql
- id: UUID (Primary Key)
- course_id: UUID (Foreign Key)
- grading_scale_id: UUID (Foreign Key)
- use_weighted_categories: BOOLEAN
- passing_percentage: NUMERIC(5,2) (60.00)
- allow_extra_credit: BOOLEAN
- round_final_grades: BOOLEAN
- show_grades_to_students: BOOLEAN
- release_grades_date: TIMESTAMPTZ
- grade_calculation_method: TEXT ('weighted_average', 'total_points', 'custom')
```

#### 5. `assignment_grades`
Individual assignment grades for students.

```sql
- id: UUID (Primary Key)
- assignment_id: UUID (Foreign Key)
- user_id: UUID (Foreign Key)
- grade_category_id: UUID (Foreign Key)
- points_earned: NUMERIC(10,2)
- points_possible: NUMERIC(10,2)
- percentage: NUMERIC(5,2) (Auto-calculated)
- letter_grade: TEXT
- feedback: TEXT
- is_excused: BOOLEAN
- is_extra_credit: BOOLEAN
- is_late: BOOLEAN
- late_penalty_applied: NUMERIC(5,2)
```

#### 6. `course_grades`
Calculated final grades for students in courses.

```sql
- id: UUID (Primary Key)
- course_id: UUID (Foreign Key)
- user_id: UUID (Foreign Key)
- current_percentage: NUMERIC(5,2)
- final_percentage: NUMERIC(5,2)
- letter_grade: TEXT
- gpa_value: NUMERIC(4,2)
- is_passing: BOOLEAN
- category_grades: JSONB (breakdown by category)
- is_final: BOOLEAN
```

#### 7. `grade_history`
Audit trail for grade changes.

```sql
- id: UUID (Primary Key)
- grade_type: TEXT ('assignment', 'course')
- grade_id: UUID
- field_changed: TEXT
- old_value: TEXT
- new_value: TEXT
- changed_by: UUID (Foreign Key to users)
- change_reason: TEXT
```

#### 8. `student_gpa`
Overall GPA tracking for students.

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- cumulative_gpa: NUMERIC(4,2)
- semester_gpa: NUMERIC(4,2)
- total_credits_earned: NUMERIC(6,2)
- total_credits_attempted: NUMERIC(6,2)
- calculation_details: JSONB
```

## Grade Calculation Methods

### 1. Weighted Average Method

Used when courses have different categories with different weights.

**Example:**
```
Homework (20%): 85%
Quizzes (20%): 90%
Midterm (25%): 88%
Final (35%): 92%

Final Grade = (85 × 0.20) + (90 × 0.20) + (88 × 0.25) + (92 × 0.35)
            = 17 + 18 + 22 + 32.2
            = 89.2%
            = B+
```

**With Drop Lowest:**
If Homework category has "drop 1 lowest" and student has scores: 85, 90, 75, 95
- Drop 75 (lowest)
- Use: 85, 90, 95
- Average: (85 + 90 + 95) / 3 = 90%

### 2. Total Points Method

Sum all points earned divided by sum of all points possible.

**Example:**
```
Assignment 1: 45/50 points
Assignment 2: 38/40 points
Assignment 3: 88/100 points
Exam: 85/100 points

Total: (45 + 38 + 88 + 85) = 256 points earned
Total Possible: (50 + 40 + 100 + 100) = 290 points

Percentage = 256 / 290 = 88.28% = B+
```

### 3. GPA Calculation

**Formula:**
```
GPA = Σ(Grade Points × Credits) / Σ(Credits)
```

**Example:**
```
Course 1: A (4.0 GPA) × 3 credits = 12.0 points
Course 2: B+ (3.3 GPA) × 4 credits = 13.2 points
Course 3: A- (3.7 GPA) × 3 credits = 11.1 points

Total Points: 12.0 + 13.2 + 11.1 = 36.3
Total Credits: 3 + 4 + 3 = 10

Cumulative GPA = 36.3 / 10 = 3.63
```

## Standard US Letter Grade Scale

| Grade | Min % | Max % | GPA | Color | Passing |
|-------|-------|-------|-----|-------|---------|
| A+ | 97 | 100 | 4.0 | Green | Yes |
| A | 93 | 96.99 | 4.0 | Green | Yes |
| A- | 90 | 92.99 | 3.7 | Light Green | Yes |
| B+ | 87 | 89.99 | 3.3 | Light Green | Yes |
| B | 83 | 86.99 | 3.0 | Yellow-Green | Yes |
| B- | 80 | 82.99 | 2.7 | Yellow-Green | Yes |
| C+ | 77 | 79.99 | 2.3 | Yellow | Yes |
| C | 73 | 76.99 | 2.0 | Yellow | Yes |
| C- | 70 | 72.99 | 1.7 | Light Yellow | Yes |
| D+ | 67 | 69.99 | 1.3 | Orange | Yes |
| D | 63 | 66.99 | 1.0 | Orange | Yes |
| D- | 60 | 62.99 | 0.7 | Dark Orange | Yes |
| F | 0 | 59.99 | 0.0 | Red | No |

## API Endpoints

### Grading Scales
- `GET /api/admin/grading/scales` - List all grading scales
- `POST /api/admin/grading/scales` - Create a new grading scale
- `GET /api/admin/grading/scales/[id]` - Get a specific scale
- `PUT /api/admin/grading/scales/[id]` - Update a scale
- `DELETE /api/admin/grading/scales/[id]` - Delete a scale

### Grade Ranges
- `GET /api/admin/grading/scales/[id]/ranges` - Get ranges for a scale
- `POST /api/admin/grading/scales/[id]/ranges` - Add a range
- `PUT /api/admin/grading/ranges/[id]` - Update a range
- `DELETE /api/admin/grading/ranges/[id]` - Delete a range

### Course Grading Config
- `GET /api/admin/courses/[id]/grading-config` - Get course config
- `PUT /api/admin/courses/[id]/grading-config` - Update config

### Grade Categories
- `GET /api/admin/courses/[id]/grade-categories` - List categories
- `POST /api/admin/courses/[id]/grade-categories` - Create category
- `PUT /api/admin/grade-categories/[id]` - Update category
- `DELETE /api/admin/grade-categories/[id]` - Delete category

### Assignment Grades
- `GET /api/admin/assignments/[id]/grades` - Get all grades for assignment
- `POST /api/admin/assignments/[id]/grades` - Create/update grade
- `GET /api/admin/users/[userId]/grades` - Get all grades for a student

### Course Grades
- `GET /api/admin/courses/[id]/grades` - Get gradebook for course
- `GET /api/admin/courses/[id]/grades/[userId]` - Get specific student grade
- `POST /api/admin/courses/[id]/calculate-grades` - Recalculate all grades
- `GET /api/admin/courses/[id]/grade-statistics` - Get grade statistics

### Student Endpoints
- `GET /api/user/grades` - Get my grades across all courses
- `GET /api/user/courses/[id]/grades` - Get my grades for a course
- `GET /api/user/gpa` - Get my GPA

## Implementation Steps

### 1. Database Setup
```bash
# Run the SQL script
psql -h your-supabase-host -U postgres -d postgres -f run-this-sql.sql
```

### 2. Initial Configuration
- Create default grading scale for your tenant
- Add grade ranges (A-F or custom)
- Configure course grading settings

### 3. Set Up Categories
For each course:
- Create grade categories (Homework, Exams, etc.)
- Assign weights (must total 100%)
- Configure drop lowest if needed

### 4. Grade Assignments
- As students submit assignments, create assignment_grades records
- Points are converted to percentages automatically
- Course grades are calculated automatically

### 5. View and Export
- Access gradebook UI
- View statistics and distributions
- Export grades as needed

## Usage Examples

### Creating a Grading Scale with Ranges

```typescript
// 1. Create the scale
const scale = await supabase
  .from('grading_scales')
  .insert({
    tenant_id: tenantId,
    name: 'Standard Letter Grade (A-F)',
    scale_type: 'letter',
    is_default: true,
    is_active: true,
  })
  .select()
  .single();

// 2. Add grade ranges
for (const range of STANDARD_LETTER_GRADES) {
  await supabase.from('grade_ranges').insert({
    tenant_id: tenantId,
    grading_scale_id: scale.id,
    ...range,
  });
}
```

### Configuring a Course for Grading

```typescript
// 1. Create grade categories
const categories = [
  { name: 'Homework', weight_percentage: 20, drop_lowest: 1 },
  { name: 'Quizzes', weight_percentage: 20, drop_lowest: 2 },
  { name: 'Midterm Exam', weight_percentage: 25, drop_lowest: 0 },
  { name: 'Final Exam', weight_percentage: 35, drop_lowest: 0 },
];

for (const [index, cat] of categories.entries()) {
  await supabase.from('grade_categories').insert({
    tenant_id: tenantId,
    course_id: courseId,
    ...cat,
    display_order: index + 1,
  });
}

// 2. Configure course grading
await supabase.from('course_grading_config').insert({
  tenant_id: tenantId,
  course_id: courseId,
  grading_scale_id: scaleId,
  use_weighted_categories: true,
  passing_percentage: 60,
  allow_extra_credit: true,
  round_final_grades: true,
  show_grades_to_students: true,
  grade_calculation_method: 'weighted_average',
});
```

### Grading an Assignment

```typescript
import { createClient } from '@/lib/supabase/client';

// Create or update assignment grade
const { data, error } = await supabase
  .from('assignment_grades')
  .upsert({
    tenant_id: tenantId,
    assignment_id: assignmentId,
    user_id: studentId,
    course_id: courseId,
    grade_category_id: categoryId,
    points_earned: 45,
    points_possible: 50,
    feedback: 'Great work! Minor issues with problem 3.',
    graded_by: instructorId,
    graded_at: new Date().toISOString(),
    is_late: false,
  });

// Percentage is auto-calculated: 45/50 = 90%
```

### Calculating Course Grade

```typescript
import { calculateCourseGrade } from '@/lib/grading/gradeCalculator';

// Get all data needed
const assignmentGrades = await getStudentAssignmentGrades(courseId, userId);
const categories = await getCourseCategories(courseId);
const config = await getCourseGradingConfig(courseId);
const gradeRanges = await getGradeRanges(config.grading_scale_id);

// Calculate
const result = calculateCourseGrade(
  assignmentGrades,
  categories,
  config,
  gradeRanges
);

// Store result
await supabase.from('course_grades').upsert({
  tenant_id: tenantId,
  course_id: courseId,
  user_id: userId,
  current_percentage: result.current_percentage,
  letter_grade: result.letter_grade,
  gpa_value: result.gpa_value,
  is_passing: result.is_passing,
  category_grades: result.category_breakdown,
  last_calculated_at: new Date().toISOString(),
});
```

## Best Practices

### 1. Grade Entry
- Enter grades promptly after assignments are submitted
- Provide meaningful feedback
- Double-check points before finalizing
- Use excused status for legitimate absences

### 2. Category Configuration
- Ensure weights add up to 100%
- Use drop lowest sparingly (typically 1-2 lowest)
- Group similar assignments in same category
- Keep category count manageable (3-6 categories)

### 3. Grade Calculation
- Recalculate grades after any configuration change
- Test calculation logic with sample data
- Validate results before releasing to students
- Document any custom calculation methods

### 4. Security & Privacy
- Students can only view their own grades
- Instructors can view all grades in their courses
- Admins have full access
- Grade history tracks all changes

### 5. Performance
- Use batch operations for bulk grading
- Cache calculated grades
- Index frequently queried columns
- Paginate large gradebooks

## Future Enhancements

1. **Gradebook UI Components**
   - Interactive gradebook table
   - Grade entry forms
   - Statistics dashboards
   - Grade distribution charts

2. **Advanced Features**
   - Curved grading
   - Standards-based grading
   - Mastery-based assessment
   - Weighted vs. unweighted GPA

3. **Integration**
   - Export to SIS systems
   - Import from external gradebooks
   - LTI integration
   - Parent/guardian access

4. **Analytics**
   - Grade prediction
   - At-risk student identification
   - Comparative analytics
   - Historical trends

## Support & Documentation

For questions or issues with the grading system:
1. Check this documentation
2. Review the database schema comments
3. Examine the TypeScript types in `src/types/grading.ts`
4. Study the calculation engine in `src/lib/grading/gradeCalculator.ts`

## Conclusion

The Grading System provides a comprehensive, flexible solution for managing grades in the LMS platform. It supports multiple grading methods, maintains complete audit trails, and provides powerful analytics while remaining easy to use for instructors and students.
