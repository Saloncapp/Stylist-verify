"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StylistPreviewCard } from "@/components/verify/stylist-preview-card";
import { StylistPreviewCardSkeleton } from "@/components/verify/stylist-preview-card-skeleton";
import { StylistUnavailableDialog } from "@/components/verify/stylist-unavailable-dialog";
import {
  StylistSearchCard,
  type StylistSearchType,
} from "@/components/verify/stylist-search-card";
import { verifyFormSchema, type VerifyFormInput } from "@/lib/validations";
import { handleDigitInput } from "@/lib/digit-input";
import type { PublicStylistPreview } from "@/types";
import { toast } from "sonner";

interface VerifyResult {
  found: boolean;
  locked?: boolean;
  count?: number;
  previews?: PublicStylistPreview[];
  multiple?: boolean;
}

type VerifyPayload = { aadhaarNumber: string } | { mobileNumber: string };

type VerifyApiOutcome =
  | { status: "success"; data: VerifyResult }
  | { status: "error"; message: string }
  | { status: "network" };

function payloadKey(payload: VerifyPayload): string {
  return JSON.stringify(payload);
}

async function requestVerify(payload: VerifyPayload): Promise<VerifyApiOutcome> {
  try {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const response = await res.json();
    if (!response.success) {
      return {
        status: "error",
        message: response.message || "Verification failed",
      };
    }
    return { status: "success", data: response.data as VerifyResult };
  } catch {
    return { status: "network" };
  }
}

export function VerifyForm() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [unavailableOpen, setUnavailableOpen] = useState(false);
  const prefetchRef = useRef<{
    key: string;
    promise: Promise<VerifyApiOutcome>;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormInput>({
    resolver: zodResolver(verifyFormSchema),
    defaultValues: {
      searchType: "aadhaar",
      aadhaarNumber: "",
      mobileNumber: "",
    },
  });

  const searchType = watch("searchType");

  // Warm serverless instance + Mongo while the user reads / types.
  useEffect(() => {
    void fetch("/api/health", { method: "GET", cache: "no-store" }).catch(
      () => undefined
    );
  }, []);

  function startPrefetch(payload: VerifyPayload) {
    const key = payloadKey(payload);
    if (prefetchRef.current?.key === key) return;
    prefetchRef.current = {
      key,
      promise: requestVerify(payload),
    };
  }

  async function onSubmit(data: VerifyFormInput) {
    setSearched(false);
    setResult(null);
    setUnavailableOpen(false);

    const payload: VerifyPayload =
      data.searchType === "aadhaar"
        ? { aadhaarNumber: data.aadhaarNumber!.trim() }
        : { mobileNumber: data.mobileNumber!.trim() };

    const key = payloadKey(payload);
    const outcome =
      prefetchRef.current?.key === key
        ? await prefetchRef.current.promise
        : await requestVerify(payload);

    if (outcome.status === "error") {
      toast.error(outcome.message);
      return;
    }
    if (outcome.status === "network") {
      toast.error("Something went wrong");
      return;
    }

    setResult(outcome.data);
    setSearched(true);
    setUnavailableOpen(!outcome.data?.found);
  }

  function handleSearchTypeChange(value: StylistSearchType) {
    setValue("searchType", value, { shouldValidate: false });
    clearErrors(["aadhaarNumber", "mobileNumber"]);
    setResult(null);
    setSearched(false);
    setUnavailableOpen(false);
    prefetchRef.current = null;
  }

  const previews = result?.previews ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <StylistSearchCard
        searchType={searchType}
        onSearchTypeChange={handleSearchTypeChange}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        autoFocus
        aadhaarError={errors.aadhaarNumber?.message}
        mobileError={errors.mobileNumber?.message}
        aadhaarInputProps={register("aadhaarNumber", {
          onChange: (e) => {
            handleDigitInput(e, 12);
            const value = e.target.value;
            if (/^\d{12}$/.test(value)) {
              startPrefetch({ aadhaarNumber: value });
            }
          },
        })}
        mobileInputProps={register("mobileNumber", {
          onChange: (e) => {
            handleDigitInput(e, 10);
            const value = e.target.value;
            if (/^[6-9]\d{9}$/.test(value)) {
              startPrefetch({ mobileNumber: value });
            }
          },
        })}
      />

      <StylistUnavailableDialog
        open={unavailableOpen}
        onOpenChange={setUnavailableOpen}
      />

      {isSubmitting ? (
        <div className="space-y-6" role="status" aria-live="polite">
          <span className="sr-only">Verifying stylist record</span>
          <StylistPreviewCardSkeleton />
        </div>
      ) : null}

      {!isSubmitting && searched && result?.found && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {previews.length > 1 && (
            <Alert>
              <Users className="size-4" />
              <AlertDescription>
                {previews.length} stylist records were found. Sign in as a salon
                to view full verification details.
              </AlertDescription>
            </Alert>
          )}

          {previews.map((preview, index) => (
            <StylistPreviewCard
              key={`${preview.displayName}-${index}`}
              preview={preview}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
