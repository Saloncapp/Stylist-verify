"use client";

import type {
  EmploymentHistoryEntry,
  VerificationEmploymentEntry,
  VerificationEmploymentPrivateEntry,
} from "@/types";
import { ExternalLink } from "lucide-react";
import { formatEmploymentDuration } from "@/lib/employment-duration";
import { format } from "@/lib/date";
import {
  DEFAULT_EMPLOYMENT_TYPE,
  DEFAULT_STYLIST_ROLE,
} from "@/lib/employment-constants";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PerformanceRatingDisplay } from "@/components/performance/performance-rating-display";
import { cn } from "@/lib/utils";

type EmploymentEntry =
  | EmploymentHistoryEntry
  | VerificationEmploymentEntry
  | VerificationEmploymentPrivateEntry;

const NO_DATA = "No data available";

const EMPLOYMENT_HISTORY_TABS = [
  { value: "employment", label: "Employment" },
  { value: "performance", label: "Performance" },
  { value: "documents", label: "Documents" },
  { value: "exit", label: "Exit", inactiveOnly: true },
] as const;

function displayValue(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") {
    return NO_DATA;
  }
  return value;
}

function displayDate(value: string | null | undefined): string {
  if (!value) return NO_DATA;
  try {
    return format(value);
  } catch {
    return NO_DATA;
  }
}

function displayServices(services?: string[]): string | string[] {
  if (!services || services.length === 0) return NO_DATA;
  return services;
}

function DocumentLink({
  label,
  url,
}: {
  label: string;
  url?: string;
}) {
  if (!url) {
    return (
      <p>
        <span className="text-muted-foreground">{label}:</span> {NO_DATA}
      </p>
    );
  }

  return (
    <p>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
      >
        View document
        <ExternalLink className="size-3.5" />
      </a>
    </p>
  );
}

interface EmploymentHistoryDetailsProps {
  entry: EmploymentEntry;
  className?: string;
  /** Hide stylist name/mobile — shown once in the top profile */
  salonOnly?: boolean;
}

export function EmploymentHistoryDetails({
  entry,
  className,
  salonOnly = true,
}: EmploymentHistoryDetailsProps) {
  const role = entry.role ?? DEFAULT_STYLIST_ROLE;
  const employmentType = entry.employmentType ?? DEFAULT_EMPLOYMENT_TYPE;
  const isActive = entry.status === "Active";
  const duration = formatEmploymentDuration(
    entry.joiningDate,
    entry.leavingDate,
    entry.status
  );
  const services = displayServices(entry.specialistServices);
  const visibleTabs = EMPLOYMENT_HISTORY_TABS.filter(
    (tab) => !("inactiveOnly" in tab && tab.inactiveOnly) || !isActive
  );
  const tabCount = visibleTabs.length;

  return (
    <div className={className}>
      {!salonOnly && (
        <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {"stylistName" in entry && (
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              {displayValue(entry.stylistName)}
            </p>
          )}
          {"maskedMobile" in entry && (
            <p>
              <span className="text-muted-foreground">Mobile:</span>{" "}
              {displayValue(entry.maskedMobile)}
            </p>
          )}
          {"mobileNumber" in entry && !("maskedMobile" in entry) && (
            <p>
              <span className="text-muted-foreground">Mobile:</span>{" "}
              {displayValue(entry.mobileNumber)}
            </p>
          )}
        </div>
      )}

      <Tabs defaultValue="employment" className="mt-4">
        <TabsList
          className={cn(
            "grid h-auto min-h-10 w-full items-stretch gap-1 rounded-lg bg-muted p-1",
            "[&_[data-slot=tabs-trigger]]:flex [&_[data-slot=tabs-trigger]]:h-full [&_[data-slot=tabs-trigger]]:min-h-9 [&_[data-slot=tabs-trigger]]:w-full [&_[data-slot=tabs-trigger]]:items-center [&_[data-slot=tabs-trigger]]:justify-center [&_[data-slot=tabs-trigger]]:rounded-md [&_[data-slot=tabs-trigger]]:px-2 [&_[data-slot=tabs-trigger]]:py-2 [&_[data-slot=tabs-trigger]]:text-center [&_[data-slot=tabs-trigger]]:text-xs [&_[data-slot=tabs-trigger]]:leading-tight [&_[data-slot=tabs-trigger]]:whitespace-normal [&_[data-slot=tabs-trigger]]:group-data-vertical/tabs:justify-center sm:[&_[data-slot=tabs-trigger]]:px-3 sm:[&_[data-slot=tabs-trigger]]:text-sm [&_[data-slot=tabs-trigger]]:data-active:bg-background [&_[data-slot=tabs-trigger]]:data-active:shadow-sm",
            tabCount <= 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
          )}
        >
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="employment" className="mt-3 outline-none">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="grid gap-1 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Level:</span>{" "}
                {displayValue(entry.level)}
              </p>
              <p>
                <span className="text-muted-foreground">Role / Position:</span>{" "}
                {displayValue(role)}
              </p>
              <p>
                <span className="text-muted-foreground">Employment Type:</span>{" "}
                {displayValue(employmentType)}
              </p>
              <p>
                <span className="text-muted-foreground">Joining Date:</span>{" "}
                {displayDate(entry.joiningDate)}
              </p>
              <p>
                <span className="text-muted-foreground">Relieving Date:</span>{" "}
                {isActive ? (
                  <span className="font-medium text-success">Present</span>
                ) : (
                  displayDate(entry.leavingDate)
                )}
              </p>
              <p>
                <span className="text-muted-foreground">Duration:</span>{" "}
                {displayValue(duration)}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-3 outline-none">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="space-y-3 text-sm">
              <PerformanceRatingDisplay ratings={entry} />
              <p>
                <span className="text-muted-foreground">Performance Summary:</span>{" "}
                {displayValue(entry.performanceSummary)}
              </p>
              <div>
                <span className="text-muted-foreground">Specialist Services:</span>{" "}
                {typeof services === "string" ? (
                  <span>{services}</span>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {services.map((service) => (
                      <Badge
                        key={service}
                        variant="outline"
                        className="font-normal"
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-3 outline-none">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="space-y-2 text-sm">
              <DocumentLink
                label="Experience Certificate"
                url={entry.experienceCertificateUrl}
              />
              <DocumentLink
                label="Relieving Letter"
                url={entry.relievingLetterUrl}
              />
            </div>
          </div>
        </TabsContent>

        {!isActive && (
          <TabsContent value="exit" className="mt-3 outline-none">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm">
                <span className="text-muted-foreground">Reason for Leaving:</span>{" "}
                {displayValue(entry.remark)}
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
