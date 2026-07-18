"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ImageCropDialog } from "@/components/dashboard/image-crop-dialog";
import { stylistSchema, type StylistInput } from "@/lib/validations";
import { handleDigitInput } from "@/lib/digit-input";
import { toast } from "sonner";

export function AddStylistForm() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [cropSrc, setCropSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StylistInput>({
    resolver: zodResolver(stylistSchema),
    defaultValues: {
      level: "L1",
      status: "Active",
      address: "",
      photoUrl: "",
      remark: "",
    },
  });

  const status = watch("status");

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

      setPhotoUrl(data.data.url);
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

  async function onSubmit(data: StylistInput) {
    try {
      const res = await fetch("/api/stylists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to add stylist");
        return;
      }

      toast.success("Stylist added successfully");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <>
      <Card className="mx-auto max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Add New Stylist</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Stylist Name</Label>
              <Input id="name" placeholder="Full name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-danger">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
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
                  <p className="text-sm text-danger">
                    {errors.mobileNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Stylist Level</Label>
                <Select
                  defaultValue="L1"
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
              <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
              <Input
                id="aadhaarNumber"
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
                <p className="text-sm text-danger">
                  {errors.aadhaarNumber.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Same stylist can be enrolled at multiple salons. Aadhaar cannot
                be registered twice at the same salon.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Address{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="address"
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
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <div className="flex items-center gap-4">
                <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
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
                    disabled={uploading}
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
                defaultValue="Active"
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

            {(status === "Relieved" || status === "Abscond") && (
              <div className="space-y-2">
                <Label htmlFor="remark">Remark</Label>
                <Textarea
                  id="remark"
                  placeholder="Describe the reason for this status..."
                  rows={3}
                  {...register("remark")}
                />
                {errors.remark && (
                  <p className="text-sm text-danger">{errors.remark.message}</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || uploading}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Add Stylist
            </Button>
          </form>
        </CardContent>
      </Card>

      <ImageCropDialog
        open={cropOpen}
        imageSrc={cropSrc}
        onOpenChange={(open) => {
          setCropOpen(open);
          if (!open) {
            setCropSrc("");
          }
        }}
        onCropped={handleCroppedUpload}
      />
    </>
  );
}
