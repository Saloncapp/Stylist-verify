"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signOut } from "firebase/auth";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Scissors,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneOtpAuth } from "@/components/auth/phone-otp-auth";
import { SalonAddressFields } from "@/components/landing/salon-address-fields";
import { handleDigitInput } from "@/lib/digit-input";
import { getFirebaseAuth } from "@/lib/firebase";
import { formatSalonAddress } from "@/lib/india-locations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = "phone" | "role" | "salon" | "stylist";
type RoleChoice = "salon" | "stylist";

type PendingOtp = { idToken: string; phone: string };

const salonFormSchema = z.object({
  salonName: z
    .string()
    .trim()
    .min(2, "Salon name must be at least 2 characters"),
  state: z.string().trim().min(1, "Select a state"),
  district: z.string().trim().min(2, "District is required"),
  city: z.string().trim().min(2, "City / Town is required"),
  area: z.string().trim(),
  pinCode: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{6}$/.test(v), {
      message: "Enter a valid 6-digit PIN code",
    }),
});

type SalonFormValues = z.infer<typeof salonFormSchema>;

const stylistFormSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
  name: z.string().min(2, "Full name must be at least 2 characters"),
});

type StylistFormValues = z.infer<typeof stylistFormSchema>;

type AadhaarLookup =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "found";
      canLink: boolean;
      name: string;
      message: string;
    }
  | { status: "not_found" }
  | { status: "error"; message: string };

function StepShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in-0 slide-in-from-right-2 duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}

function RequiredFieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      <span>
        {children}
        <span
          className="ml-0.5 inline-block text-destructive"
          aria-hidden="true"
        >
          *
        </span>
      </span>
    </Label>
  );
}

/**
 * Home-page auth card: OTP → inline role choice → salon/stylist registration.
 */
