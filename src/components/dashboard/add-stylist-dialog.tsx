"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  UserCheck,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  EMPLOYMENT_TYPES,
  STYLIST_ROLES,
  type EmploymentType,
  type StylistRole,
} from "@/lib/employment-constants";
import { handleDigitInput } from "@/lib/digit-input";
import { indianMobileSchema, stylistCreateSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { StylistAvatar } from "@/components/stylist-avatar";
import { toast } from "sonner";
import type { HiringApplicationCard } from "@/types";

const ImageCropDialog = dynamic(
  () =>
    import("@/components/dashboard/image-crop-dialog").then(
      (mod) => mod.ImageCropDialog
    ),
  { ssr: false }
);

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1979 }, (_, i) => CURRENT_YEAR - i);

type LookupType = "aadhaar" | "mobile";
type FlowStep = "lookup" | "existing" | "create1" | "create2";
type AdditionalSource = "create1" | "existing" | null;

type LookedUpStylist = {
  id: string;
  employeeId: string;
  name: string;
  mobileNumber: string;
  aadhaarNumber: string;
  aadhaarMasked: string;
  address: string;
  photoUrl: string;
  level?: string;
  role?: string;
  employmentType?: string;
  status?: string;
};

const lookupSchema = z
  .object({
    lookupType: z.enum(["aadhaar", "mobile"]),
    aadhaarNumber: z.string().optional(),
    mobileNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.lookupType === "aadhaar") {
      if (!/^\d{12}$/.test(data.aadhaarNumber?.trim() ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid 12-digit Aadhaar number",
          path: ["aadhaarNumber"],
        });
      }
    } else {
      const parsed = indianMobileSchema.safeParse(data.mobileNumber?.trim() ?? "");
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid 10-digit mobile number",
          path: ["mobileNumber"],
        });
      }
    }
  });

const createStep1Schema = z.object({
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
  mobileNumber: indianMobileSchema,
  name: z.string().min(2, "Name must be at least 2 characters"),
  workingFromMonth: z.number().int().min(1).max(12),
  workingFromYear: z.number().int().min(1980).max(2100),
});

type CreateStep1Values = z.infer<typeof createStep1Schema>;

type CreateDraft = CreateStep1Values & {
  address: string;
  photoUrl: string;
  level?: "L1" | "L2" | "L3" | "L4";
  role?: StylistRole;
  employmentType?: EmploymentType;
  status?: "Active" | "Relieved" | "Abscond";
  remark: string;
};

function emptyDraft(seed?: Partial<CreateDraft>): CreateDraft {
  const now = new Date();
  return {
    aadhaarNumber: "",
    mobileNumber: "",
    name: "",
    workingFromMonth: now.getMonth() + 1,
    workingFromYear: now.getFullYear(),
    address: "",
    photoUrl: "",
    remark: "",
    ...seed,
  };
}

