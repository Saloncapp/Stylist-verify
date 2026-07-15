"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton, clearGooglePendingAuth } from "@/components/auth/google-sign-in-button";
import {
  registerAuthSchema,
  type RegisterAuthInput,
} from "@/lib/validations";
import {
  clearEmailPendingAuth,
  storeEmailPendingAuth,
} from "@/lib/pending-auth";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterAuthInput>({
    resolver: zodResolver(registerAuthSchema),
  });

  async function onSubmit(data: RegisterAuthInput) {
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "This email cannot be used");
        return;
      }

      clearGooglePendingAuth();
      storeEmailPendingAuth({
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      router.push("/register/complete");
    } catch {
      toast.error("Something went wrong");
    }
  }

  function handleGoogleSuccess() {
    clearEmailPendingAuth();
    router.push("/dashboard");
    router.refresh();
  }

  function handleGoogleNeedsProfile() {
    clearEmailPendingAuth();
    router.push("/register/complete");
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Register Your Salon</CardTitle>
        <CardDescription>
          Step 1 of 2 — authenticate with email or Google
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onNeedsProfile={handleGoogleNeedsProfile}
            label="Continue with Google"
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@salon.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-danger">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-danger">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Continue
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
