import { z } from "zod";

export const registerSchema = z.object({
  salonName: z.string().min(2, "Salon name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  staffCount: z.number().min(1, "Staff count must be at least 1"),
  location: z.string().min(2, "Location is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const stylistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  level: z.enum(["L1", "L2", "L3", "L4"]),
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
  address: z.string().min(5, "Address is required"),
  photoUrl: z.string().url("Photo is required"),
  status: z.enum(["Active", "Relieved", "Abscond"]),
  remark: z.string().optional(),
});

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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type StylistInput = z.infer<typeof stylistSchema>;
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