function ProgressDots({
  step,
  mode,
}: {
  step: FlowStep;
  mode: "lookup" | "existing" | "create";
}) {
  const items =
    mode === "create"
      ? step === "create2"
        ? [
            { key: "lookup", label: "Search" },
            { key: "create1", label: "Required" },
            { key: "create2", label: "Additional" },
          ]
        : [
            { key: "lookup", label: "Search" },
            { key: "create1", label: "Required" },
          ]
      : mode === "existing"
        ? [
            { key: "lookup", label: "Search" },
            { key: "existing", label: "Profile" },
          ]
        : [{ key: "lookup", label: "Search" }];

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === step)
  );

  return (
    <div className="flex items-center justify-center gap-2 pt-1">
      {items.map((item, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        return (
          <div key={item.key} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[0.65rem] font-semibold",
                done && "bg-primary text-primary-foreground",
                active && "bg-primary/15 text-primary ring-1 ring-primary/40",
                !done && !active && "bg-muted text-muted-foreground"
              )}
              title={item.label}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs sm:inline",
                active ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>
            {index < items.length - 1 && (
              <div className="hidden h-px w-6 bg-border sm:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function UnderlineEditable({
  label,
  value,
  editing,
  onEdit,
  onChange,
  onDone,
  type = "text",
  inputMode,
  maxLength,
  multiline,
  disabled,
}: {
  label: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onChange: (value: string) => void;
  onDone: () => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  multiline?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {!disabled && (
          <button
            type="button"
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onEdit}
            aria-label={`Edit ${label}`}
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            rows={2}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onDone}
            className="w-full resize-none border-0 border-b border-primary bg-transparent px-0 py-1 text-sm outline-none focus:ring-0"
          />
        ) : (
          <input
            autoFocus
            type={type}
            inputMode={inputMode}
            maxLength={maxLength}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onDone}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onDone();
              }
            }}
            className="w-full border-0 border-b border-primary bg-transparent px-0 py-1 text-sm outline-none focus:ring-0"
          />
        )
      ) : (
        <p className="min-h-7 border-b border-transparent py-1 text-sm font-medium">
          {value.trim() || (
            <span className="font-normal text-muted-foreground">Not set</span>
          )}
        </p>
      )}
    </div>
  );
}

interface AddStylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hireApplication?: HiringApplicationCard | null;
  onHireComplete?: ((application: HiringApplicationCard) => void) | null;
}

