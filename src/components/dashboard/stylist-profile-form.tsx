"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, User } from "lucide-react";
import Image from "next/image";
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
import {
  EMPLOYMENT_TYPES,
  STYLIST_ROLES,
} from "@/lib/employment-constants";
import { handleDigitInput } from "@/lib/digit-input";
import { stylistSchema, type StylistInput } from "@/lib/validations";
import { toast } from "sonner";

const ImageCropDialog = dynamic(
  () =>
    import("@/components/dashboard/image-crop-dialog").then(
      (mod) => mod.ImageCropDialog
    ),
  { ssr: false }
);

export interface StylistProfileFormProps {
  defaultValues?: Partial<StylistInput>;
  schema?: typeof stylistSchema;
  variant?: "page" | "embedded";
  title?: string;
  submitLabel: string;
  initialStatus?: StylistInput["status"];
  idPrefix?: string;
  onCancel?: () => void;
  onSubmit: (data: StylistInput) => Promise<void>;
}

export function StylistProfileForm({
  defaultValues,
  schema = stylistSchema,
  variant = "page",
  title = "Add New Stylist",
  submitLabel,
  initialStatus = "Active",
  idPrefix = "stylist",
  onCancel,
  onSubmit,
}: StylistProfileFormProps) {
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StylistInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      mobileNumber: "",
      level: "L1",
      role: "Stylist",
      employmentType: "Full-time",
      aadhaarNumber: "",
      status: "Active",
      address: "",
      photoUrl: "",
      remark: "",
      ...defaultValues,
    },
  });

  const status = watch("status");
  const photoUrl = watch("photoUrl") ?? "";
  const showRemark =
    status === "Relieved" || status === "Abscond"
      ? variant === "page" || status !== initialStatus
      : false;
  const busy = isSubmitting || uploading;

  function fid(name: string) {
    return `${idPrefix}-${name}`;
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

  const fields = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={fid("name")}>Stylist Name</Label>
        <Input id={fid("name")} placeholder="Full name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-danger">{errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Role / Position</Label>
          <Select
            value={watch("role")}
            onValueChange={(v) =>
              setValue("role", v as StylistInput["role"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STYLIST_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-danger">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Employment Type</Label>
          <Select
            value={watch("employmentType")}
            onValueChange={(v) =>
              setValue("employmentType", v as StylistInput["employmentType"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.employmentType && (
            <p className="text-sm text-danger">
              {errors.employmentType.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={fid("mobileNumber")}>Mobile Number</Label>
          <Input
            id={fid("mobileNumber")}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={10}
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
          <Label>Stylist Level</Label>
          <Select
            value={watch("level")}
            onValueChange={(v) =>
              setValue("level", v as StylistInput["level"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["L1", "L2", "L3", "L4"].map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.level && (
            <p className="text-sm text-danger">{errors.level.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={fid("aadhaarNumber")}>Aadhaar Number</Label>
        <Input
          id={fid("aadhaarNumber")}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={12}
          placeholder="12-digit Aadhaar"
          {...register("aadhaarNumber", {
            onChange: (e) => handleDigitInput(e, 12),
          })}
        />
        {errors.aadhaarNumber && (
          <p className="text-sm text-danger">{errors.aadhaarNumber.message}</p>
        )}
        {variant === "page" && (
          <p className="text-xs text-muted-foreground">
            Same stylist can be enrolled at multiple salons. Aadhaar cannot be
            registered twice at the same salon.
          </p>
        )}
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
        {errors.address && (
          <p className="text-sm text-danger">{errors.address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>
          Staff Photo{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <div className="flex items-center gap-4">
          <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
            {photoUrl ? (
              <Image src={photoUrl} alt="Preview" fill className="object-cover" />
            ) : (
              <User className="size-8 text-muted-foreground" />
            )}
          </div>
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
        {errors.photoUrl && (
          <p className="text-sm text-danger">{errors.photoUrl.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(v) =>
            setValue("status", v as StylistInput["status"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Relieved">Relieved</SelectItem>
            <SelectItem value="Abscond">Abscond</SelectItem>
          </SelectContent>
        </Select>
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

      {variant === "embedded" ? (
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
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      ) : (
        <Button type="submit" className="w-full" disabled={busy}>
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {submitLabel}
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
