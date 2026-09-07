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
import { handleDigitInput, sanitizeDigits } from "@/lib/digit-input";
import type { PublicStylistPreview } from "@/types";
import { toast } from "sonner";

interface VerifyResult {
  found: boolean;
  locked?: boolean;
  count?: number;
  previews?: PublicStylistPreview[];
  multiple?: boolean;
}

type VerifyApiResponse = {
  success: boolean;
  message?: string;
  data?: VerifyResult;
};

type PrefetchEntry = {
  key: string;
  promise: Promise<VerifyApiResponse | null>;
};

function verifyPrefetchKey(
  searchType: StylistSearchType,
  value: string
): string {
  return `${searchType}:${value}`;
}

function buildVerifyPayload(
  searchType: StylistSearchType,
  value: string
): { aadhaarNumber: string } | { mobileNumber: string } {
  return searchType === "aadhaar"
    ? { aadhaarNumber: value }
    : { mobileNumber: value };
}

function isCompleteVerifyValue(
  searchType: StylistSearchType,
  value: string
): boolean {
  if (searchType === "aadhaar") return /^\d{12}$/.test(value);
  return /^[6-9]\d{9}$/.test(value);
}

async function fetchVerify(
  payload: { aadhaarNumber: string } | { mobileNumber: string },
  signal?: AbortSignal
): Promise<VerifyApiResponse | null> {
  try {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
    return (await res.json()) as VerifyApiResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    return null;
  }
}

export function VerifyForm() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [unavailableOpen, setUnavailableOpen] = useState(false);
  const prefetchRef = useRef<PrefetchEntry | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  // Warm serverless + Mongo as soon as the verify page mounts.
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/health", {
      method: "GET",
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Ignore — warm-up only.
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function startVerifyPrefetch(type: StylistSearchType, value: string) {
    if (!isCompleteVerifyValue(type, value)) return;

    const key = verifyPrefetchKey(type, value);
    if (prefetchRef.current?.key === key) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const promise = fetchVerify(buildVerifyPayload(type, value), controller.signal);
    prefetchRef.current = { key, promise };
  }

  async function onSubmit(data: VerifyFormInput) {
    setSearched(false);
    setResult(null);
    setUnavailableOpen(false);

    const value =
      data.searchType === "aadhaar"
        ? (data.aadhaarNumber ?? "").trim()
        : (data.mobileNumber ?? "").trim();
    const key = verifyPrefetchKey(data.searchType, value);
    const payload = buildVerifyPayload(data.searchType, value);

    try {
      let response: VerifyApiResponse | null = null;

      if (prefetchRef.current?.key === key) {
        response = await prefetchRef.current.promise;
      }

      if (!response) {
        response = await fetchVerify(payload);
      }

      if (!response) {
        toast.error("Something went wrong");
        return;
      }

      if (!response.success) {
        toast.error(response.message || "Verification failed");
        return;
      }

      setResult(response.data ?? null);
      setSearched(true);
      setUnavailableOpen(!response.data?.found);
    } catch {
      toast.error("Something went wrong");
    }
  }

  function handleSearchTypeChange(value: StylistSearchType) {
    setValue("searchType", value, { shouldValidate: false });
    clearErrors(["aadhaarNumber", "mobileNumber"]);
    setResult(null);
    setSearched(false);
    setUnavailableOpen(false);
    abortRef.current?.abort();
    prefetchRef.current = null;
  }

  const aadhaarRegister = register("aadhaarNumber");
  const mobileRegister = register("mobileNumber");

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
        aadhaarInputProps={{
          ...aadhaarRegister,
          onChange: (e) => {
            handleDigitInput(e, 12);
            void aadhaarRegister.onChange(e);
            const digits = sanitizeDigits(e.target.value, 12);
            if (searchType === "aadhaar") {
              startVerifyPrefetch("aadhaar", digits);
            }
          },
        }}
        mobileInputProps={{
          ...mobileRegister,
          onChange: (e) => {
            handleDigitInput(e, 10);
            void mobileRegister.onChange(e);
            const digits = sanitizeDigits(e.target.value, 10);
            if (searchType === "mobile") {
              startVerifyPrefetch("mobile", digits);
            }
          },
        }}
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