export function AddStylistDialog({
  open,
  onOpenChange,
  hireApplication = null,
  onHireComplete = null,
}: AddStylistDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<FlowStep>("lookup");
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [existing, setExisting] = useState<LookedUpStylist | null>(null);
  const [alreadyAtSalon, setAlreadyAtSalon] = useState(false);
  const [draft, setDraft] = useState<CreateDraft>(() => emptyDraft());
  const [editField, setEditField] = useState<string | null>(null);
  const [existingWorkingMonth, setExistingWorkingMonth] = useState(
    () => new Date().getMonth() + 1
  );
  const [existingWorkingYear, setExistingWorkingYear] = useState(
    () => new Date().getFullYear()
  );
  const [additionalSource, setAdditionalSource] =
    useState<AdditionalSource>(null);

  const lookupForm = useForm<z.infer<typeof lookupSchema>>({
    resolver: zodResolver(lookupSchema),
    defaultValues: {
      lookupType: "aadhaar",
      aadhaarNumber: "",
      mobileNumber: "",
    },
  });

  const step1Form = useForm<CreateStep1Values>({
    resolver: zodResolver(createStep1Schema) as Resolver<CreateStep1Values>,
    defaultValues: {
      aadhaarNumber: "",
      mobileNumber: "",
      name: "",
      workingFromMonth: new Date().getMonth() + 1,
      workingFromYear: new Date().getFullYear(),
    },
  });

  const lookupType = lookupForm.watch("lookupType");

  function resetAll() {
    setStep("lookup");
    setExisting(null);
    setAlreadyAtSalon(false);
    setDraft(emptyDraft());
    setEditField(null);
    setLookingUp(false);
    setSubmitting(false);
    setAdditionalSource(null);
    lookupForm.reset({
      lookupType: "aadhaar",
      aadhaarNumber: "",
      mobileNumber: "",
    });
    step1Form.reset({
      aadhaarNumber: "",
      mobileNumber: "",
      name: "",
      workingFromMonth: new Date().getMonth() + 1,
      workingFromYear: new Date().getFullYear(),
    });
  }

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(resetAll, 200);
      return () => window.clearTimeout(timer);
    }

    if (!hireApplication) return;

    let cancelled = false;

    void (async () => {
      setLookingUp(true);
      setExisting(null);
      setAlreadyAtSalon(false);
      setStep("existing");
      try {
        const res = await fetch(
          `/api/applications/${hireApplication.id}/hire-profile`
        );
        const result = await res.json();
        if (cancelled) return;

        if (!result.success || !result.data?.stylist) {
          toast.error(result.message || "Failed to load applicant profile");
          onOpenChange(false);
          return;
        }

        const stylist = result.data.stylist as LookedUpStylist;
        if (stylist.id !== hireApplication.stylistId) {
          toast.error("Applicant profile mismatch");
          onOpenChange(false);
          return;
        }

        setExisting({
          ...stylist,
          role:
            (hireApplication.jobRole as StylistRole | undefined) ||
            (stylist.role as StylistRole | undefined),
          employmentType:
            (hireApplication.jobEmploymentType as EmploymentType | undefined) ||
            (stylist.employmentType as EmploymentType | undefined),
        });
        setAlreadyAtSalon(Boolean(result.data.alreadyAtSalon));
        setExistingWorkingMonth(new Date().getMonth() + 1);
        setExistingWorkingYear(new Date().getFullYear());
      } catch {
        if (!cancelled) {
          toast.error("Something went wrong");
          onOpenChange(false);
        }
      } finally {
        if (!cancelled) setLookingUp(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, hireApplication, onOpenChange]);

  const progressMode = useMemo(() => {
    if (step === "existing") return "existing" as const;
    if (step === "create1" || step === "create2") return "create" as const;
    return "lookup" as const;
  }, [step]);

  async function runLookup(values: z.infer<typeof lookupSchema>) {
    setLookingUp(true);
    setExisting(null);
    setAlreadyAtSalon(false);
    try {
      const params =
        values.lookupType === "aadhaar"
          ? `aadhaar=${encodeURIComponent(values.aadhaarNumber!.trim())}`
          : `mobile=${encodeURIComponent(values.mobileNumber!.trim())}`;
      const res = await fetch(`/api/stylists/lookup?${params}`);
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Lookup failed");
        return;
      }

      const queryAadhaar =
        values.lookupType === "aadhaar"
          ? values.aadhaarNumber!.trim()
          : result.data?.query?.aadhaarNumber || "";
      const queryMobile =
        values.lookupType === "mobile"
          ? values.mobileNumber!.trim()
          : result.data?.query?.mobileNumber || "";

      if (!result.data?.found || !result.data.stylist) {
        if (hireApplication) {
          toast.error(
            "Applicant profile not found. Verify Aadhaar and try again."
          );
          return;
        }
        const seed = emptyDraft({
          aadhaarNumber: queryAadhaar,
          mobileNumber: queryMobile,
        });
        setDraft(seed);
        step1Form.reset({
          aadhaarNumber: seed.aadhaarNumber,
          mobileNumber: seed.mobileNumber,
          name: "",
          workingFromMonth: seed.workingFromMonth,
          workingFromYear: seed.workingFromYear,
        });
        setStep("create1");
        return;
      }

      const stylist = result.data.stylist as LookedUpStylist;
      if (hireApplication && stylist.id !== hireApplication.stylistId) {
        toast.error("This profile does not match the selected applicant");
        return;
      }

      const jobRole = hireApplication?.jobRole;
      const jobEmploymentType = hireApplication?.jobEmploymentType;
      setExisting({
        ...stylist,
        role:
          (jobRole as StylistRole | undefined) ||
          (stylist.role as StylistRole | undefined),
        employmentType:
          (jobEmploymentType as EmploymentType | undefined) ||
          (stylist.employmentType as EmploymentType | undefined),
      });
      setAlreadyAtSalon(Boolean(result.data.alreadyAtSalon));
      setExistingWorkingMonth(new Date().getMonth() + 1);
      setExistingWorkingYear(new Date().getFullYear());
      setStep("existing");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLookingUp(false);
    }
  }

  async function postExistingPayload(payload: {
    name: string;
    mobileNumber: string;
    aadhaarNumber: string;
    address: string;
    photoUrl: string;
    workingFromMonth: number;
    workingFromYear: number;
    level?: CreateDraft["level"];
    role?: CreateDraft["role"];
    employmentType?: CreateDraft["employmentType"];
    status: "Active" | "Relieved" | "Abscond";
    remark: string;
  }) {
    const parsed = stylistCreateSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid profile data");
      return;
    }

    const res = hireApplication
      ? await fetch(`/api/applications/${hireApplication.id}/hire`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        })
      : await fetch("/api/stylists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
    const result = await res.json();
    if (!result.success) {
      toast.error(
        result.message ||
          (hireApplication ? "Failed to hire applicant" : "Failed to add stylist")
      );
      return;
    }
    toast.success(
      hireApplication
        ? "Stylist hired and added to your salon"
        : result.data?.linked
          ? "Employment added to existing stylist profile"
          : "Stylist added successfully"
    );
    if (hireApplication && result.data?.application) {
      onHireComplete?.(result.data.application as HiringApplicationCard);
    }
    onOpenChange(false);
    router.refresh();
  }

  async function submitExisting() {
    if (!existing) return;
    if (alreadyAtSalon) {
      toast.error("This stylist is already registered at your salon");
      return;
    }
    if (!existing.aadhaarNumber || !/^\d{12}$/.test(existing.aadhaarNumber)) {
      toast.error("Aadhaar is required to add this stylist");
      return;
    }

    setSubmitting(true);
    try {
      await postExistingPayload({
        name: existing.name.trim(),
        mobileNumber: existing.mobileNumber.trim(),
        aadhaarNumber: existing.aadhaarNumber,
        address: existing.address ?? "",
        photoUrl: existing.photoUrl ?? "",
        workingFromMonth: existingWorkingMonth,
        workingFromYear: existingWorkingYear,
        level: existing.level as CreateDraft["level"],
        role: existing.role as CreateDraft["role"],
        employmentType: existing.employmentType as CreateDraft["employmentType"],
        status: "Active",
        remark: "",
      });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitExistingWithDraft(source: CreateDraft) {
    if (!existing) return;
    if (alreadyAtSalon) {
      toast.error("This stylist is already registered at your salon");
      return;
    }
    if (!existing.aadhaarNumber || !/^\d{12}$/.test(existing.aadhaarNumber)) {
      toast.error("Aadhaar is required to add this stylist");
      return;
    }

    setSubmitting(true);
    try {
      await postExistingPayload({
        name: source.name.trim(),
        mobileNumber: source.mobileNumber.trim(),
        aadhaarNumber: existing.aadhaarNumber,
        address: source.address ?? "",
        photoUrl: source.photoUrl ?? "",
        workingFromMonth: source.workingFromMonth,
        workingFromYear: source.workingFromYear,
        level: source.level,
        role: source.role,
        employmentType: source.employmentType,
        status: hireApplication ? "Active" : source.status || "Active",
        remark: source.remark || "",
      });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function goToExistingAdditional() {
    if (!existing) return;
    setDraft({
      aadhaarNumber: existing.aadhaarNumber,
      mobileNumber: existing.mobileNumber,
      name: existing.name,
      address: existing.address ?? "",
      photoUrl: existing.photoUrl ?? "",
      workingFromMonth: existingWorkingMonth,
      workingFromYear: existingWorkingYear,
      level: existing.level as CreateDraft["level"],
      role: existing.role as CreateDraft["role"],
      employmentType: existing.employmentType as CreateDraft["employmentType"],
      status: "Active",
      remark: "",
    });
    setAdditionalSource("existing");
    setStep("create2");
  }

  function goToAdditional(values: CreateStep1Values) {
    setDraft((prev) => ({ ...prev, ...values }));
    setAdditionalSource("create1");
    setStep("create2");
  }

  async function submitCreateFromRequired(values: CreateStep1Values) {
    setDraft((prev) => ({ ...prev, ...values }));
    await submitCreateWithDraft({
      ...values,
      address: "",
      photoUrl: "",
      remark: "",
    });
  }

  async function submitCreate() {
    if (additionalSource === "existing") {
      await submitExistingWithDraft(draft);
      return;
    }
    await submitCreateWithDraft(draft);
  }

  async function submitCreateWithDraft(payloadDraft: CreateDraft) {
    setSubmitting(true);
    try {
      const payload = {
        ...payloadDraft,
        level: payloadDraft.level || undefined,
        role: payloadDraft.role || undefined,
        employmentType: payloadDraft.employmentType || undefined,
        status: payloadDraft.status || undefined,
      };
      const parsed = stylistCreateSchema.safeParse(payload);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Check required fields");
        setStep("create1");
        return;
      }

      const res = await fetch("/api/stylists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Failed to add stylist");
        return;
      }
      toast.success(
        result.data?.stylist?.employeeId
          ? `Stylist added successfully (${result.data.stylist.employeeId})`
          : "Stylist added successfully"
      );
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.onerror = () => toast.error("Failed to read image");
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleCroppedUpload(blob: Blob) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "stylist-photo.jpg");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Upload failed");
        throw new Error("UPLOAD_FAILED");
      }
      if (step === "existing" && existing) {
        setExisting({ ...existing, photoUrl: data.data.url });
      } else {
        setDraft((prev) => ({ ...prev, photoUrl: data.data.url }));
      }
      toast.success("Photo uploaded");
    } catch (error) {
      if (!(error instanceof Error && error.message === "UPLOAD_FAILED")) {
        toast.error("Failed to upload photo");
      }
      throw error;
    } finally {
      setUploading(false);
    }
  }

  const busy = lookingUp || submitting || uploading;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="space-y-3 border-b border-border px-5 py-4 sm:px-6">
            <DialogTitle className="flex items-center gap-2 text-lg">
              {hireApplication ? (
                <>
                  <UserCheck className="size-5 text-primary" />
                  Hire Applicant
                </>
              ) : (
                <>
                  <Plus className="size-5 text-primary" />
                  Add Stylist
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {hireApplication && step === "existing" &&
                `Review the profile, edit permitted details, then confirm hiring for ${hireApplication.jobRole}.`}
              {!hireApplication && step === "lookup" &&
                "Search with Aadhaar for an exact match. Mobile number is optional and may match more than one stylist."}
              {!hireApplication && step === "existing" &&
                "Review the profile, edit details if needed, then add them to your salon."}
              {step === "create1" &&
                "Enter the required details. You can create now, or open optional additional information."}
              {step === "create2" &&
                "Optional additional information — go back anytime; your details stay saved."}
            </DialogDescription>
            {!hireApplication ? (
              <ProgressDots step={step} mode={progressMode} />
            ) : step === "create2" ? (
              <ProgressDots step={step} mode="create" />
            ) : null}
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
            {hireApplication && lookingUp && !existing ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 size-5 animate-spin" />
                Loading applicant profile…
              </div>
            ) : (
            <AnimatePresence mode="wait">
              {step === "lookup" && !hireApplication && (
                <motion.form
                  key="lookup"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                  onSubmit={lookupForm.handleSubmit(runLookup)}
                >
                  <div
                    className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1"
                    role="tablist"
                    aria-label="Search method"
                  >
                    {(
                      [
                        {
                          value: "aadhaar" as const,
                          label: "Aadhaar",
                          hint: "Recommended",
                        },
                        {
                          value: "mobile" as const,
                          label: "Mobile Number",
                          hint: "Optional",
                        },
                      ] as const
                    ).map((opt) => {
                      const selected = lookupType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          className={cn(
                            "rounded-md px-2.5 py-2 text-left transition-colors sm:px-3",
                            selected
                              ? "bg-background text-foreground shadow-sm ring-1 ring-primary/25"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => {
                            lookupForm.setValue("lookupType", opt.value, {
                              shouldValidate: false,
                            });
                            lookupForm.clearErrors([
                              "aadhaarNumber",
                              "mobileNumber",
                            ]);
                          }}
                        >
                          <span className="block text-sm font-medium leading-tight">
                            {opt.label}
                          </span>
                          <span
                            className={cn(
                              "mt-0.5 block text-[0.65rem] leading-tight",
                              selected
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          >
                            {opt.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Keep both fields mounted so values persist when switching. */}
                  <div
                    className={cn(
                      "space-y-1.5",
                      lookupType !== "aadhaar" && "hidden"
                    )}
                  >
                    <Label htmlFor="add-lookup-aadhaar">
                      Aadhaar Number{" "}
                      <span className="font-normal text-muted-foreground">
                        (recommended)
                      </span>
                    </Label>
                    <Input
                      id="add-lookup-aadhaar"
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="12-digit Aadhaar"
                      aria-describedby="add-lookup-aadhaar-help"
                      {...lookupForm.register("aadhaarNumber", {
                        onChange: (e) => handleDigitInput(e, 12),
                      })}
                    />
                    {lookupForm.formState.errors.aadhaarNumber && (
                      <p className="text-sm text-destructive" role="alert">
                        {lookupForm.formState.errors.aadhaarNumber.message}
                      </p>
                    )}
                    <p
                      id="add-lookup-aadhaar-help"
                      className="text-xs font-medium text-success"
                    >
                      Best for an exact stylist match.
                    </p>
                  </div>

                  <div
                    className={cn(
                      "space-y-1.5",
                      lookupType !== "mobile" && "hidden"
                    )}
                  >
                    <Label htmlFor="add-lookup-mobile">
                      Mobile Number (Optional)
                    </Label>
                    <Input
                      id="add-lookup-mobile"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit mobile"
                      aria-describedby="add-lookup-mobile-warning"
                      {...lookupForm.register("mobileNumber", {
                        onChange: (e) => handleDigitInput(e, 10),
                      })}
                    />
                    {lookupForm.formState.errors.mobileNumber && (
                      <p className="text-sm text-destructive" role="alert">
                        {lookupForm.formState.errors.mobileNumber.message}
                      </p>
                    )}
                    <p
                      id="add-lookup-mobile-warning"
                      className="flex items-start gap-1.5 text-xs font-medium leading-relaxed text-warning"
                      role="note"
                    >
                      <span aria-hidden="true" className="shrink-0">
                        ⚠
                      </span>
                      <span>
                        Mobile numbers may not be unique to a stylist. For an
                        exact match, use the stylist&apos;s Aadhaar number.
                      </span>
                    </p>
                  </div>

                  <Button type="submit" className="h-10 w-full" disabled={busy}>
                    {lookingUp ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 size-4" />
                    )}
                    Continue
                  </Button>
                </motion.form>
              )}

              {step === "existing" && existing && (
                <motion.div
                  key="existing"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-5"
                >
                  {alreadyAtSalon && (
                    <Alert>
                      <AlertDescription>
                        This stylist is already registered at your salon.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-4">
                    <StylistAvatar
                      name={existing.name}
                      photoUrl={existing.photoUrl}
                      size="xl"
                      alt={existing.name}
                    />
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-base font-semibold">
                        {existing.name}
                      </p>
                      {existing.employeeId && (
                        <p className="text-xs text-muted-foreground">
                          ID {existing.employeeId}
                        </p>
                      )}
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                        {uploading ? "Uploading…" : "Change photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={busy || alreadyAtSalon}
                          onChange={handlePhotoSelect}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <UnderlineEditable
                      label="Full name"
                      value={existing.name}
                      editing={editField === "name"}
                      disabled={alreadyAtSalon}
                      onEdit={() => setEditField("name")}
                      onChange={(v) => setExisting({ ...existing, name: v })}
                      onDone={() => setEditField(null)}
                    />
                    <UnderlineEditable
                      label="Mobile"
                      value={existing.mobileNumber}
                      editing={editField === "mobile"}
                      disabled={alreadyAtSalon}
                      inputMode="numeric"
                      maxLength={10}
                      onEdit={() => setEditField("mobile")}
                      onChange={(v) =>
                        setExisting({
                          ...existing,
                          mobileNumber: v.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      onDone={() => setEditField(null)}
                    />
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Aadhaar
                      </p>
                      <p className="min-h-7 border-b border-transparent py-1 text-sm font-medium">
                        {existing.aadhaarMasked || existing.aadhaarNumber}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <UnderlineEditable
                        label="Address"
                        value={existing.address}
                        editing={editField === "address"}
                        disabled={alreadyAtSalon}
                        multiline
                        onEdit={() => setEditField("address")}
                        onChange={(v) =>
                          setExisting({ ...existing, address: v })
                        }
                        onDone={() => setEditField(null)}
                      />
                    </div>
                  </div>

                  {!alreadyAtSalon && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Working here from (month)</Label>
                        <Select
                          value={MONTHS[existingWorkingMonth - 1] ?? null}
                          onValueChange={(v) => {
                            const idx = MONTHS.indexOf(String(v ?? ""));
                            if (idx >= 0) setExistingWorkingMonth(idx + 1);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((month) => (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Working here from (year)</Label>
                        <Select
                          value={String(existingWorkingYear)}
                          onValueChange={(v) =>
                            setExistingWorkingYear(Number(v))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS.map((year) => (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {!alreadyAtSalon && (
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                      disabled={busy}
                      onClick={goToExistingAdditional}
                    >
                      <span className="text-sm font-medium text-foreground">
                        Additional Information{" "}
                        <span className="font-normal text-muted-foreground">
                          (Optional)
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  )}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        hireApplication ? onOpenChange(false) : setStep("lookup")
                      }
                      disabled={busy}
                    >
                      <ArrowLeft className="mr-2 size-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="h-10"
                      disabled={busy || alreadyAtSalon}
                      onClick={() => void submitExisting()}
                    >
                      {submitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      {hireApplication ? "Confirm hire" : "Add to salon"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === "create1" && (
                <motion.form
                  key="create1"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                  onSubmit={step1Form.handleSubmit((values) => {
                    void submitCreateFromRequired(values);
                  })}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="create-aadhaar">Aadhaar Number</Label>
                    <Input
                      id="create-aadhaar"
                      inputMode="numeric"
                      maxLength={12}
                      {...step1Form.register("aadhaarNumber", {
                        onChange: (e) => handleDigitInput(e, 12),
                      })}
                    />
                    {step1Form.formState.errors.aadhaarNumber && (
                      <p className="text-sm text-destructive">
                        {step1Form.formState.errors.aadhaarNumber.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="create-mobile">Mobile Number</Label>
                    <Input
                      id="create-mobile"
                      inputMode="numeric"
                      maxLength={10}
                      {...step1Form.register("mobileNumber", {
                        onChange: (e) => handleDigitInput(e, 10),
                      })}
                    />
                    {step1Form.formState.errors.mobileNumber && (
                      <p className="text-sm text-destructive">
                        {step1Form.formState.errors.mobileNumber.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="create-name">Full Name</Label>
                    <Input id="create-name" {...step1Form.register("name")} />
                    {step1Form.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {step1Form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Working here from (month)</Label>
                      <Select
                        value={
                          step1Form.watch("workingFromMonth")
                            ? MONTHS[step1Form.watch("workingFromMonth")! - 1]
                            : null
                        }
                        onValueChange={(v) => {
                          const idx = MONTHS.indexOf(String(v ?? ""));
                          if (idx >= 0) {
                            step1Form.setValue("workingFromMonth", idx + 1, {
                              shouldValidate: true,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {step1Form.formState.errors.workingFromMonth && (
                        <p className="text-sm text-destructive">
                          {step1Form.formState.errors.workingFromMonth.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Working here from (year)</Label>
                      <Select
                        value={
                          step1Form.watch("workingFromYear")
                            ? String(step1Form.watch("workingFromYear"))
                            : null
                        }
                        onValueChange={(v) =>
                          step1Form.setValue("workingFromYear", Number(v), {
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {step1Form.formState.errors.workingFromYear && (
                        <p className="text-sm text-destructive">
                          {step1Form.formState.errors.workingFromYear.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    disabled={busy}
                    onClick={() => {
                      void step1Form.handleSubmit(goToAdditional)();
                    }}
                  >
                    <span className="text-sm font-medium text-foreground">
                      Additional Information{" "}
                      <span className="font-normal text-muted-foreground">
                        (Optional)
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep("lookup")}
                      disabled={busy}
                    >
                      <ArrowLeft className="mr-2 size-4" />
                      Back
                    </Button>
                    <Button type="submit" className="h-10" disabled={busy}>
                      {submitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Create stylist profile
                    </Button>
                  </div>
                </motion.form>
              )}

              {step === "create2" && (
                <motion.div
                  key="create2"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  <p className="text-sm font-medium">
                    Additional Information{" "}
                    <span className="font-normal text-muted-foreground">
                      (Optional)
                    </span>
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Role / Position</Label>
                      <Select
                        value={draft.role || null}
                        onValueChange={(v) =>
                          setDraft((prev) => ({
                            ...prev,
                            role: v as CreateDraft["role"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          {STYLIST_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Employment type</Label>
                      <Select
                        value={draft.employmentType || null}
                        onValueChange={(v) =>
                          setDraft((prev) => ({
                            ...prev,
                            employmentType: v as CreateDraft["employmentType"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Level</Label>
                      <Select
                        value={draft.level || null}
                        onValueChange={(v) =>
                          setDraft((prev) => ({
                            ...prev,
                            level: v as CreateDraft["level"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          {(["L1", "L2", "L3", "L4"] as const).map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {additionalSource !== "existing" && !hireApplication ? (
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select
                        value={draft.status || null}
                        onValueChange={(v) =>
                          setDraft((prev) => ({
                            ...prev,
                            status: v as CreateDraft["status"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Relieved">Relieved</SelectItem>
                          <SelectItem value="Abscond">Abscond</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="create-address">Address</Label>
                    <Textarea
                      id="create-address"
                      rows={2}
                      value={draft.address}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Staff photo</Label>
                    <div className="flex items-center gap-3">
                      <StylistAvatar
                        name={draft.name || "Stylist"}
                        photoUrl={draft.photoUrl}
                        size="lg"
                        alt={draft.name || "Stylist"}
                      />
                      <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                        {uploading ? "Uploading…" : "Upload photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={busy}
                          onChange={handlePhotoSelect}
                        />
                      </label>
                    </div>
                  </div>

                  {(draft.status === "Relieved" ||
                    draft.status === "Abscond") && (
                    <div className="space-y-1.5">
                      <Label htmlFor="create-remark">Remark</Label>
                      <Textarea
                        id="create-remark"
                        rows={2}
                        value={draft.remark}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            remark: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        if (additionalSource === "existing") {
                          setExisting((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  name: draft.name,
                                  mobileNumber: draft.mobileNumber,
                                  address: draft.address,
                                  photoUrl: draft.photoUrl,
                                  level: draft.level,
                                  role: draft.role,
                                  employmentType: draft.employmentType,
                                }
                              : prev
                          );
                          setExistingWorkingMonth(draft.workingFromMonth);
                          setExistingWorkingYear(draft.workingFromYear);
                          setStep("existing");
                          return;
                        }
                        step1Form.reset({
                          aadhaarNumber: draft.aadhaarNumber,
                          mobileNumber: draft.mobileNumber,
                          name: draft.name,
                          workingFromMonth: draft.workingFromMonth,
                          workingFromYear: draft.workingFromYear,
                        });
                        setStep("create1");
                      }}
                    >
                      <ArrowLeft className="mr-2 size-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="h-10"
                      disabled={busy}
                      onClick={() => void submitCreate()}
                    >
                      {submitting && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      {hireApplication
                        ? "Confirm hire"
                        : additionalSource === "existing"
                          ? "Add to salon"
                          : "Create stylist profile"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ImageCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropSrc}
        onCropped={handleCroppedUpload}
      />
    </>
  );
}
