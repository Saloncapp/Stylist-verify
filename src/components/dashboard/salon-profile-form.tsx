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
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    watch,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      salonName: salon.salonName,
      ownerName: salon.ownerName,
      email: salon.email,
      staffCount: salon.staffCount,
      location: salon.location,
      salonNumber: salon.salonNumber ?? "",
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

  useEffect(() => {
    resetProfile({
      salonName: salon.salonName,
      ownerName: salon.ownerName,
      email: salon.email,
      staffCount: salon.staffCount,
      location: salon.location,
      salonNumber: salon.salonNumber ?? "",
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

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Salon Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
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

            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="profile-location">Salon Location</Label>
                <Input id="profile-location" {...registerProfile("location")} />
                {profileErrors.location && (
                  <p className="text-sm text-danger">
                    {profileErrors.location.message}
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
