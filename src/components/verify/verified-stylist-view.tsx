"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Check,
  Copy,
} from "lucide-react";
import { StylistAvatar } from "@/components/stylist-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmploymentSalonHeader } from "@/components/employment-salon-header";
import { EmploymentHistoryDetails } from "@/components/employment-history-details";
import { PerformanceRatingBadge } from "@/components/performance/performance-rating-display";
import {
  formatMobileDisplay,
} from "@/components/verify/profile-detail-field";
import { formatTotalExperience } from "@/lib/employment-duration";
import {
  calculateCareerPerformanceRating,
  formatOverallPerformanceRating,
} from "@/lib/performance-ratings";
import type {
  StylistStatus,
  VerificationEmploymentEntry,
  VerificationEmploymentPrivateEntry,
} from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type VerificationEmployment =
  | VerificationEmploymentEntry
  | VerificationEmploymentPrivateEntry;

export interface VerifiedStylistViewProps {
  name: string;
  employeeId?: string;
  photoUrl?: string;
  status?: StylistStatus;
  mobile: string;
  aadhaar: string;
  address?: string;
  employmentHistory: VerificationEmployment[];
}

function groupEmploymentBySalon(
  entries: VerificationEmployment[]
): VerificationEmployment[][] {
  const groups = new Map<string, VerificationEmployment[]>();

  for (const entry of entries) {
    const key = entry.salonId || entry.salonName;
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }

  return Array.from(groups.values()).map((group) => {
    const sorted = [...group].sort(
      (a, b) =>
        new Date(b.joiningDate ?? b.updatedAt).getTime() -
        new Date(a.joiningDate ?? a.updatedAt).getTime()
    );
    const active = sorted.find((entry) => entry.status === "Active");
    if (!active) return sorted;
    return [active, ...sorted.filter((entry) => entry !== active)];
  });
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value.replace(/\s/g, ""));
      setCopied(true);
      toast.success(`${label} copied`);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check className="size-3.5 text-success" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
    </Button>
  );
}

export function VerifiedStylistView({
  name,
  employeeId,
  photoUrl,
  status,
  mobile,
  aadhaar,
  address,
  employmentHistory,
}: VerifiedStylistViewProps) {
  const salonGroups = groupEmploymentBySalon(employmentHistory);
  const salonRecords = salonGroups.map((group) => group[0]);
  const totalExperience = formatTotalExperience(salonRecords);
  const overallPerformance = calculateCareerPerformanceRating(salonRecords);
  const overallPerformanceLabel =
    formatOverallPerformanceRating(overallPerformance) ?? "No data available";
  const recordCount = salonGroups.length;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <StylistAvatar
              name={name}
              photoUrl={photoUrl}
              size="xl"
              variant="profile"
              className="mx-auto sm:mx-0"
              alt={name}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h2 className="text-2xl font-bold tracking-tight">{name}</h2>
                  <BadgeCheck className="size-5 text-success" />
                  <StatusBadge
                    status={status}
                    className="uppercase tracking-wide"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Verified stylist profile
                </p>
              </div>

              <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                {employeeId ? (
                  <p>
                    <span className="text-muted-foreground">Employee ID:</span>{" "}
                    {employeeId}
                  </p>
                ) : null}
                <p className="flex items-center gap-2">
                  <span>
                    <span className="text-muted-foreground">Mobile:</span>{" "}
                    {formatMobileDisplay(mobile)}
                  </span>
                  <CopyButton value={mobile} label="Mobile number" />
                </p>
                <p>
                  <span className="text-muted-foreground">Aadhaar:</span> {aadhaar}
                </p>
                <p>
                  <span className="text-muted-foreground">Current Status:</span>{" "}
                  {status ?? "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Overall Experience:</span>{" "}
                  {totalExperience || "No data available"}
                </p>
                <p>
                  <span className="text-muted-foreground">Overall Performance:</span>{" "}
                  {overallPerformanceLabel}
                </p>
              </div>

              {address ? (
                <p className="mt-4 text-sm text-muted-foreground">{address}</p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {salonGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">Employment History</h3>
            <span className="text-sm text-muted-foreground">
              {recordCount} record{recordCount === 1 ? "" : "s"}
            </span>
          </div>

          {salonGroups.map((group) => {
            const latest = group[0];
            const isActive = latest.status === "Active";

            return (
              <Card
                key={latest.salonId}
                className={cn(
                  "overflow-hidden border-l-4 shadow-sm",
                  isActive ? "border-l-success" : "border-l-muted-foreground/30"
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <EmploymentSalonHeader entry={latest} className="min-w-0 flex-1" />
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <PerformanceRatingBadge ratings={latest} />
                      <StatusBadge
                        status={latest.status}
                        className="uppercase tracking-wide"
                      />
                    </div>
                  </div>

                  <EmploymentHistoryDetails entry={latest} salonOnly />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
