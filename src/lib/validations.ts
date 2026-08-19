import { z } from "zod";
import {
  salonTypeSchema,
  optionalSalonAddressSchema,
  optionalHttpUrlSchema,
  optionalEstablishmentYearSchema,
  optionalInstagramUrlSchema,
  optionalFacebookUrlSchema,
  optionalWhatsappNumberSchema,
  optionalYoutubeUrlSchema,
} from "@/lib/salon-constants";
import {
  employmentTypeSchema,
  managerFeedbackSchema,
  performanceRatingSchema,
  performanceSummarySchema,
  specialistServicesSchema,
  stylistRoleSchema,
} from "@/lib/employment-constants";

export const registerAuthSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const completeProfileSchema = z.object({
  salonName: z.string().min(2, "Salon name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  staffCount: z.number().min(1, "Staff count must be at least 1"),
  location: z.string().min(2, "Location is required"),
  salonNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  salonType: salonTypeSchema,
  logoUrl: z.union([z.string().url("Invalid logo URL"), z.literal("")]).optional(),
});

export const registerSchema = registerAuthSchema.merge(completeProfileSchema);

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  salonName: z.string().min(2, "Salon name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  staffCount: z.number().min(1, "Staff count must be at least 1"),
  salonNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  salonType: salonTypeSchema,
  logoUrl: z.union([z.string().url("Invalid logo URL"), z.literal("")]).optional(),
  salonAddress: optionalSalonAddressSchema,
  googleMapsLocation: optionalHttpUrlSchema,
  websiteUrl: optionalHttpUrlSchema,
  instagramUrl: optionalInstagramUrlSchema,
  facebookUrl: optionalFacebookUrlSchema,
  whatsappNumber: optionalWhatsappNumberSchema,
  youtubeUrl: optionalYoutubeUrlSchema,
  establishmentYear: optionalEstablishmentYearSchema,
});

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export const completeGoogleProfileSchema = completeProfileSchema.extend({
  idToken: z.string().min(1, "ID token is required"),
});

export const linkGoogleSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export const verifyPhoneSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
  salonNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

const stylistBaseSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    mobileNumber: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    level: z.enum(["L1", "L2", "L3", "L4"]),
    role: stylistRoleSchema,
    employmentType: employmentTypeSchema,
    aadhaarNumber: z
      .string()
      .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
    address: z.string(),
    photoUrl: z.union([z.string().url("Invalid photo URL"), z.literal("")]),
    status: z.enum(["Active", "Relieved", "Abscond"]),
    remark: z.string().optional(),
  });

export const stylistSchema = stylistBaseSchema.superRefine((data, ctx) => {
  if (
    (data.status === "Relieved" || data.status === "Abscond") &&
    (!data.remark || data.remark.trim().length < 5)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Remark is required (minimum 5 characters)",
      path: ["remark"],
    });
  }
});

/** Remark required only when status changes to Relieved or Abscond. */
export function createStylistProfileUpdateSchema(currentStatus: string) {
  return stylistBaseSchema.superRefine((data, ctx) => {
    if (data.status === currentStatus) return;
    if (
      (data.status === "Relieved" || data.status === "Abscond") &&
      (!data.remark || data.remark.trim().length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Remark is required (minimum 5 characters)",
        path: ["remark"],
      });
    }
  });
}

export const performanceUpdateSchema = z.object({
  overallExperienceRating: performanceRatingSchema,
  technicalSkillRating: performanceRatingSchema,
  customerHandlingRating: performanceRatingSchema,
  performanceSummary: performanceSummarySchema,
  managerFeedback: managerFeedbackSchema,
  specialistServices: specialistServicesSchema,
});

const optionalDocumentUrl = z.union([
  z.string().url("Invalid document URL"),
  z.literal(""),
]);

export const documentUpdateSchema = z
  .object({
    experienceCertificateUrl: optionalDocumentUrl.optional(),
    relievingLetterUrl: optionalDocumentUrl.optional(),
  })
  .refine(
    (data) =>
      data.experienceCertificateUrl !== undefined ||
      data.relievingLetterUrl !== undefined,
    { message: "Provide at least one document to update" }
  );

export const statusUpdateSchema = z
  .object({
    status: z.enum(["Active", "Relieved", "Abscond"]),
    remark: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.status === "Relieved" || data.status === "Abscond") &&
      (!data.remark || data.remark.trim().length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Remark is required (minimum 5 characters)",
        path: ["remark"],
      });
    }
  });

export const verifySchema = z
  .object({
    aadhaarNumber: z.string().optional(),
    mobileNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasAadhaar = data.aadhaarNumber && /^\d{12}$/.test(data.aadhaarNumber);
    const hasMobile =
      data.mobileNumber && /^[6-9]\d{9}$/.test(data.mobileNumber);

    if (!hasAadhaar && !hasMobile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid Aadhaar number or mobile number",
        path: ["aadhaarNumber"],
      });
    }
  });

export type RegisterAuthInput = z.infer<typeof registerAuthSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type CompleteGoogleProfileInput = z.infer<typeof completeGoogleProfileSchema>;
export type LinkGoogleInput = z.infer<typeof linkGoogleSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
export type StylistInput = z.infer<typeof stylistSchema>;
export type PerformanceUpdateInput = z.infer<typeof performanceUpdateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
