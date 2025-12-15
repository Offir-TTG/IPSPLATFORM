// ============================================================================
// GRADE CALCULATION ENGINE
// ============================================================================
// Core logic for calculating grades based on assignments, categories, and scales
// Supports weighted averages, total points, and custom calculation methods
// ============================================================================

import type {
  AssignmentGrade,
  GradeCategory,
  CourseGradingConfig,
  GradeRange,
  GradingScale,
  CategoryGradeBreakdown,
  GradeCalculationResult,
} from '@/types/grading';

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate a student's course grade based on their assignment grades
 */
export function calculateCourseGrade(
  assignmentGrades: AssignmentGrade[],
  categories: GradeCategory[],
  config: CourseGradingConfig,
  gradeRanges: GradeRange[]
): GradeCalculationResult {
  // Filter out excused assignments
  const gradedAssignments = assignmentGrades.filter((g) => !g.is_excused && g.points_earned !== null);

  if (gradedAssignments.length === 0) {
    return {
      current_percentage: 0,
      letter_grade: 'N/A',
      gpa_value: 0,
      is_passing: false,
      category_breakdown: [],
    };
  }

  let finalPercentage: number;
  let categoryBreakdown: CategoryGradeBreakdown[];

  // Calculate based on method
  if (config.grade_calculation_method === 'weighted_average' && config.use_weighted_categories) {
    const result = calculateWeightedAverage(gradedAssignments, categories);
    finalPercentage = result.percentage;
    categoryBreakdown = result.breakdown;
  } else if (config.grade_calculation_method === 'total_points') {
    const result = calculateTotalPoints(gradedAssignments);
    finalPercentage = result.percentage;
    categoryBreakdown = result.breakdown;
  } else {
    // Default to weighted average
    const result = calculateWeightedAverage(gradedAssignments, categories);
    finalPercentage = result.percentage;
    categoryBreakdown = result.breakdown;
  }

  // Round if configured
  if (config.round_final_grades) {
    finalPercentage = Math.round(finalPercentage * 100) / 100;
  }

  // Get letter grade from ranges
  const letterGrade = getLetterGrade(finalPercentage, gradeRanges);
  const gradeRange = gradeRanges.find(
    (r) => finalPercentage >= r.min_percentage && finalPercentage <= r.max_percentage
  );
  const gpaValue = gradeRange?.gpa_value ?? 0;
  const isPassing = finalPercentage >= config.passing_percentage && (gradeRange?.is_passing ?? false);

  return {
    current_percentage: finalPercentage,
    letter_grade: letterGrade,
    gpa_value: gpaValue,
    is_passing: isPassing,
    category_breakdown: categoryBreakdown,
  };
}

// ============================================================================
// WEIGHTED AVERAGE CALCULATION
// ============================================================================

/**
 * Calculate grade using weighted categories
 * Each category contributes a percentage to the final grade
 */
function calculateWeightedAverage(
  assignmentGrades: AssignmentGrade[],
  categories: GradeCategory[]
): { percentage: number; breakdown: CategoryGradeBreakdown[] } {
  const breakdown: CategoryGradeBreakdown[] = [];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const category of categories.filter((c) => c.is_active)) {
    // Get all grades for this category
    const categoryGrades = assignmentGrades.filter((g) => g.grade_category_id === category.id);

    if (categoryGrades.length === 0) {
      continue; // Skip empty categories
    }

    // Apply drop lowest if configured
    const gradesToUse = applyDropLowest(categoryGrades, category.drop_lowest);

    // Calculate category average
    const categoryPercentage = calculateCategoryAverage(gradesToUse);

    // Add to weighted sum
    const weight = category.weight_percentage / 100;
    weightedSum += categoryPercentage * weight;
    totalWeight += weight;

    // Track breakdown
    const pointsEarned = gradesToUse.reduce((sum, g) => sum + (g.points_earned ?? 0), 0);
    const pointsPossible = gradesToUse.reduce((sum, g) => sum + g.points_possible, 0);

    breakdown.push({
      category_id: category.id,
      category_name: category.name,
      percentage: categoryPercentage,
      weight: category.weight_percentage,
      points_earned: pointsEarned,
      points_possible: pointsPossible,
    });
  }

  // Normalize if weights don't add up to 100%
  const finalPercentage = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

  return {
    percentage: finalPercentage,
    breakdown,
  };
}

