"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ConfirmationResult,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import { CheckCircle2, Loader2, Store, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageCropDialog } from "@/components/dashboard/image-crop-dialog";
import { SalonTypeBadge } from "@/components/salon-type-badge";
import {
  SALON_TYPES,
  MIN_ESTABLISHMENT_YEAR,
  MAX_ESTABLISHMENT_YEAR,
} from "@/lib/salon-constants";
import {
  passwordUpdateSchema,
  profileUpdateSchema,
  type PasswordUpdateInput,
  type ProfileUpdateInput,
} from "@/lib/validations";
import { handleDigitInput } from "@/lib/digit-input";
import {
  clearRecaptchaVerifier,
  getFirebaseAuth,
  getOrCreateRecaptchaVerifier,
  googleProvider,
} from "@/lib/firebase";
import type { SalonUser } from "@/types";
import { toast } from "sonner";

export function SalonProfileForm({ initialSalon }: { initialSalon: SalonUser }) {
  const router = useRouter();
  const [salon, setSalon] = useState(initialSalon);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    watch,
    setValue,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      salonName: salon.salonName,
      ownerName: salon.ownerName,
      email: salon.email,
      staffCount: salon.staffCount,
      salonNumber: salon.salonNumber ?? "",
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

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordUpdateInput>({
    resolver: zodResolver(passwordUpdateSchema),
  });

  const watchedEmail = watch("email");
  const watchedSalonNumber = watch("salonNumber");
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
    resetProfile({
      salonName: salon.salonName,
      ownerName: salon.ownerName,
      email: salon.email,
      staffCount: salon.staffCount,
      salonNumber: salon.salonNumber ?? "",
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
  }, [salon, resetProfile]);

  useEffect(() => {
    return () => {
      clearRecaptchaVerifier();
    };
  }, []);

  const emailIsVerified =
    salon.googleLinked &&
    watchedEmail.trim().toLowerCase() === salon.email.toLowerCase();

  const phoneIsVerified =
    salon.salonNumberVerified &&
    watchedSalonNumber === (salon.salonNumber ?? "");

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
      setOtpSent(false);
      setOtp("");
      setConfirmation(null);
      toast.success("Profile updated successfully");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function onPasswordSubmit(data: PasswordUpdateInput) {
    try {
      const res = await fetch("/api/salon/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to update password");
        return;
      }

      resetPassword();
      toast.success("Password updated successfully");
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleVerifyEmail() {
    if (!watchedEmail?.trim()) {
      toast.error("Enter your email address first");
      return;
    }

    if (watchedEmail.trim().toLowerCase() !== salon.email.toLowerCase()) {
      toast.error("Save your email changes first, then verify with Google");
      return;
    }

    try {
      setLinkingGoogle(true);
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/salon/link-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const response = await res.json();

      if (!response.success) {
        toast.error(response.message || "Failed to verify email with Google");
        return;
      }

      setSalon(response.data.salon);
      toast.success("Email verified and Google account connected");
      router.refresh();
    } catch (error) {
      console.error("Verify email error:", error);
      toast.error("Google verification was cancelled or failed");
    } finally {
      setLinkingGoogle(false);
    }
  }

  async function handleSendOtp() {
    if (!/^[6-9]\d{9}$/.test(watchedSalonNumber || "")) {
      toast.error("Enter a valid 10-digit Indian mobile number first");
      return;
    }

    if (watchedSalonNumber !== (salon.salonNumber ?? "")) {
      toast.error("Save your salon number first, then verify with OTP");
      return;
    }

    try {
      setSendingOtp(true);
      clearRecaptchaVerifier();
      const auth = getFirebaseAuth();
      const verifier = getOrCreateRecaptchaVerifier("recaptcha-container");
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        `+91${watchedSalonNumber}`,
        verifier
      );
      setConfirmation(confirmationResult);
      setOtpSent(true);
      setOtp("");
      toast.success("OTP sent to your salon number");
    } catch (error) {
      console.error("Send OTP error:", error);
      clearRecaptchaVerifier();
      toast.error("Failed to send OTP. Check Firebase phone auth settings.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (!confirmation) {
      toast.error("Request an OTP first");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    try {
      setVerifyingOtp(true);
      const credential = await confirmation.confirm(otp);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/salon/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          salonNumber: watchedSalonNumber,
        }),
      });

      const response = await res.json();

      if (!response.success) {
        toast.error(response.message || "Failed to verify salon number");
        return;
      }

      setSalon(response.data.salon);
      setOtpSent(false);
      setOtp("");
      setConfirmation(null);
      clearRecaptchaVerifier();
      toast.success("Salon number verified successfully");
      router.refresh();
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  const showPasswordSection = salon.authProvider === "email";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div id="recaptcha-container" />

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
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
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
              {profileErrors.logoUrl && (
                <p className="text-sm text-danger">{profileErrors.logoUrl.message}</p>
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
              {profileErrors.salonType && (
                <p className="text-sm text-danger">
                  {profileErrors.salonType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-salonName">Salon Name</Label>
              <Input id="profile-salonName" {...registerProfile("salonName")} />
              {profileErrors.salonName && (
                <p className="text-sm text-danger">{profileErrors.salonName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-ownerName">Owner / Manager Name</Label>
              <Input id="profile-ownerName" {...registerProfile("ownerName")} />
              {profileErrors.ownerName && (
                <p className="text-sm text-danger">{profileErrors.ownerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email Address</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="profile-email"
                  type="email"
                  className="flex-1"
                  {...registerProfile("email")}
                />
                {emailIsVerified ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    Verified
                  </span>
                ) : (
                  salon.authProvider === "email" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyEmail}
                      disabled={linkingGoogle}
                      className="shrink-0"
                    >
                      {linkingGoogle && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Verify Email
                    </Button>
                  )
                )}
              </div>
              {profileErrors.email && (
                <p className="text-sm text-danger">{profileErrors.email.message}</p>
              )}
              {salon.authProvider === "email" && !emailIsVerified && (
                <p className="text-xs text-muted-foreground">
                  Verify with Google using the same email to enable Google
                  sign-in.
                </p>
              )}
              {salon.authProvider === "email" && emailIsVerified && (
                <p className="text-xs text-muted-foreground">
                  Connected with Google. You can sign in with password or Google.
                </p>
              )}
              {salon.authProvider === "google" && (
                <p className="text-xs text-muted-foreground">
                  This account uses Google sign-in.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-salonNumber">Salon Number</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="profile-salonNumber"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  className="flex-1"
                  {...registerProfile("salonNumber", {
                    onChange: (e) => {
                      handleDigitInput(e, 10);
                      if (otpSent) {
                        setOtpSent(false);
                        setConfirmation(null);
                        setOtp("");
                      }
                    },
                  })}
                />
                {phoneIsVerified ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    Verified
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="shrink-0"
                  >
                    {sendingOtp && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {otpSent ? "Resend OTP" : "Verify Number"}
                  </Button>
                )}
              </div>
              {profileErrors.salonNumber && (
                <p className="text-sm text-danger">
                  {profileErrors.salonNumber.message}
                </p>
              )}

              {otpSent && !phoneIsVerified && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      handleDigitInput(e, 6);
                      setOtp(e.target.value);
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp}
                    className="shrink-0"
                  >
                    {verifyingOtp && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Confirm OTP
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-staffCount">Staff Count</Label>
              <Input
                id="profile-staffCount"
                type="number"
                min={1}
                {...registerProfile("staffCount", { valueAsNumber: true })}
              />
              {profileErrors.staffCount && (
                <p className="text-sm text-danger">
                  {profileErrors.staffCount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-salonAddress">
                Salon Address{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="profile-salonAddress"
                rows={3}
                placeholder="Complete business address"
                {...registerProfile("salonAddress")}
              />
              {profileErrors.salonAddress && (
                <p className="text-sm text-danger">
                  {profileErrors.salonAddress.message}
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
                {...registerProfile("googleMapsLocation")}
              />
              {profileErrors.googleMapsLocation && (
                <p className="text-sm text-danger">
                  {profileErrors.googleMapsLocation.message}
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
                  {...registerProfile("websiteUrl")}
                />
                {profileErrors.websiteUrl && (
                  <p className="text-sm text-danger">
                    {profileErrors.websiteUrl.message}
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
                  {...registerProfile("establishmentYear")}
                />
                {profileErrors.establishmentYear && (
                  <p className="text-sm text-danger">
                    {profileErrors.establishmentYear.message}
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
                  {...registerProfile("instagramUrl")}
                />
                {profileErrors.instagramUrl && (
                  <p className="text-sm text-danger">
                    {profileErrors.instagramUrl.message}
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
                  {...registerProfile("facebookUrl")}
                />
                {profileErrors.facebookUrl && (
                  <p className="text-sm text-danger">
                    {profileErrors.facebookUrl.message}
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
                  {...registerProfile("whatsappNumber", {
                    onChange: (e) => handleDigitInput(e, 10),
                  })}
                />
                {profileErrors.whatsappNumber && (
                  <p className="text-sm text-danger">
                    {profileErrors.whatsappNumber.message}
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
                  {...registerProfile("youtubeUrl")}
                />
                {profileErrors.youtubeUrl && (
                  <p className="text-sm text-danger">
                    {profileErrors.youtubeUrl.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isProfileSubmitting}>
              {isProfileSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {showPasswordSection ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handlePasswordSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                  id="currentPassword"
                  {...registerPassword("currentPassword")}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-danger">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  {...registerPassword("newPassword")}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-danger">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isPasswordSubmitting}>
                {isPasswordSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Your account is connected with Google. Password updates are not
              required.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
