// ============================================================================
// GRADING SYSTEM TypeScript Type Definitions
// ============================================================================
// Complete type definitions for the Grading System
// Matches database schema in run-this-sql.sql
// ============================================================================

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type ScaleType = 'letter' | 'numeric' | 'passfail' | 'custom';
export type GradeCalculationMethod = 'weighted_average' | 'total_points' | 'custom';
export type GradeType = 'assignment' | 'course';

// ============================================================================
// GRADING SCALE
// ============================================================================

export interface GradingScale {
  id: string;
  tenant_id: string;
  name: string; // e.g., "Standard Letter Grade (A-F)", "Pass/Fail"
  description: string | null;
  scale_type: ScaleType;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Relations (populated when needed)
  grade_ranges?: GradeRange[];
}

export interface GradingScaleCreateInput {
  name: string;
  description?: string;
  scale_type: ScaleType;
  is_default?: boolean;
  is_active?: boolean;
}

export interface GradingScaleUpdateInput {
  name?: string;
  description?: string;
  scale_type?: ScaleType;
  is_default?: boolean;
  is_active?: boolean;
}

// ============================================================================
// GRADE RANGE
// ============================================================================

export interface GradeRange {
  id: string;
  tenant_id: string;
  grading_scale_id: string;
  grade_label: string; // e.g., "A", "B+", "Pass", "Excellent"
  min_percentage: number; // 0-100
  max_percentage: number; // 0-100
  gpa_value: number | null; // e.g., 4.0 for A, 3.7 for A-
  display_order: number;
  color_code: string | null; // e.g., "#4CAF50" for green
  is_passing: boolean;
  created_at: string;

  // Relations
  grading_scale?: GradingScale;
}

export interface GradeRangeCreateInput {
  grading_scale_id: string;
  grade_label: string;
  min_percentage: number;
  max_percentage: number;
  gpa_value?: number;
  display_order: number;
  color_code?: string;
  is_passing?: boolean;
}

export interface GradeRangeUpdateInput {
  grade_label?: string;
  min_percentage?: number;
  max_percentage?: number;
  gpa_value?: number;
  display_order?: number;
  color_code?: string;
  is_passing?: boolean;
}

// Standard US Letter Grade Scale
export const STANDARD_LETTER_GRADES: Omit<GradeRangeCreateInput, 'grading_scale_id'>[] = [
  { grade_label: 'A+', min_percentage: 97, max_percentage: 100, gpa_value: 4.0, display_order: 1, color_code: '#4CAF50', is_passing: true },
  { grade_label: 'A', min_percentage: 93, max_percentage: 96.99, gpa_value: 4.0, display_order: 2, color_code: '#4CAF50', is_passing: true },
  { grade_label: 'A-', min_percentage: 90, max_percentage: 92.99, gpa_value: 3.7, display_order: 3, color_code: '#66BB6A', is_passing: true },
  { grade_label: 'B+', min_percentage: 87, max_percentage: 89.99, gpa_value: 3.3, display_order: 4, color_code: '#81C784', is_passing: true },
  { grade_label: 'B', min_percentage: 83, max_percentage: 86.99, gpa_value: 3.0, display_order: 5, color_code: '#9CCC65', is_passing: true },
  { grade_label: 'B-', min_percentage: 80, max_percentage: 82.99, gpa_value: 2.7, display_order: 6, color_code: '#AED581', is_passing: true },
  { grade_label: 'C+', min_percentage: 77, max_percentage: 79.99, gpa_value: 2.3, display_order: 7, color_code: '#FDD835', is_passing: true },
  { grade_label: 'C', min_percentage: 73, max_percentage: 76.99, gpa_value: 2.0, display_order: 8, color_code: '#FFEB3B', is_passing: true },
  { grade_label: 'C-', min_percentage: 70, max_percentage: 72.99, gpa_value: 1.7, display_order: 9, color_code: '#FFF176', is_passing: true },
  { grade_label: 'D+', min_percentage: 67, max_percentage: 69.99, gpa_value: 1.3, display_order: 10, color_code: '#FFB74D', is_passing: true },
  { grade_label: 'D', min_percentage: 63, max_percentage: 66.99, gpa_value: 1.0, display_order: 11, color_code: '#FFA726', is_passing: true },
  { grade_label: 'D-', min_percentage: 60, max_percentage: 62.99, gpa_value: 0.7, display_order: 12, color_code: '#FF9800', is_passing: true },
  { grade_label: 'F', min_percentage: 0, max_percentage: 59.99, gpa_value: 0.0, display_order: 13, color_code: '#EF5350', is_passing: false },
];

// ============================================================================
// GRADE CATEGORY
// ============================================================================

export interface GradeCategory {
  id: string;
  tenant_id: string;
  course_id: string | null;
  name: string; // e.g., "Homework", "Exams", "Participation"
  description: string | null;
  weight_percentage: number; // 0-100
  drop_lowest: number; // Drop N lowest scores
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  course?: import('./lms').Course;
  assignment_grades?: AssignmentGrade[];
}

