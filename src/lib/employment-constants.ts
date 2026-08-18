import { z } from "zod";

export const STYLIST_ROLES = [
  "Junior Stylist",
  "Stylist",
  "Senior Stylist",
] as const;

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
] as const;

export const SPECIALIST_SERVICES = [
  "Hair Cutting",
  "Hair Coloring",
  "Bridal Styling",
  "Hair Treatment",
] as const;

export type StylistRole = (typeof STYLIST_ROLES)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type SpecialistService = (typeof SPECIALIST_SERVICES)[number] | string;

export const DEFAULT_STYLIST_ROLE: StylistRole = "Stylist";
export const DEFAULT_EMPLOYMENT_TYPE: EmploymentType = "Full-time";

export const stylistRoleSchema = z.enum(STYLIST_ROLES, {
  message: "Select a valid role / position",
});

export const employmentTypeSchema = z.enum(EMPLOYMENT_TYPES, {
  message: "Select a valid employment type",
});

export const specialistServicesSchema = z
  .array(z.string().trim().min(1, "Service name cannot be empty").max(80))
  .max(20, "Maximum 20 specialist services allowed")
  .optional();

export const performanceSummarySchema = z
  .string()
  .max(1000, "Performance summary must be under 1000 characters")
  .optional();

export const managerFeedbackSchema = z
  .string()
  .max(1000, "Manager feedback must be under 1000 characters")
  .optional();

export const performanceRatingSchema = z
  .number()
  .int("Rating must be a whole number")
  .min(1, "Rating must be at least 1 star")
  .max(5, "Rating must be at most 5 stars")
  .optional()
  .nullable();
