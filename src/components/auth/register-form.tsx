"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneOtpAuth } from "@/components/auth/phone-otp-auth";
import { handleDigitInput } from "@/lib/digit-input";
import { getFirebaseAuth } from "@/lib/firebase";
import { SALON_TYPES } from "@/lib/salon-constants";
import {
  salonRegisterSchema,
  stylistRegisterSchema,
  type SalonRegisterInput,
  type StylistRegisterInput,
} from "@/lib/validations";
import { toast } from "sonner";

type RoleChoice = "salon" | "stylist";

type PendingOtp = { idToken: string; phone: string };

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingOtp | null>(null);
  const [role, setRole] = useState<RoleChoice | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sv_otp_pending");
      if (!raw) return;
      const parsed = JSON.parse(raw) as PendingOtp;
      if (parsed?.idToken && parsed?.phone) {
        setPending(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const salonForm = useForm<Omit<SalonRegisterInput, "idToken" | "role">>({
    resolver: zodResolver(
      salonRegisterSchema.omit({ idToken: true, role: true })
    ),
    defaultValues: {
      salonName: "",
      salonAddress: "",
      ownerName: "",
      email: "",
      salonType: "Unisex",
    },
  });

  const stylistForm = useForm<Omit<StylistRegisterInput, "idToken" | "role">>({
    resolver: zodResolver(
      stylistRegisterSchema.omit({ idToken: true, role: true })
    ),
    defaultValues: {
      name: "",
      aadhaarNumber: "",
      address: "",
      photoUrl: "",
    },
  });

  async function onVerified(idToken: string, phone: string) {
    try {
      setBusy(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Verification failed");
        return;
      }
      if (!result.data?.needsRegistration) {
        toast.success("Account found — signed in");
        sessionStorage.removeItem("sv_otp_pending");
        router.push(result.data.redirectTo as string);
        router.refresh();
        return;
      }
      const next = { idToken, phone };
      sessionStorage.setItem("sv_otp_pending", JSON.stringify(next));
      setPending(next);
      toast.success("Phone verified. Complete your profile.");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
      try {
        await signOut(getFirebaseAuth());
      } catch {
        // ignore
      }
    }
  }

  async function submitSalon(
    data: Omit<SalonRegisterInput, "idToken" | "role">
  ) {
    if (!pending) return;
    try {
      setBusy(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          idToken: pending.idToken,
          role: "salon",
        }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Registration failed");
        return;
      }
      sessionStorage.removeItem("sv_otp_pending");
      toast.success("Salon account created");
      router.push(result.data.redirectTo as string);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function submitStylist(
    data: Omit<StylistRegisterInput, "idToken" | "role">
  ) {
    if (!pending) return;
    try {
      setBusy(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          idToken: pending.idToken,
          role: "stylist",
        }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Registration failed");
        return;
      }
      sessionStorage.removeItem("sv_otp_pending");
      toast.success("Stylist account created");
      router.push(result.data.redirectTo as string);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!pending) {
    return (
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Verify your phone number with OTP to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhoneOtpAuth
            onVerified={onVerified}
            submitLabel="Continue"
            disabled={busy}
          />
        </CardContent>
      </Card>
    );
  }

  if (!role) {
    return (
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle>Choose account type</CardTitle>
          <CardDescription>
            Phone {pending.phone} is verified. Are you registering a salon or a
            stylist profile?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button type="button" onClick={() => setRole("salon")}>
            Salon
          </Button>
          <Button type="button" variant="outline" onClick={() => setRole("stylist")}>
            Stylist
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (role === "salon") {
    return (
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle>Salon details</CardTitle>
          <CardDescription>
            Phone {pending.phone} will be your login number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={salonForm.handleSubmit(submitSalon)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="salonName">Salon Name</Label>
              <Input id="salonName" {...salonForm.register("salonName")} />
              {salonForm.formState.errors.salonName && (
                <p className="text-sm text-danger">
                  {salonForm.formState.errors.salonName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="salonAddress">Salon Address</Label>
              <Textarea
                id="salonAddress"
                rows={3}
                {...salonForm.register("salonAddress")}
              />
              {salonForm.formState.errors.salonAddress && (
                <p className="text-sm text-danger">
                  {salonForm.formState.errors.salonAddress.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner / Manager (optional)</Label>
              <Input id="ownerName" {...salonForm.register("ownerName")} />
            </div>
            <div className="space-y-2">
              <Label>Salon Type</Label>
              <Select
                value={salonForm.watch("salonType") ?? "Unisex"}
                onValueChange={(v) =>
                  salonForm.setValue(
                    "salonType",
                    v as NonNullable<SalonRegisterInput["salonType"]>
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALON_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create salon account
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setRole(null)}
            >
              Back
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader>
        <CardTitle>Stylist details</CardTitle>
        <CardDescription>
          Phone {pending.phone} will be your login number.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={stylistForm.handleSubmit(submitStylist)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...stylistForm.register("name")} />
            {stylistForm.formState.errors.name && (
              <p className="text-sm text-danger">
                {stylistForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
            <Input
              id="aadhaarNumber"
              type="text"
              inputMode="numeric"
              maxLength={12}
              {...stylistForm.register("aadhaarNumber", {
                onChange: (e) => handleDigitInput(e, 12),
              })}
            />
            {stylistForm.formState.errors.aadhaarNumber && (
              <p className="text-sm text-danger">
                {stylistForm.formState.errors.aadhaarNumber.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address (optional)</Label>
            <Textarea id="address" rows={3} {...stylistForm.register("address")} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create stylist account
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setRole(null)}
          >
            Back
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
