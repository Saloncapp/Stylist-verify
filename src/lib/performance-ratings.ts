export type PerformanceRatingValue = 1 | 2 | 3 | 4 | 5;

export interface PerformanceRatingFields {
  overallExperienceRating?: number;
  technicalSkillRating?: number;
  customerHandlingRating?: number;
  overallPerformanceRating?: number;
}

export const PERFORMANCE_RATING_CATEGORIES = [
  {
    key: "overallExperienceRating" as const,
    label: "Professionalism",
  },
  {
    key: "technicalSkillRating" as const,
    label: "Technical Skill",
  },
  {
    key: "customerHandlingRating" as const,
    label: "Customer Handling",
  },
];

export function isValidPerformanceRating(
  value: unknown
): value is PerformanceRatingValue {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function calculateOverallPerformanceRating(
  input: PerformanceRatingFields
): number | undefined {
  const ratings = [
    input.overallExperienceRating,
    input.technicalSkillRating,
    input.customerHandlingRating,
  ].filter(isValidPerformanceRating);

  if (ratings.length === 0) return undefined;

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return Math.round(average * 10) / 10;
}

export function formatOverallPerformanceRating(
  rating?: number
): string | undefined {
  if (rating == null || Number.isNaN(rating)) return undefined;
  return `${rating.toFixed(1)} / 5`;
}

export function hasPerformanceRatings(input: PerformanceRatingFields): boolean {
  return Boolean(
    isValidPerformanceRating(input.overallExperienceRating) ||
      isValidPerformanceRating(input.technicalSkillRating) ||
      isValidPerformanceRating(input.customerHandlingRating) ||
      (input.overallPerformanceRating != null &&
        input.overallPerformanceRating > 0)
  );
}

export function hasPerformanceInfo(input: {
  performanceSummary?: string;
  managerFeedback?: string;
  specialistServices?: string[];
  overallExperienceRating?: number;
  technicalSkillRating?: number;
  customerHandlingRating?: number;
  overallPerformanceRating?: number;
}): boolean {
  return Boolean(
    (input.performanceSummary && input.performanceSummary.trim()) ||
      (input.managerFeedback && input.managerFeedback.trim()) ||
      (input.specialistServices && input.specialistServices.length > 0) ||
      hasPerformanceRatings(input)
  );
}

export function getEmploymentPerformanceRating(
  input: PerformanceRatingFields
): number | undefined {
  return (
    input.overallPerformanceRating ?? calculateOverallPerformanceRating(input)
  );
}

export function calculateCareerPerformanceRating(
  entries: PerformanceRatingFields[]
): number | undefined {
  const ratings = entries
    .map(getEmploymentPerformanceRating)
    .filter((rating): rating is number => rating != null && !Number.isNaN(rating));

  if (ratings.length === 0) return undefined;

  const average =
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return Math.round(average * 10) / 10;
}