// ============================================================================
// TOTAL POINTS CALCULATION
// ============================================================================

/**
 * Calculate grade using total points method
 * Sum all points earned divided by sum of all points possible
 */
function calculateTotalPoints(
  assignmentGrades: AssignmentGrade[]
): { percentage: number; breakdown: CategoryGradeBreakdown[] } {
  const totalEarned = assignmentGrades.reduce((sum, g) => sum + (g.points_earned ?? 0), 0);
  const totalPossible = assignmentGrades.reduce((sum, g) => sum + g.points_possible, 0);

  const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

  // Create a single breakdown entry for total points
  const breakdown: CategoryGradeBreakdown[] = [
    {
      category_id: 'total',
      category_name: 'Total Points',
      percentage,
      weight: 100,
      points_earned: totalEarned,
      points_possible: totalPossible,
    },
  ];

  return {
    percentage,
    breakdown,
  };
}

// ============================================================================
// CATEGORY AVERAGE CALCULATION
// ============================================================================

/**
 * Calculate the average percentage for a category
 */
function calculateCategoryAverage(grades: AssignmentGrade[]): number {
  if (grades.length === 0) return 0;

  // Calculate as average of percentages
  const sum = grades.reduce((total, grade) => total + grade.percentage, 0);
  return sum / grades.length;
}

// ============================================================================
// DROP LOWEST SCORES
// ============================================================================

/**
 * Drop the N lowest scores from a set of grades
 */
function applyDropLowest(grades: AssignmentGrade[], dropCount: number): AssignmentGrade[] {
  if (dropCount <= 0 || grades.length <= dropCount) {
    return grades;
  }

  // Sort by percentage ascending
  const sorted = [...grades].sort((a, b) => a.percentage - b.percentage);

  // Return all except the N lowest
  return sorted.slice(dropCount);
}

// ============================================================================
// LETTER GRADE LOOKUP
// ============================================================================

/**
 * Get letter grade from percentage based on grade ranges
 */
export function getLetterGrade(percentage: number, gradeRanges: GradeRange[]): string {
  // Sort ranges by min_percentage descending to find the highest matching range
  const sortedRanges = [...gradeRanges].sort((a, b) => b.min_percentage - a.min_percentage);

  for (const range of sortedRanges) {
    if (percentage >= range.min_percentage && percentage <= range.max_percentage) {
      return range.grade_label;
    }
  }

  // Fallback - if no range matches, return F or lowest grade
  const lowestRange = gradeRanges.reduce((lowest, range) =>
    range.min_percentage < lowest.min_percentage ? range : lowest
  );
  return lowestRange?.grade_label ?? 'F';
}

// ============================================================================
// GPA CALCULATION
// ============================================================================

/**
 * Calculate cumulative GPA from course grades
 * @param courseGrades Array of course grades with GPA values and credits
 * @param credits Array of credit hours for each course (same length as courseGrades)
 */
export function calculateGPA(
  courseGrades: { gpa_value: number; credits: number }[]
): {
  cumulative_gpa: number;
  total_credits: number;
} {
  let totalPoints = 0;
  let totalCredits = 0;

  for (const course of courseGrades) {
    totalPoints += course.gpa_value * course.credits;
    totalCredits += course.credits;
  }

  const cumulativeGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

  return {
    cumulative_gpa: Math.round(cumulativeGPA * 100) / 100, // Round to 2 decimals
    total_credits: totalCredits,
  };
}

// ============================================================================
// GRADE STATISTICS
// ============================================================================

/**
 * Calculate grade statistics for a course
 */
export interface GradeStatistics {
  total_students: number;
  average_percentage: number;
  median_percentage: number;
  highest_percentage: number;
  lowest_percentage: number;
  passing_rate: number;
  grade_distribution: Record<string, number>;
}

