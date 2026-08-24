import { z } from "zod";
import {
  salonTypeSchema,
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

export const indianMobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export const authSessionSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export const salonRegisterSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
  role: z.literal("salon"),
  salonName: z.string().min(2, "Salon name must be at least 2 characters"),
  salonAddress: z.string().min(2, "Salon address is required"),
  ownerName: z.string().optional(),
  email: z
    .union([z.string().email("Invalid email address"), z.literal("")])
    .optional(),
  staffCount: z.coerce.number().int().min(1).optional(),
  salonType: salonTypeSchema.optional(),
  logoUrl: z
    .union([z.string().url("Invalid logo URL"), z.literal("")])
    .optional(),
});

export const stylistRegisterSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
  role: z.literal("stylist"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
  address: z.string().optional(),
  photoUrl: z
    .union([z.string().url("Invalid photo URL"), z.literal("")])
    .optional(),
});

export const otpRegisterSchema = z.discriminatedUnion("role", [
  salonRegisterSchema,
  stylistRegisterSchema,
]);

export const profileUpdateSchema = z.object({
  salonName: z.string().min(2, "Salon name must be at least 2 characters"),
  ownerName: z.string().optional(),
  email: z
    .union([z.string().email("Invalid email address"), z.literal("")])
    .optional(),
  staffCount: z.coerce.number().int().min(1).optional(),
  salonAddress: z.string().min(2, "Salon address is required"),
  salonType: salonTypeSchema,
  logoUrl: z
    .union([z.string().url("Invalid logo URL"), z.literal("")])
    .optional(),
  googleMapsLocation: optionalHttpUrlSchema,
  websiteUrl: optionalHttpUrlSchema,
  instagramUrl: optionalInstagramUrlSchema,
  facebookUrl: optionalFacebookUrlSchema,
  whatsappNumber: optionalWhatsappNumberSchema,
  youtubeUrl: optionalYoutubeUrlSchema,
  establishmentYear: optionalEstablishmentYearSchema,
});

export const stylistSelfUpdateSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    address: z.string().optional(),
    photoUrl: z
      .union([z.string().url("Invalid photo URL"), z.literal("")])
      .optional(),
    openToWork: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.openToWork === undefined &&
      data.name === undefined &&
      data.address === undefined &&
      data.photoUrl === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nothing to update",
        path: ["name"],
      });
    }
  });

export const createJobSchema = z.object({
  role: stylistRoleSchema,
  employmentType: employmentTypeSchema,
  level: z.enum(["L1", "L2", "L3", "L4"]).optional(),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be under 1000 characters"),
});

export const updateJobSchema = z.object({
  status: z.enum(["open", "closed"]),
});

export const updateApplicationSchema = z.object({
  status: z.enum(["Interested", "Rejected", "Hired"]),
});

export const sendInterestSchema = z.object({
  jobId: z.string().min(1, "Select a job position"),
});

export type SendInterestInput = z.infer<typeof sendInterestSchema>;

const stylistBaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobileNumber: indianMobileSchema,
  level: z.enum(["L1", "L2", "L3", "L4"]).optional(),
  role: stylistRoleSchema.optional(),
  employmentType: employmentTypeSchema.optional(),
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
  address: z.string(),
  photoUrl: z.union([z.string().url("Invalid photo URL"), z.literal("")]),
  status: z.enum(["Active", "Relieved", "Abscond"]).optional(),
  remark: z.string().optional(),
  workingFromMonth: z.coerce.number().int().min(1).max(12).optional(),
  workingFromYear: z.coerce.number().int().min(1980).max(2100).optional(),
});

function requireEmploymentSelects(
  data: z.infer<typeof stylistBaseSchema>,
  ctx: z.RefinementCtx
) {
  if (!data.level) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select a stylist level",
      path: ["level"],
    });
  }
  if (!data.role) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select a role / position",
      path: ["role"],
    });
  }
  if (!data.employmentType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select an employment type",
      path: ["employmentType"],
    });
  }
  if (!data.status) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select a status",
      path: ["status"],
    });
  }
}

export const stylistSchema = stylistBaseSchema.superRefine((data, ctx) => {
  requireEmploymentSelects(data, ctx);
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

function requireWorkingFrom(
  data: z.infer<typeof stylistBaseSchema>,
  ctx: z.RefinementCtx
) {
  if (data.workingFromMonth == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select the month they started working here",
      path: ["workingFromMonth"],
    });
  }
  if (data.workingFromYear == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select the year they started working here",
      path: ["workingFromYear"],
    });
  }
  if (data.workingFromMonth != null && data.workingFromYear != null) {
    const start = new Date(data.workingFromYear, data.workingFromMonth - 1, 1);
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    if (start.getTime() > currentMonthStart.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Working here from cannot be in the future",
        path: ["workingFromMonth"],
      });
    }
  }
}

export const stylistCreateSchema = stylistBaseSchema.superRefine((data, ctx) => {
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
  requireWorkingFrom(data, ctx);
});

/** Remark required only when status changes to Relieved or Abscond. */
export function createStylistProfileUpdateSchema(currentStatus: string) {
  return stylistBaseSchema.superRefine((data, ctx) => {
    requireEmploymentSelects(data, ctx);
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

/** Client verify form: validates the active search method only. */
export const verifyFormSchema = z
  .object({
    searchType: z.enum(["aadhaar", "mobile"]),
    aadhaarNumber: z.string().optional(),
    mobileNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.searchType === "aadhaar") {
      if (!/^\d{12}$/.test(data.aadhaarNumber?.trim() ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid 12-digit Aadhaar number",
          path: ["aadhaarNumber"],
        });
      }
    } else {
      const parsed = indianMobileSchema.safeParse(
        data.mobileNumber?.trim() ?? ""
      );
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid 10-digit mobile number",
          path: ["mobileNumber"],
        });
      }
    }
  });

export type AuthSessionInput = z.infer<typeof authSessionSchema>;
export type OtpRegisterInput = z.infer<typeof otpRegisterSchema>;
export type SalonRegisterInput = z.infer<typeof salonRegisterSchema>;
export type StylistRegisterInput = z.infer<typeof stylistRegisterSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type StylistSelfUpdateInput = z.infer<typeof stylistSelfUpdateSchema>;
export type StylistInput = z.infer<typeof stylistSchema>;
export type StylistCreateInput = z.infer<typeof stylistCreateSchema>;
export type PerformanceUpdateInput = z.infer<typeof performanceUpdateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
export type VerifyFormInput = z.infer<typeof verifyFormSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
