"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VerifiedStylistView } from "@/components/verify/verified-stylist-view";
import { StylistPreviewCard } from "@/components/verify/stylist-preview-card";
import { StylistUnavailableDialog } from "@/components/verify/stylist-unavailable-dialog";
import {
  StylistSearchCard,
  type StylistSearchType,
} from "@/components/verify/stylist-search-card";
import { verifyFormSchema, type VerifyFormInput } from "@/lib/validations";
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
      employeeId={stylist.employeeId}
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
  const [unavailableOpen, setUnavailableOpen] = useState(false);

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

  async function onSubmit(data: VerifyFormInput) {
    try {
      const payload =
        data.searchType === "aadhaar"
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
  }

  const previews = result?.previews ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <StylistSearchCard
        searchType={searchType}
        onSearchTypeChange={handleSearchTypeChange}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        aadhaarError={errors.aadhaarNumber?.message}
        mobileError={errors.mobileNumber?.message}
        aadhaarInputProps={register("aadhaarNumber", {
          onChange: (e) => handleDigitInput(e, 12),
        })}
        mobileInputProps={register("mobileNumber", {
          onChange: (e) => handleDigitInput(e, 10),
        })}
      />

      <StylistUnavailableDialog
        open={unavailableOpen}
        onOpenChange={setUnavailableOpen}
      />

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
                {previews.length} stylist records were found. Continue with
                Mobile on the home page to view full details.
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
