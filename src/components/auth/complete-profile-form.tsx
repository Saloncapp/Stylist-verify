"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  completeProfileSchema,
  type CompleteProfileInput,
} from "@/lib/validations";
import { handleDigitInput } from "@/lib/digit-input";
import {
  clearGooglePendingAuth,
  getGooglePendingAuth,
} from "@/components/auth/google-sign-in-button";
import { toast } from "sonner";

export function CompleteProfileForm() {
  const router = useRouter();
  const [pending, setPending] = useState<ReturnType<typeof getGooglePendingAuth>>(null);
  const [ready, setReady] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
  });

  useEffect(() => {
    const auth = getGooglePendingAuth();
    if (!auth) {
      router.replace("/login");
      return;
    }

    setPending(auth);
    reset({
      ownerName: auth.profile.ownerName,
      salonName: "",
      staffCount: 1,
      location: "",
      salonNumber: "",
    });
    setReady(true);
  }, [reset, router]);

  if (!ready || !pending) {
    return null;
  }

  async function onSubmit(data: CompleteProfileInput) {
    const auth = getGooglePendingAuth();
    if (!auth) {
      toast.error("Google session expired. Please sign in again.");
      router.replace("/login");
      return;
    }

    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          idToken: auth.idToken,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to complete registration");
        return;
      }

      clearGooglePendingAuth();
      toast.success("Salon profile created successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Complete Your Salon Profile</CardTitle>
        <CardDescription>
          Finish setting up your salon account to access the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={pending.profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              This email is linked to your Google account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salonName">Salon Name</Label>
            <Input id="salonName" placeholder="Your salon name" {...register("salonName")} />
            {errors.salonName && (
              <p className="text-sm text-danger">{errors.salonName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner / Manager Name</Label>
            <Input id="ownerName" placeholder="Full name" {...register("ownerName")} />
            {errors.ownerName && (
              <p className="text-sm text-danger">{errors.ownerName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salonNumber">Salon Number</Label>
            <Input
              id="salonNumber"
              type="text"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              placeholder="10-digit salon contact number"
              {...register("salonNumber", {
                onChange: (e) => handleDigitInput(e, 10),
              })}
            />
            {errors.salonNumber && (
              <p className="text-sm text-danger">{errors.salonNumber.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staffCount">Staff Count</Label>
              <Input
                id="staffCount"
                type="number"
                min={1}
                placeholder="e.g. 10"
                {...register("staffCount", { valueAsNumber: true })}
              />
              {errors.staffCount && (
                <p className="text-sm text-danger">{errors.staffCount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Salon Location</Label>
              <Input id="location" placeholder="City, State" {...register("location")} />
              {errors.location && (
                <p className="text-sm text-danger">{errors.location.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Complete Registration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
