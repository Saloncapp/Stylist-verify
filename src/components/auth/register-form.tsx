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
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Registration failed");
        return;
      }

      toast.success("Account created successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Register Your Salon</CardTitle>
        <CardDescription>
          Create an account to start managing stylist records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            Create Account
          </Button>
        </form>

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