export function calculateGradeStatistics(
  courseGrades: { current_percentage: number | null; letter_grade: string | null; is_passing: boolean | null }[]
): GradeStatistics {
  const validGrades = courseGrades.filter((g) => g.current_percentage !== null) as {
    current_percentage: number;
    letter_grade: string | null;
    is_passing: boolean | null;
  }[];

  if (validGrades.length === 0) {
    return {
      total_students: 0,
      average_percentage: 0,
      median_percentage: 0,
      highest_percentage: 0,
      lowest_percentage: 0,
      passing_rate: 0,
      grade_distribution: {},
    };
  }

  // Calculate average
  const sum = validGrades.reduce((total, g) => total + g.current_percentage, 0);
  const average = sum / validGrades.length;

  // Calculate median
  const sorted = [...validGrades].sort((a, b) => a.current_percentage - b.current_percentage);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1].current_percentage + sorted[mid].current_percentage) / 2 : sorted[mid].current_percentage;

  // Get highest and lowest
  const highest = sorted[sorted.length - 1].current_percentage;
  const lowest = sorted[0].current_percentage;

  // Calculate passing rate
  const passingCount = validGrades.filter((g) => g.is_passing === true).length;
  const passingRate = (passingCount / validGrades.length) * 100;

  // Grade distribution
  const distribution: Record<string, number> = {};
  for (const grade of validGrades) {
    if (grade.letter_grade) {
      distribution[grade.letter_grade] = (distribution[grade.letter_grade] || 0) + 1;
    }
  }

  return {
    total_students: validGrades.length,
    average_percentage: Math.round(average * 100) / 100,
    median_percentage: Math.round(median * 100) / 100,
    highest_percentage: Math.round(highest * 100) / 100,
    lowest_percentage: Math.round(lowest * 100) / 100,
    passing_rate: Math.round(passingRate * 100) / 100,
    grade_distribution: distribution,
  };
}

// ============================================================================
// GRADE VALIDATION
// ============================================================================

/**
 * Validate that category weights add up to 100%
 */
export function validateCategoryWeights(categories: GradeCategory[]): {
  isValid: boolean;
  totalWeight: number;
  error?: string;
} {
  const activeCategories = categories.filter((c) => c.is_active);
  const totalWeight = activeCategories.reduce((sum, c) => sum + c.weight_percentage, 0);

  if (Math.abs(totalWeight - 100) > 0.01) {
    // Allow 0.01% tolerance for floating point
    return {
      isValid: false,
      totalWeight,
      error: `Category weights must add up to 100%. Current total: ${totalWeight}%`,
    };
  }

  return {
    isValid: true,
    totalWeight,
  };
}

/**
 * Validate grade ranges don't overlap and cover 0-100%
 */
export function validateGradeRanges(ranges: GradeRange[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const sorted = [...ranges].sort((a, b) => a.min_percentage - b.min_percentage);

  // Check for gaps and overlaps
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.max_percentage >= next.min_percentage) {
      errors.push(`Overlap between ${current.grade_label} and ${next.grade_label}`);
    }

    if (current.max_percentage + 0.01 < next.min_percentage) {
      errors.push(`Gap between ${current.grade_label} (${current.max_percentage}%) and ${next.grade_label} (${next.min_percentage}%)`);
    }
  }

  // Check coverage of 0-100%
  if (sorted.length > 0) {
    if (sorted[0].min_percentage > 0) {
      errors.push(`Grade ranges don't cover 0%. Lowest range starts at ${sorted[0].min_percentage}%`);
    }
    if (sorted[sorted.length - 1].max_percentage < 100) {
      errors.push(`Grade ranges don't cover 100%. Highest range ends at ${sorted[sorted.length - 1].max_percentage}%`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate what grade a student needs on remaining assignments to achieve a target grade
 */
export function calculateRequiredGrade(
  currentPercentage: number,
  currentWeight: number, // Weight of completed assignments (0-100)
  targetPercentage: number
): number | null {
  const remainingWeight = 100 - currentWeight;

  if (remainingWeight <= 0) {
    return null; // No remaining assignments
  }

  const requiredPoints = targetPercentage * 100 - currentPercentage * currentWeight;
  const requiredPercentage = requiredPoints / remainingWeight;

  if (requiredPercentage > 100) {
    return null; // Impossible to achieve
  }

  return Math.max(0, requiredPercentage);
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number, decimals: number = 2): string {
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format GPA for display
 */
export function formatGPA(gpa: number, decimals: number = 2): string {
  return gpa.toFixed(decimals);
}