export interface GradeCategoryCreateInput {
  course_id?: string;
  name: string;
  description?: string;
  weight_percentage: number;
  drop_lowest?: number;
  display_order: number;
  is_active?: boolean;
}

export interface GradeCategoryUpdateInput {
  name?: string;
  description?: string;
  weight_percentage?: number;
  drop_lowest?: number;
  display_order?: number;
  is_active?: boolean;
}

// ============================================================================
// COURSE GRADING CONFIG
// ============================================================================

export interface CourseGradingConfig {
  id: string;
  tenant_id: string;
  course_id: string;
  grading_scale_id: string;
  use_weighted_categories: boolean;
  passing_percentage: number; // 0-100
  allow_extra_credit: boolean;
  round_final_grades: boolean;
  show_grades_to_students: boolean;
  release_grades_date: string | null;
  grade_calculation_method: GradeCalculationMethod;
  created_at: string;
  updated_at: string;

  // Relations
  course?: import('./lms').Course;
  grading_scale?: GradingScale;
}

export interface CourseGradingConfigCreateInput {
  course_id: string;
  grading_scale_id: string;
  use_weighted_categories?: boolean;
  passing_percentage?: number;
  allow_extra_credit?: boolean;
  round_final_grades?: boolean;
  show_grades_to_students?: boolean;
  release_grades_date?: string;
  grade_calculation_method?: GradeCalculationMethod;
}

export interface CourseGradingConfigUpdateInput {
  grading_scale_id?: string;
  use_weighted_categories?: boolean;
  passing_percentage?: number;
  allow_extra_credit?: boolean;
  round_final_grades?: boolean;
  show_grades_to_students?: boolean;
  release_grades_date?: string;
  grade_calculation_method?: GradeCalculationMethod;
}

// ============================================================================
// ASSIGNMENT GRADE
// ============================================================================

export interface AssignmentGrade {
  id: string;
  tenant_id: string;
  assignment_id: string;
  submission_id: string | null;
  user_id: string;
  course_id: string;
  grade_category_id: string | null;

  // Scoring
  points_earned: number | null;
  points_possible: number;
  percentage: number; // Auto-calculated

  // Letter grade
  letter_grade: string | null;

  // Grading metadata
  graded_by: string | null;
  graded_at: string | null;
  feedback: string | null;
  is_excused: boolean;
  is_extra_credit: boolean;
  is_late: boolean;
  late_penalty_applied: number; // Percentage

  // Audit
  created_at: string;
  updated_at: string;

  // Relations
  assignment?: import('./lms').Assignment;
  submission?: import('./lms').AssignmentSubmission;
  user?: import('./lms').User;
  course?: import('./lms').Course;
  grade_category?: GradeCategory;
  grader?: import('./lms').User;
}

export interface AssignmentGradeCreateInput {
  assignment_id: string;
  submission_id?: string;
  user_id: string;
  course_id: string;
  grade_category_id?: string;
  points_earned?: number;
  points_possible: number;
  letter_grade?: string;
  feedback?: string;
  is_excused?: boolean;
  is_extra_credit?: boolean;
  is_late?: boolean;
  late_penalty_applied?: number;
}

export interface AssignmentGradeUpdateInput {
  points_earned?: number;
  points_possible?: number;
  letter_grade?: string;
  feedback?: string;
  is_excused?: boolean;
  is_extra_credit?: boolean;
  is_late?: boolean;
  late_penalty_applied?: number;
}

// ============================================================================
// COURSE GRADE
// ============================================================================

export interface CategoryGradeBreakdown {
  category_id: string;
  category_name: string;
  percentage: number;
  weight: number;
  points_earned: number;
  points_possible: number;
}

export interface CourseGrade {
  id: string;
  tenant_id: string;
  course_id: string;
  user_id: string;
  enrollment_id: string | null;

  // Calculated grades
  current_percentage: number | null;
  final_percentage: number | null;
  letter_grade: string | null;
  gpa_value: number | null;
  is_passing: boolean | null;

  // Category breakdown
  category_grades: CategoryGradeBreakdown[]; // JSONB

  // Metadata
  calculation_method: GradeCalculationMethod;
  last_calculated_at: string | null;
  is_final: boolean;
  finalized_at: string | null;
  finalized_by: string | null;

  // Comments
  instructor_notes: string | null;

  // Audit
  created_at: string;
  updated_at: string;

  // Relations
  course?: import('./lms').Course;
  user?: import('./lms').User;
  enrollment?: import('./lms').Enrollment;
  finalizer?: import('./lms').User;
}

export interface CourseGradeCreateInput {
  course_id: string;
  user_id: string;
  enrollment_id?: string;
  current_percentage?: number;
  final_percentage?: number;
  letter_grade?: string;
  gpa_value?: number;
  is_passing?: boolean;
  category_grades?: CategoryGradeBreakdown[];
  calculation_method?: GradeCalculationMethod;
  instructor_notes?: string;
}

