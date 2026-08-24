"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Upload,
} from "lucide-react";
import { StylistAvatar } from "@/components/stylist-avatar";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  EMPLOYMENT_TYPES,
  STYLIST_ROLES,
} from "@/lib/employment-constants";
import { handleDigitInput } from "@/lib/digit-input";
import { maskAadhaar } from "@/lib/aadhaar-crypto";
import {
  stylistCreateSchema,
  stylistSchema,
  type StylistInput,
} from "@/lib/validations";
import { toast } from "sonner";

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

type LookupResult = {
  found: boolean;
  alreadyAtSalon?: boolean;
  employeeId?: string;
  mobileNumber?: string;
};

export interface StylistProfileFormProps {
  defaultValues?: Partial<StylistInput>;
  schema?: typeof stylistSchema;
  variant?: "page" | "embedded";
  mode?: "create" | "edit";
  title?: string;
  submitLabel: string;
  initialStatus?: StylistInput["status"];
  idPrefix?: string;
  extraActions?: ReactNode;
  onCancel?: () => void;
  onSubmit: (data: StylistInput) => Promise<void>;
}

export function StylistProfileForm({
  defaultValues,
  schema,
  variant = "page",
  mode = "edit",
  title = "Add New Stylist",
  submitLabel,
  initialStatus = "Active",
  idPrefix = "stylist",
  extraActions,
  onCancel,
  onSubmit,
}: StylistProfileFormProps) {
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const lastLookedUp = useRef("");

  const resolvedSchema = schema ?? (mode === "create" ? stylistCreateSchema : stylistSchema);
  const now = new Date();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StylistInput>({
    resolver: zodResolver(resolvedSchema) as Resolver<StylistInput>,
    defaultValues: {
      name: "",
      mobileNumber: "",
      aadhaarNumber: "",
      address: "",
      photoUrl: "",
      remark: "",
      workingFromMonth: now.getMonth() + 1,
      workingFromYear: now.getFullYear(),
      ...(mode === "create"
        ? {}
        : {
            level: "L1",
            role: "Stylist",
            employmentType: "Full-time",
            status: "Active",
          }),
      ...defaultValues,
    },
  });

  const status = watch("status");
  const role = watch("role");
  const employmentType = watch("employmentType");
  const level = watch("level");
  const photoUrl = watch("photoUrl") ?? "";
  const stylistName = watch("name") ?? "";
  const aadhaarNumber = watch("aadhaarNumber") ?? "";
  const workingFromMonth = watch("workingFromMonth");
  const workingFromYear = watch("workingFromYear");
  const showRemark =
    status === "Relieved" || status === "Abscond"
      ? variant === "page" || status !== initialStatus
      : false;
  const busy = isSubmitting || uploading;
  const alreadyHere = Boolean(lookup?.alreadyAtSalon);

  function fid(name: string) {
    return `${idPrefix}-${name}`;
  }

  useEffect(() => {
    if (mode !== "create") return;
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      lastLookedUp.current = "";
      setLookup(null);
      return;
    }
    if (aadhaarNumber === lastLookedUp.current) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLookingUp(true);
      try {
        const res = await fetch(
          `/api/stylists/lookup?aadhaar=${aadhaarNumber}`,
          { signal: controller.signal }
        );
        const result = await res.json();
        if (!result.success) {
          setLookup(null);
          return;
        }
        lastLookedUp.current = aadhaarNumber;
        const data = result.data as {
          found: boolean;
          alreadyAtSalon?: boolean;
          stylist?: {
            employeeId: string;
            name: string;
            mobileNumber: string;
            address: string;
            photoUrl: string;
            level?: StylistInput["level"];
            role?: StylistInput["role"];
            employmentType?: StylistInput["employmentType"];
            status?: StylistInput["status"];
          };
        };
        if (!data.found || !data.stylist) {
          setLookup({ found: false });
          return;
        }
        setLookup({
          found: true,
          alreadyAtSalon: data.alreadyAtSalon,
          employeeId: data.stylist.employeeId,
          mobileNumber: data.stylist.mobileNumber,
        });
        setValue("name", data.stylist.name, { shouldValidate: true });
        setValue("mobileNumber", data.stylist.mobileNumber, {
          shouldValidate: true,
        });
        setValue("address", data.stylist.address ?? "");
        setValue("photoUrl", data.stylist.photoUrl ?? "");
        if (data.stylist.level) setValue("level", data.stylist.level);
        if (data.stylist.role) setValue("role", data.stylist.role);
        if (data.stylist.employmentType) {
          setValue("employmentType", data.stylist.employmentType);
        }
        if (data.stylist.status) setValue("status", data.stylist.status);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setLookup(null);
        }
      } finally {
        setLookingUp(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [aadhaarNumber, mode, setValue]);

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

      setValue("photoUrl", data.data.url, { shouldValidate: true });
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

  async function submit(data: StylistInput) {
    if (mode === "create" && alreadyHere) {
      toast.error("This stylist is already registered at your salon");
      return;
    }
    await onSubmit(
      mode === "create"
        ? {
            ...data,
            level: data.level || undefined,
            role: data.role || undefined,
            employmentType: data.employmentType || undefined,
            status: data.status || undefined,
          }
        : data
    );
  }

  const editActions = (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
      )}
      <Button type="submit" disabled={busy || alreadyHere}>
        {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );

  const optionalFields = (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Role / Position{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Select
            value={role || null}
            onValueChange={(v) =>
              setValue("role", v as StylistInput["role"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger aria-label="Role / Position">
              <SelectValue placeholder="Select Role/Position" />
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

        <div className="space-y-2">
          <Label>
            Employment Type{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Select
            value={employmentType || null}
            onValueChange={(v) =>
              setValue("employmentType", v as StylistInput["employmentType"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger aria-label="Employment Type">
              <SelectValue placeholder="Select Employment Type" />
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
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Stylist Level{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Select
            value={level || null}
            onValueChange={(v) =>
              setValue("level", v as StylistInput["level"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger aria-label="Stylist Level">
              <SelectValue placeholder="Select Stylist Level" />
            </SelectTrigger>
            <SelectContent>
              {["L1", "L2", "L3", "L4"].map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            Status{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Select
            value={status || null}
            onValueChange={(v) =>
              setValue("status", v as StylistInput["status"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger aria-label="Status">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Relieved">Relieved</SelectItem>
              <SelectItem value="Abscond">Abscond</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={fid("address")}>
          Address{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id={fid("address")}
          placeholder="Full address"
          rows={3}
          {...register("address")}
        />
      </div>

      {extraActions ? <div className="flex flex-wrap gap-2">{extraActions}</div> : null}

      <div className="space-y-2">
        <Label>
          Staff Photo{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <StylistAvatar
              name={stylistName || "Stylist"}
              photoUrl={photoUrl}
              size="xl"
              alt={stylistName || "Stylist"}
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              <Upload className="size-4" />
              {uploading ? "Uploading..." : "Upload Photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoSelect}
                disabled={busy}
              />
            </label>
          </div>
          {mode === "edit" && variant === "embedded" ? editActions : null}
        </div>
      </div>

      {showRemark && (
        <div className="space-y-2">
          <Label htmlFor={fid("remark")}>Remark</Label>
          <Textarea
            id={fid("remark")}
            placeholder="Describe the reason for this status..."
            rows={3}
            {...register("remark")}
          />
          {errors.remark && (
            <p className="text-sm text-danger">{errors.remark.message}</p>
          )}
        </div>
      )}
    </>
  );

  const createFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor={fid("aadhaarNumber")}>Aadhaar Number</Label>
        <div className="relative">
          <Input
            id={fid("aadhaarNumber")}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            required
            aria-required="true"
            aria-invalid={Boolean(errors.aadhaarNumber)}
            aria-describedby={fid("aadhaar-help")}
            placeholder="12-digit Aadhaar"
            {...register("aadhaarNumber", {
              onChange: (e) => handleDigitInput(e, 12),
            })}
          />
          {lookingUp && (
            <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {errors.aadhaarNumber && (
          <p className="text-sm text-danger">{errors.aadhaarNumber.message}</p>
        )}
        <p id={fid("aadhaar-help")} className="text-xs text-muted-foreground">
          Enter Aadhaar to auto-fill an existing stylist profile.
        </p>
        <div aria-live="polite">
          {lookup?.found && !alreadyHere && (
            <Alert>
              <AlertDescription>
                Existing profile {lookup.employeeId || ""} found. Details are
                filled in — review and add this salon’s employment.
              </AlertDescription>
            </Alert>
          )}
          {alreadyHere && (
            <Alert>
              <AlertDescription>
                This stylist is already registered at your salon. You cannot
                create a duplicate profile.
              </AlertDescription>
            </Alert>
          )}
          {lookup && !lookup.found && /^\d{12}$/.test(aadhaarNumber) && (
            <p className="text-xs text-muted-foreground">
              No existing profile. Complete the required fields to create one.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={fid("mobileNumber")}>Phone Number</Label>
        <Input
          id={fid("mobileNumber")}
          type="text"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          required
          aria-required="true"
          aria-invalid={Boolean(errors.mobileNumber)}
          placeholder="10-digit mobile"
          {...register("mobileNumber", {
            onChange: (e) => handleDigitInput(e, 10),
          })}
        />
        {errors.mobileNumber && (
          <p className="text-sm text-danger">{errors.mobileNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={fid("name")}>Full Name</Label>
        <Input
          id={fid("name")}
          placeholder="Full name"
          required
          aria-required="true"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-danger">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <p id={fid("working-from")} className="text-sm leading-none font-medium">
          Working Here From
        </p>
        <div
          role="group"
          aria-labelledby={fid("working-from")}
          className="flex items-start gap-2 sm:gap-3"
        >
          <div className="min-w-0 flex-[1.35] space-y-1.5">
            <Label htmlFor={fid("workingFromMonth")}>Month</Label>
            <Select
              value={workingFromMonth ? String(workingFromMonth) : ""}
              onValueChange={(v) =>
                setValue("workingFromMonth", Number(v), {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger
                id={fid("workingFromMonth")}
                aria-required="true"
                className="w-full"
              >
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((label, index) => (
                  <SelectItem key={label} value={String(index + 1)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[6.75rem] shrink-0 space-y-1.5 sm:w-[7.25rem]">
            <Label htmlFor={fid("workingFromYear")}>Year</Label>
            <Select
              value={workingFromYear ? String(workingFromYear) : ""}
              onValueChange={(v) =>
                setValue("workingFromYear", Number(v), { shouldValidate: true })
              }
            >
              <SelectTrigger
                id={fid("workingFromYear")}
                aria-required="true"
                className="w-full"
              >
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
        {(errors.workingFromMonth || errors.workingFromYear) && (
          <p className="text-sm text-danger">
            {errors.workingFromMonth?.message ||
              errors.workingFromYear?.message}
          </p>
        )}
      </div>
    </>
  );

  const editRequiredFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor={fid("name")}>Stylist Name</Label>
        <Input id={fid("name")} placeholder="Full name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-danger">{errors.name.message}</p>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={fid("mobileNumber")}>Phone Number</Label>
          <Input
            id={fid("mobileNumber")}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={10}
            placeholder="10-digit mobile"
            readOnly
            aria-readonly="true"
            className="cursor-not-allowed bg-muted"
            {...register("mobileNumber")}
          />
          {errors.mobileNumber && (
            <p className="text-sm text-danger">{errors.mobileNumber.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={fid("aadhaarNumber")}>Aadhaar Number</Label>
          <input type="hidden" {...register("aadhaarNumber")} />
          <Input
            id={fid("aadhaarNumber")}
            type="text"
            autoComplete="off"
            value={maskAadhaar(aadhaarNumber)}
            readOnly
            disabled
            aria-readonly="true"
            className="cursor-not-allowed bg-muted disabled:opacity-100"
          />
        </div>
      </div>
    </>
  );

  const createSubmitLabel = alreadyHere
    ? "Already at your salon"
    : lookup?.found
      ? "Add to this salon"
      : submitLabel;

  const fields = (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {mode === "create" ? createFields : editRequiredFields}

      {mode === "create" && (
        <Accordion keepMounted defaultValue={[]} className="w-full">
          <AccordionItem
            value="optional"
            className="rounded-xl border border-border px-3 not-last:border-b-0 sm:px-4"
          >
            <AccordionTrigger className="items-center py-3 hover:no-underline">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 pr-2 text-left">
                <span>Additional Information</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Role, employment type, level, status, address, and photo
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-5 pb-4 pt-1">
              {optionalFields}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {mode === "edit" && optionalFields}

      {variant === "embedded" && mode !== "edit" && (
        <div className="-mx-1 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={busy}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={busy || alreadyHere}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mode === "create" ? createSubmitLabel : submitLabel}
          </Button>
        </div>
      )}

      {variant !== "embedded" && (
        <Button
          type="submit"
          className="w-full"
          disabled={busy || alreadyHere}
        >
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {mode === "create" ? createSubmitLabel : submitLabel}
        </Button>
      )}
    </form>
  );

  return (
    <>
      {variant === "page" ? (
        <Card className="mx-auto max-w-2xl shadow-sm">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>{fields}</CardContent>
        </Card>
      ) : (
        fields
      )}

      {cropOpen && (
        <ImageCropDialog
          open={cropOpen}
          imageSrc={cropSrc}
          onOpenChange={(open) => {
            setCropOpen(open);
            if (!open) setCropSrc("");
          }}
          onCropped={handleCroppedUpload}
        />
      )}
    </>
  );
}
