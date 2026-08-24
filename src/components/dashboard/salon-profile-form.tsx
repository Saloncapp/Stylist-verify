"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Store, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SalonTypeBadge } from "@/components/salon-type-badge";
import {
  SALON_TYPES,
  MIN_ESTABLISHMENT_YEAR,
  MAX_ESTABLISHMENT_YEAR,
} from "@/lib/salon-constants";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations";
import { handleDigitInput } from "@/lib/digit-input";
import type { SalonUser } from "@/types";
import { toast } from "sonner";

const ImageCropDialog = dynamic(
  () =>
    import("@/components/dashboard/image-crop-dialog").then(
      (mod) => mod.ImageCropDialog
    ),
  { ssr: false }
);

export function SalonProfileForm({ initialSalon }: { initialSalon: SalonUser }) {
  const [salon, setSalon] = useState(initialSalon);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema) as Resolver<ProfileUpdateInput>,
    defaultValues: {
      salonName: salon.salonName,
      ownerName: salon.ownerName,
      email: salon.email,
      staffCount: salon.staffCount,
      salonType: salon.salonType,
      logoUrl: salon.logoUrl ?? "",
      salonAddress: salon.salonAddress ?? "",
      googleMapsLocation: salon.googleMapsLocation ?? "",
      websiteUrl: salon.websiteUrl ?? "",
      instagramUrl: salon.instagramUrl ?? "",
      facebookUrl: salon.facebookUrl ?? "",
      whatsappNumber: salon.whatsappNumber ?? "",
      youtubeUrl: salon.youtubeUrl ?? "",
      establishmentYear: salon.establishmentYear
        ? String(salon.establishmentYear)
        : "",
    },
  });

  const watchedSalonType = watch("salonType");
  const watchedLogoUrl = watch("logoUrl");

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
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

  async function handleCroppedLogoUpload(blob: Blob) {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "salon-logo.jpg");

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

      setValue("logoUrl", data.data.url, { shouldValidate: true });
      toast.success("Logo uploaded");
    } catch (error) {
      if (!(error instanceof Error && error.message === "UPLOAD_FAILED")) {
        toast.error("Failed to upload logo");
      }
      throw error;
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleRemoveLogo() {
    setValue("logoUrl", "", { shouldValidate: true });
  }

  useEffect(() => {
    reset({
      salonName: salon.salonName,
      ownerName: salon.ownerName,
      email: salon.email,
      staffCount: salon.staffCount,
      salonType: salon.salonType,
      logoUrl: salon.logoUrl ?? "",
      salonAddress: salon.salonAddress ?? "",
      googleMapsLocation: salon.googleMapsLocation ?? "",
      websiteUrl: salon.websiteUrl ?? "",
      instagramUrl: salon.instagramUrl ?? "",
      facebookUrl: salon.facebookUrl ?? "",
      whatsappNumber: salon.whatsappNumber ?? "",
      youtubeUrl: salon.youtubeUrl ?? "",
      establishmentYear: salon.establishmentYear
        ? String(salon.establishmentYear)
        : "",
    });
  }, [salon, reset]);

  async function onProfileSubmit(data: ProfileUpdateInput) {
    try {
      const res = await fetch("/api/salon/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to update profile");
        return;
      }

      setSalon(result.data.salon);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ImageCropDialog
        open={cropOpen}
        imageSrc={cropSrc}
        title="Crop Salon Logo"
        description="Adjust the crop area for your salon logo, then confirm to upload."
        onOpenChange={setCropOpen}
        onCropped={handleCroppedLogoUpload}
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Salon Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Salon Logo (optional)</Label>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                  {watchedLogoUrl ? (
                    <Image
                      src={watchedLogoUrl}
                      alt="Salon logo preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Store className="size-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingLogo}
                    onClick={() =>
                      document.getElementById("salon-logo-input")?.click()
                    }
                  >
                    {uploadingLogo ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 size-4" />
                    )}
                    {watchedLogoUrl ? "Change Logo" : "Upload Logo"}
                  </Button>
                  {watchedLogoUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                    >
                      Remove
                    </Button>
                  ) : null}
                  <input
                    id="salon-logo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoSelect}
                  />
                </div>
              </div>
              {errors.logoUrl && (
                <p className="text-sm text-danger">{errors.logoUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-salonType">Salon Type</Label>
              <Select
                value={watchedSalonType}
                onValueChange={(value) =>
                  setValue("salonType", value as ProfileUpdateInput["salonType"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="profile-salonType">
                  <SelectValue placeholder="Select salon type" />
                </SelectTrigger>
                <SelectContent>
                  {SALON_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {watchedSalonType && (
                <SalonTypeBadge type={watchedSalonType} className="mt-1" />
              )}
              {errors.salonType && (
                <p className="text-sm text-danger">{errors.salonType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-salonName">Salon Name</Label>
              <Input id="profile-salonName" {...register("salonName")} />
              {errors.salonName && (
                <p className="text-sm text-danger">{errors.salonName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-ownerName">Owner / Manager Name</Label>
              <Input id="profile-ownerName" {...register("ownerName")} />
              {errors.ownerName && (
                <p className="text-sm text-danger">{errors.ownerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">
                Email Address{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="profile-email"
                type="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-danger">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-loginPhone">Login Phone</Label>
              <Input
                id="profile-loginPhone"
                type="text"
                readOnly
                disabled
                value={salon.salonNumber}
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                This is your login phone number and cannot be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-staffCount">
                Staff Count{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="profile-staffCount"
                type="number"
                min={1}
                {...register("staffCount", { valueAsNumber: true })}
              />
              {errors.staffCount && (
                <p className="text-sm text-danger">{errors.staffCount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-salonAddress">Salon Address</Label>
              <Textarea
                id="profile-salonAddress"
                rows={3}
                placeholder="Complete business address"
                {...register("salonAddress")}
              />
              {errors.salonAddress && (
                <p className="text-sm text-danger">
                  {errors.salonAddress.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-googleMapsLocation">
                Google Maps Location{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="profile-googleMapsLocation"
                type="url"
                placeholder="https://maps.google.com/..."
                {...register("googleMapsLocation")}
              />
              {errors.googleMapsLocation && (
                <p className="text-sm text-danger">
                  {errors.googleMapsLocation.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-websiteUrl">
                  Salon Website URL{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="profile-websiteUrl"
                  type="url"
                  placeholder="https://www.example.com"
                  {...register("websiteUrl")}
                />
                {errors.websiteUrl && (
                  <p className="text-sm text-danger">
                    {errors.websiteUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-establishmentYear">
                  Establishment Year{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="profile-establishmentYear"
                  type="number"
                  min={MIN_ESTABLISHMENT_YEAR}
                  max={MAX_ESTABLISHMENT_YEAR}
                  placeholder="e.g. 2018"
                  {...register("establishmentYear")}
                />
                {errors.establishmentYear && (
                  <p className="text-sm text-danger">
                    {errors.establishmentYear.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-instagramUrl">
                  Instagram URL{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="profile-instagramUrl"
                  type="url"
                  placeholder="https://www.instagram.com/your-salon"
                  {...register("instagramUrl")}
                />
                {errors.instagramUrl && (
                  <p className="text-sm text-danger">
                    {errors.instagramUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-facebookUrl">
                  Facebook URL{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="profile-facebookUrl"
                  type="url"
                  placeholder="https://www.facebook.com/your-salon"
                  {...register("facebookUrl")}
                />
                {errors.facebookUrl && (
                  <p className="text-sm text-danger">
                    {errors.facebookUrl.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-whatsappNumber">
                  WhatsApp Number{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="profile-whatsappNumber"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit WhatsApp number"
                  {...register("whatsappNumber", {
                    onChange: (e) => handleDigitInput(e, 10),
                  })}
                />
                {errors.whatsappNumber && (
                  <p className="text-sm text-danger">
                    {errors.whatsappNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-youtubeUrl">
                  YouTube URL{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="profile-youtubeUrl"
                  type="url"
                  placeholder="https://www.youtube.com/@your-salon"
                  {...register("youtubeUrl")}
                />
                {errors.youtubeUrl && (
                  <p className="text-sm text-danger">
                    {errors.youtubeUrl.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