export interface CourseGradeUpdateInput {
  current_percentage?: number;
  final_percentage?: number;
  letter_grade?: string;
  gpa_value?: number;
  is_passing?: boolean;
  category_grades?: CategoryGradeBreakdown[];
  calculation_method?: GradeCalculationMethod;
  is_final?: boolean;
  instructor_notes?: string;
}

// ============================================================================
// GRADE HISTORY
// ============================================================================

export interface GradeHistory {
  id: string;
  tenant_id: string;
  grade_type: GradeType;
  grade_id: string;
  user_id: string;

  // What changed
  field_changed: string; // e.g., "points_earned", "percentage", "letter_grade"
  old_value: string | null;
  new_value: string | null;

  // Who and why
  changed_by: string | null;
  change_reason: string | null;

  // When
  changed_at: string;

  // Relations
  user?: import('./lms').User;
  changer?: import('./lms').User;
}

export interface GradeHistoryCreateInput {
  grade_type: GradeType;
  grade_id: string;
  user_id: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  changed_by?: string;
  change_reason?: string;
}

// ============================================================================
// STUDENT GPA
// ============================================================================

export interface GPACalculationDetails {
  course_id: string;
  course_name: string;
  letter_grade: string;
  gpa_value: number;
  credits: number;
  semester?: string;
}

export interface StudentGPA {
  id: string;
  tenant_id: string;
  user_id: string;

  // GPA calculations
  cumulative_gpa: number | null;
  semester_gpa: number | null;
  total_credits_earned: number;
  total_credits_attempted: number;

  // Metadata
  last_calculated_at: string | null;
  calculation_details: {
    courses: GPACalculationDetails[];
  }; // JSONB

  // Audit
  created_at: string;
  updated_at: string;

  // Relations
  user?: import('./lms').User;
}

export interface StudentGPACreateInput {
  user_id: string;
  cumulative_gpa?: number;
  semester_gpa?: number;
  total_credits_earned?: number;
  total_credits_attempted?: number;
  calculation_details?: {
    courses: GPACalculationDetails[];
  };
}

export interface StudentGPAUpdateInput {
  cumulative_gpa?: number;
  semester_gpa?: number;
  total_credits_earned?: number;
  total_credits_attempted?: number;
  calculation_details?: {
    courses: GPACalculationDetails[];
  };
}

// ============================================================================
// UTILITY TYPES FOR GRADE CALCULATIONS
// ============================================================================

export interface GradeCalculationInput {
  assignment_grades: AssignmentGrade[];
  grade_categories: GradeCategory[];
  grading_config: CourseGradingConfig;
  grading_scale: GradingScale;
  grade_ranges: GradeRange[];
}

export interface GradeCalculationResult {
  current_percentage: number;
  letter_grade: string;
  gpa_value: number;
  is_passing: boolean;
  category_breakdown: CategoryGradeBreakdown[];
}

export interface GradebookEntry {
  user_id: string;
  user_name: string;
  user_email: string;
  assignment_grades: {
    assignment_id: string;
    assignment_title: string;
    category_name: string;
    points_earned: number | null;
    points_possible: number;
    percentage: number;
    letter_grade: string | null;
    is_excused: boolean;
    is_late: boolean;
    submitted_at: string | null;
  }[];
  course_grade: {
    current_percentage: number | null;
    letter_grade: string | null;
    gpa_value: number | null;
    is_passing: boolean | null;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface GradingApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GradebookResponse {
  course_id: string;
  course_title: string;
  grading_config: CourseGradingConfig;
  grade_categories: GradeCategory[];
  gradebook: GradebookEntry[];
  statistics: {
    total_students: number;
    average_percentage: number;
    median_percentage: number;
    passing_rate: number;
    grade_distribution: {
      [letter_grade: string]: number;
    };
  };
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface GradeFilter {
  course_id?: string;
  user_id?: string;
  assignment_id?: string;
  category_id?: string;
  is_passing?: boolean;
  is_final?: boolean;
  graded_date_from?: string;
  graded_date_to?: string;
}

// ============================================================================
// EXPORT AGGREGATED TYPES
// ============================================================================

export type GradingEntity =
  | GradingScale
  | GradeRange
  | GradeCategory
  | CourseGradingConfig
  | AssignmentGrade
  | CourseGrade
  | GradeHistory
  | StudentGPA;

export type GradingCreateInput =
  | GradingScaleCreateInput
  | GradeRangeCreateInput
  | GradeCategoryCreateInput
  | CourseGradingConfigCreateInput
  | AssignmentGradeCreateInput
  | CourseGradeCreateInput
  | GradeHistoryCreateInput
  | StudentGPACreateInput;

export type GradingUpdateInput =
  | GradingScaleUpdateInput
  | GradeRangeUpdateInput
  | GradeCategoryUpdateInput
  | CourseGradingConfigUpdateInput
  | AssignmentGradeUpdateInput
  | CourseGradeUpdateInput
  | StudentGPAUpdateInput;