export function ContinueWithMobileForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [pending, setPending] = useState<PendingOtp | null>(null);
  const [busy, setBusy] = useState(false);
  const [aadhaarLookup, setAadhaarLookup] = useState<AadhaarLookup>({
    status: "idle",
  });

  const salonForm = useForm<SalonFormValues>({
    resolver: zodResolver(salonFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      salonName: "",
      state: "",
      district: "",
      city: "",
      area: "",
      pinCode: "",
    },
  });

  const stylistForm = useForm<StylistFormValues>({
    resolver: zodResolver(stylistFormSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      aadhaarNumber: "",
      name: "",
    },
  });

  const clearFirebase = useCallback(async () => {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      // ignore
    }
  }, []);

  async function onVerified(idToken: string, phone: string) {
    try {
      setBusy(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Could not continue");
        return;
      }

      if (result.data?.needsRegistration) {
        setPending({ idToken, phone });
        setStep("role");
        toast.success("Phone verified");
        return;
      }

      toast.success("Signed in");
      router.push(result.data.redirectTo as string);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
      await clearFirebase();
    }
  }

  function selectRole(role: RoleChoice) {
    setAadhaarLookup({ status: "idle" });
    stylistForm.reset({ aadhaarNumber: "", name: "" });
    salonForm.reset({
      salonName: "",
      state: "",
      district: "",
      city: "",
      area: "",
      pinCode: "",
    });
    setStep(role === "salon" ? "salon" : "stylist");
  }

  function goBack() {
    if (step === "salon" || step === "stylist") {
      setStep("role");
      return;
    }
    if (step === "role") {
      setPending(null);
      setStep("phone");
    }
  }

  async function checkAadhaar(aadhaarNumber: string) {
    if (!pending || !/^\d{12}$/.test(aadhaarNumber)) {
      setAadhaarLookup({ status: "idle" });
      return;
    }
    try {
      setAadhaarLookup({ status: "loading" });
      const res = await fetch("/api/auth/stylist-aadhaar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: pending.idToken,
          aadhaarNumber,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setAadhaarLookup({
          status: "error",
          message: result.message || "Could not check Aadhaar",
        });
        return;
      }
      if (!result.data.found) {
        setAadhaarLookup({ status: "not_found" });
        return;
      }
      setAadhaarLookup({
        status: "found",
        canLink: Boolean(result.data.canLink),
        name: result.data.name as string,
        message: result.data.message as string,
      });
      if (result.data.canLink && result.data.name) {
        stylistForm.setValue("name", result.data.name as string, {
          shouldDirty: true,
          shouldValidate: false,
        });
        stylistForm.clearErrors("name");
      }
    } catch {
      setAadhaarLookup({
        status: "error",
        message: "Could not check Aadhaar",
      });
    }
  }

  async function submitSalon(data: SalonFormValues) {
    if (!pending) return;
    try {
      setBusy(true);
      const normalized = {
        ...data,
        salonName: data.salonName.trim(),
        state: data.state.trim(),
        district: data.district.trim(),
        city: data.city.trim(),
        area: data.area.trim(),
        pinCode: data.pinCode.trim(),
      };
      const salonAddress = formatSalonAddress(normalized);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: pending.idToken,
          role: "salon",
          salonName: normalized.salonName,
          salonAddress,
        }),
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Registration failed");
        return;
      }
      toast.success("Salon account created");
      router.push(result.data.redirectTo as string);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function submitStylist(data: StylistFormValues) {
    if (!pending) return;
    if (aadhaarLookup.status === "found" && !aadhaarLookup.canLink) {
      toast.error(aadhaarLookup.message);
      return;
    }
    try {
      setBusy(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: pending.idToken,
          role: "stylist",
          name: data.name,
          aadhaarNumber: data.aadhaarNumber,
        }),
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Registration failed");
        return;
      }
      toast.success(
        aadhaarLookup.status === "found" && aadhaarLookup.canLink
          ? "Existing stylist profile linked"
          : "Stylist account created"
      );
      router.push(result.data.redirectTo as string);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const header =
    step === "phone"
      ? {
          title: "Continue with Mobile",
          subtitle: "Secure phone verification for salons and stylists",
        }
      : step === "role"
        ? {
            title: "Create your account",
            subtitle: pending
              ? `Verified +91 ${pending.phone}`
              : "Choose how you want to continue",
          }
        : step === "salon"
          ? {
              title: "Salon registration",
              subtitle: "Tell us about your salon",
            }
          : {
              title: "Stylist registration",
              subtitle: "Confirm your identity details",
            };

  return (
    <Card
      id="continue-with-mobile"
      className={cn(
        "flex w-full scroll-mt-24 flex-col gap-0 overflow-hidden rounded-2xl border border-primary/40 bg-primary/[0.04] py-0 shadow-sm",
        step === "salon" &&
          "max-h-[min(36rem,calc(100dvh-5.5rem))] sm:max-h-[min(38rem,calc(100dvh-5.5rem))] lg:max-h-[calc(100dvh-5.5rem)]"
      )}
    >
      <CardHeader
        className={cn(
          "shrink-0 space-y-0 border-b border-primary/25 bg-primary/10",
          step === "salon"
            ? "px-4 py-3.5 sm:px-5 sm:py-4"
            : "px-6 py-5 sm:px-7 sm:py-6"
        )}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary shadow-sm",
                step === "salon" ? "size-9" : "size-10"
              )}
            >
              <Smartphone className={step === "salon" ? "size-4" : "size-5"} />
            </div>
            <CardTitle
              className={cn(
                "min-w-0 font-semibold tracking-tight text-primary",
                step === "salon" ? "text-lg" : "text-xl"
              )}
            >
              {header.title}
            </CardTitle>
          </div>
          <p className="text-sm leading-relaxed text-primary/75">
            {header.subtitle}
          </p>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "flex min-h-0 flex-1 flex-col bg-card/80",
          step === "salon"
            ? "overflow-y-auto overscroll-contain px-4 py-3.5 sm:px-5 sm:py-4"
            : "px-6 py-6 sm:px-7 sm:py-7"
        )}
      >
        <div
          className={cn(
            "flex flex-col",
            step === "salon" || step === "stylist"
              ? "min-h-0 justify-start"
              : "min-h-[280px] justify-center sm:min-h-[300px]"
          )}
        >
          {step === "phone" && (
            <StepShell>
              <PhoneOtpAuth
                onVerified={onVerified}
                introText="Sign in or create your account using your mobile number."
                helperText="We'll send you a one-time verification code."
                continueLabel="Continue"
                submitLabel="Continue"
                disabled={busy}
                density="comfortable"
                accent="primary"
                autoFocus
                resendCooldownSec={30}
                recaptchaId="home-phone-recaptcha"
                phoneInputId="home-auth-phone"
                otpInputId="home-auth-otp"
              />
            </StepShell>
          )}

          {step === "role" && (
            <StepShell className="space-y-5">
              <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
                What would you like to register?
              </p>
              <div className="grid gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto justify-start gap-3 px-4 py-4 text-left"
                  onClick={() => selectRole("salon")}
                  disabled={busy}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
                    <Building2 className="size-5 text-primary" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      Salon
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      Manage staff and verify employment history
                    </span>
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto justify-start gap-3 px-4 py-4 text-left"
                  onClick={() => selectRole("stylist")}
                  disabled={busy}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
                    <Scissors className="size-5 text-primary" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      Stylist
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      Own your profile and employment history
                    </span>
                  </span>
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={goBack}
                disabled={busy}
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
            </StepShell>
          )}

          {step === "salon" && (
            <StepShell>
              <form
                className="space-y-3"
                onSubmit={salonForm.handleSubmit(submitSalon)}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="salonName">Salon Name</Label>
                  <Input
                    id="salonName"
                    className="h-9"
                    {...salonForm.register("salonName", {
                      onChange: () => salonForm.clearErrors("salonName"),
                    })}
                  />
                  {salonForm.formState.errors.salonName && (
                    <p className="text-xs text-destructive sm:text-sm">
                      {salonForm.formState.errors.salonName.message}
                    </p>
                  )}
                </div>

                <SalonAddressFields
                  compact
                  value={{
                    state: salonForm.watch("state"),
                    district: salonForm.watch("district"),
                    city: salonForm.watch("city"),
                    area: salonForm.watch("area"),
                    pinCode: salonForm.watch("pinCode"),
                  }}
                  disabled={busy}
                  errors={{
                    state: salonForm.formState.errors.state?.message,
                    district: salonForm.formState.errors.district?.message,
                    city: salonForm.formState.errors.city?.message,
                    area: salonForm.formState.errors.area?.message,
                    pinCode: salonForm.formState.errors.pinCode?.message,
                  }}
                  onChange={(next) => {
                    salonForm.setValue("state", next.state, {
                      shouldDirty: true,
                      shouldValidate: false,
                    });
                    salonForm.setValue("district", next.district, {
                      shouldDirty: true,
                      shouldValidate: false,
                    });
                    salonForm.setValue("city", next.city, {
                      shouldDirty: true,
                      shouldValidate: false,
                    });
                    salonForm.setValue("area", next.area, {
                      shouldDirty: true,
                      shouldValidate: false,
                    });
                    salonForm.setValue("pinCode", next.pinCode, {
                      shouldDirty: true,
                      shouldValidate: false,
                    });
                    salonForm.clearErrors([
                      "state",
                      "district",
                      "city",
                      "area",
                      "pinCode",
                    ]);
                  }}
                />

                <div className="sticky bottom-0 space-y-1.5 bg-card pt-1">
                  <Button type="submit" className="h-9 w-full" disabled={busy}>
                    {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Create salon account
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-full"
                    onClick={goBack}
                    disabled={busy}
                  >
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                  </Button>
                </div>
              </form>
            </StepShell>
          )}

          {step === "stylist" && (
            <StepShell>
              <form
                className="space-y-4"
                onSubmit={stylistForm.handleSubmit(submitStylist)}
              >
                <div className="space-y-2">
                  <RequiredFieldLabel htmlFor="aadhaarNumber">
                    Aadhaar Number
                  </RequiredFieldLabel>
                  <Input
                    id="aadhaarNumber"
                    className="h-11"
                    inputMode="numeric"
                    maxLength={12}
                    aria-required="true"
                    {...stylistForm.register("aadhaarNumber", {
                      onChange: (e) => {
                        handleDigitInput(e, 12);
                        stylistForm.clearErrors("aadhaarNumber");
                        const value = e.target.value;
                        if (value.length === 12) {
                          void checkAadhaar(value);
                        } else {
                          setAadhaarLookup({ status: "idle" });
                        }
                      },
                      onBlur: (e) => {
                        const value = e.target.value;
                        if (/^\d{12}$/.test(value)) {
                          void checkAadhaar(value);
                        }
                      },
                    })}
                  />
                  {stylistForm.formState.errors.aadhaarNumber && (
                    <p className="text-sm text-destructive">
                      {stylistForm.formState.errors.aadhaarNumber.message}
                    </p>
                  )}
                  {aadhaarLookup.status === "loading" && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Checking existing profile…
                    </p>
                  )}
                  {aadhaarLookup.status === "not_found" && (
                    <p className="text-xs text-muted-foreground">
                      No existing stylist profile found for this Aadhaar.
                    </p>
                  )}
                  {aadhaarLookup.status === "found" && (
                    <div
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs leading-relaxed",
                        aadhaarLookup.canLink
                          ? "border-primary/30 bg-primary/5 text-foreground"
                          : "border-destructive/30 bg-destructive/5 text-destructive"
                      )}
                    >
                      {aadhaarLookup.message}
                    </div>
                  )}
                  {aadhaarLookup.status === "error" && (
                    <p className="text-xs text-destructive">
                      {aadhaarLookup.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <RequiredFieldLabel htmlFor="stylistName">
                    Full Name
                  </RequiredFieldLabel>
                  <Input
                    id="stylistName"
                    className="h-11"
                    aria-required="true"
                    disabled={
                      aadhaarLookup.status === "found" &&
                      !aadhaarLookup.canLink
                    }
                    {...stylistForm.register("name", {
                      onChange: () => stylistForm.clearErrors("name"),
                    })}
                  />
                  {stylistForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {stylistForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={
                    busy ||
                    aadhaarLookup.status === "loading" ||
                    (aadhaarLookup.status === "found" &&
                      !aadhaarLookup.canLink)
                  }
                >
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {aadhaarLookup.status === "found" && aadhaarLookup.canLink
                    ? "Link existing profile"
                    : "Create stylist account"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={goBack}
                  disabled={busy}
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back
                </Button>
              </form>
            </StepShell>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
