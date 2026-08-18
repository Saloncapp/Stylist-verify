"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VerifiedStylistView } from "@/components/verify/verified-stylist-view";
import { StylistPreviewCard } from "@/components/verify/stylist-preview-card";
import {
  StylistSearchCard,
  type StylistSearchType,
} from "@/components/verify/stylist-search-card";
import { verifySchema, type VerifyInput } from "@/lib/validations";
import { handleDigitInput } from "@/lib/digit-input";
import type { PublicStylistPreview, VerifiedStylistResult } from "@/types";
import { toast } from "sonner";

interface VerifyResult {
  found: boolean;
  locked?: boolean;
  count?: number;
  stylists: VerifiedStylistResult[];
  previews?: PublicStylistPreview[];
  multiple?: boolean;
}

function StylistResultCard({ stylist }: { stylist: VerifiedStylistResult }) {
  return (
    <VerifiedStylistView
      name={stylist.name}
      photoUrl={stylist.photoUrl}
      status={stylist.status}
      mobile={stylist.maskedMobile}
      aadhaar={stylist.maskedAadhaar}
      employmentHistory={stylist.employmentHistory}
    />
  );
}

export function VerifyForm() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchType, setSearchType] = useState<StylistSearchType>("mobile");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
  });

  const aadhaarValue = watch("aadhaarNumber") ?? "";
  const mobileValue = watch("mobileNumber") ?? "";
  const inputLength =
    searchType === "aadhaar" ? aadhaarValue.length : mobileValue.length;
  const errorMessage =
    searchType === "aadhaar"
      ? errors.aadhaarNumber?.message
      : errors.mobileNumber?.message;

  async function onSubmit(data: VerifyInput) {
    try {
      const payload =
        searchType === "aadhaar"
          ? { aadhaarNumber: data.aadhaarNumber }
          : { mobileNumber: data.mobileNumber };

      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await res.json();

      if (!response.success) {
        toast.error(response.message || "Verification failed");
        return;
      }

      setResult(response.data);
      setSearched(true);
    } catch {
      toast.error("Something went wrong");
    }
  }

  function handleSearchTypeChange(value: StylistSearchType) {
    setSearchType(value);
    reset();
    setResult(null);
    setSearched(false);
  }

  const previews = result?.previews ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <StylistSearchCard
        searchType={searchType}
        onSearchTypeChange={handleSearchTypeChange}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        inputLength={inputLength}
        errorMessage={errorMessage}
        inputProps={
          searchType === "aadhaar"
            ? register("aadhaarNumber", {
                onChange: (e) => handleDigitInput(e, 12),
              })
            : register("mobileNumber", {
                onChange: (e) => handleDigitInput(e, 10),
              })
        }
      />

      {searched && result && !result.found && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert>
            <AlertDescription className="text-center text-base">
              No stylist record found.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {searched && result?.found && result.locked && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {previews.length > 1 && (
            <Alert>
              <Users className="size-4" />
              <AlertDescription>
                {previews.length} stylist records were found. Login or register
                to view full details.
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

      {searched &&
        result?.found &&
        !result.locked &&
        result.stylists.length > 0 && (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {result.multiple && (
              <Alert>
                <Users className="size-4" />
                <AlertDescription>
                  {result.stylists.length} stylists found with this mobile
                  number. Review each record below.
                </AlertDescription>
              </Alert>
            )}

            {result.stylists.map((stylist, index) => (
              <StylistResultCard
                key={`${stylist.maskedAadhaar}-${index}`}
                stylist={stylist}
              />
            ))}
          </motion.div>
        )}
    </div>
  );
}
