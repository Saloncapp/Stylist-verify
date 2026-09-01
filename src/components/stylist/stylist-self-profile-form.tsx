"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { StylistAvatar } from "@/components/stylist-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  stylistSelfUpdateSchema,
  type StylistSelfUpdateInput,
} from "@/lib/validations";
import type { StylistAccount } from "@/types";
import { toast } from "sonner";

const ImageCropDialog = dynamic(
  () =>
    import("@/components/dashboard/image-crop-dialog").then(
      (mod) => mod.ImageCropDialog
    ),
  { ssr: false }
);

export function StylistSelfProfileForm({
  initialStylist,
}: {
  initialStylist: StylistAccount;
}) {
  const [stylist, setStylist] = useState(initialStylist);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StylistSelfUpdateInput>({
    resolver: zodResolver(stylistSelfUpdateSchema),
    defaultValues: {
      name: stylist.name,
      address: stylist.address ?? "",
      photoUrl: stylist.photoUrl ?? "",
    },
  });

  const watchedPhotoUrl = watch("photoUrl");

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(String(reader.result));
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleCropped(blob: Blob) {
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", blob, "photo.jpg");
      formData.append("purpose", "image");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Upload failed");
        return;
      }
      setValue("photoUrl", result.data.url, { shouldDirty: true });
      toast.success("Photo uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingPhoto(false);
      setCropOpen(false);
    }
  }

  async function onSubmit(data: StylistSelfUpdateInput) {
    if (!data.name || data.name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    try {
      const res = await fetch("/api/me/stylist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          address: data.address,
          photoUrl: data.photoUrl,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Update failed");
        return;
      }
      const updated = result.data.stylist as StylistAccount;
      setStylist(updated);
      reset({
        name: updated.name,
        address: updated.address ?? "",
        photoUrl: updated.photoUrl ?? "",
      });
      toast.success("Profile updated");
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <StylistAvatar
                name={stylist.name}
                photoUrl={watchedPhotoUrl}
                size="xl"
                variant="profile"
                alt={stylist.name}
              />
              <div className="space-y-2">
                <Label htmlFor="photo">Profile photo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    disabled={uploadingPhoto}
                    className="max-w-xs"
                  />
                  {uploadingPhoto && (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Login phone</Label>
              <Input
                id="mobile"
                value={stylist.mobileNumber}
                disabled
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                Change your login number from Account Security in profile settings.
              </p>
            </div>

            {stylist.aadhaarMasked && (
              <div className="space-y-2">
                <Label htmlFor="aadhaar">Aadhaar</Label>
                <Input
                  id="aadhaar"
                  value={stylist.aadhaarMasked}
                  disabled
                  readOnly
                />
              </div>
            )}

            {stylist.employeeId && (
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={stylist.employeeId}
                  disabled
                  readOnly
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={3} {...register("address")} />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting || uploadingPhoto}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Save changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ImageCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropSrc}
        onCropped={handleCropped}
        title="Crop profile photo"
        description="Adjust the crop area, then confirm to upload."
      />

    </>
  );
}
