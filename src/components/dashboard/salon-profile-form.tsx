"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import type { SalonUser } from "@/types";
import { toast } from "sonner";

export function SalonProfileForm({ initialSalon }: { initialSalon: SalonUser }) {
  const router = useRouter();
  const [salon, setSalon] = useState(initialSalon);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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
              <Input
                id="profile-email"
                type="email"
                {...registerProfile("email")}
              />
              {profileErrors.email && (
                <p className="text-sm text-danger">{profileErrors.email.message}</p>
              )}
              {salon.authProvider === "google" && (
                <p className="text-xs text-muted-foreground">
                  Sign-in still uses your Google account. This email is used for
                  salon communications.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-salonNumber">Salon Number</Label>
              <Input
                id="profile-salonNumber"
                type="text"
                inputMode="numeric"
                maxLength={10}
                {...registerProfile("salonNumber", {
                  onChange: (e) => handleDigitInput(e, 10),
                })}
              />
              {profileErrors.salonNumber && (
                <p className="text-sm text-danger">
                  {profileErrors.salonNumber.message}
                </p>
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

      {salon.authProvider === "email" ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
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
