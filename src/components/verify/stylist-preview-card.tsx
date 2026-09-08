"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  Building2,
  Clock3,
  ExternalLink,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatOverallPerformanceRating } from "@/lib/performance-ratings";
import { cn } from "@/lib/utils";
import type { PublicStylistPreview } from "@/types";

const AUTH_HREF = "/#continue-with-mobile";

function FactTile({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-[#F4F8F7] px-3 py-3 dark:bg-card sm:px-3.5">
      <div className="flex items-center gap-1.5 text-[#0F6B5F]">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-[#0F6B5F]/80 sm:text-[0.7rem]">
          {label}
        </p>
      </div>
      <div
        className={cn(
          "mt-1.5 text-xs font-semibold leading-snug text-foreground sm:text-sm",
          muted && "font-medium text-muted-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function BlurredDetailsPlaceholder() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-semibold">Employment History</p>
        <span className="text-sm text-muted-foreground">Records</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border border-l-4 border-l-muted-foreground/20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-muted" />
            <div className="space-y-2">
              <div className="h-3.5 w-28 rounded bg-muted" />
              <div className="h-4 w-16 rounded-full bg-muted" />
            </div>
          </div>
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
        <div className="mt-3 grid h-8 grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          <div className="rounded-md bg-background" />
          <div className="rounded-md bg-transparent" />
          <div className="rounded-md bg-transparent" />
        </div>
      </div>
    </div>
  );
}

export function StylistPreviewCard({
  preview,
}: {
  preview: PublicStylistPreview;
}) {
  const performanceLabel = formatOverallPerformanceRating(
    preview.performanceRating
  );
  const employmentCount = preview.employmentCount;
  const employmentValue =
    employmentCount === 1
      ? "1 employment record found"
      : `${employmentCount} employment records found`;
  const experienceValue = preview.experienceLabel.replace(
    /\s+Experience$/i,
    ""
  );

  return (
    <Card className="overflow-hidden border-[#0F6B5F]/20 shadow-sm">
      <CardContent className="space-y-0 p-0">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <p className="text-sm font-semibold text-[#0F6B5F]">
            Stylist Record Found ✓
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2 className="truncate text-2xl font-bold tracking-tight text-[#0B2F2A] dark:text-foreground">
              {preview.displayName}
            </h2>
            <p className="inline-flex rounded-full border border-[#B5945F]/35 bg-[#B5945F]/15 px-2.5 py-0.5 text-xs font-medium text-[#0B2F2A] dark:text-[#B5945F]">
              {preview.role}
            </p>
          </div>

          <div
            className="grid grid-cols-3 gap-2 sm:gap-2.5"
            aria-label="Stylist summary"
          >
            <FactTile
              icon={Clock3}
              label="Experience"
              value={experienceValue}
            />
            <FactTile
              icon={Building2}
              label="Employment history"
              value={employmentValue}
            />
            <FactTile
              icon={Star}
              label="Performance"
              muted={!performanceLabel}
              value={
                performanceLabel ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 fill-amber-400 text-amber-400 sm:size-3.5" />
                    {performanceLabel}
                  </span>
                ) : (
                  "No data available"
                )
              }
            />
          </div>

          <Link
            href={AUTH_HREF}
            className="relative mt-1 block h-36 overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:h-40"
            aria-label="See full profile. Continue with Mobile to see more."
          >
            <div
              className="pointer-events-none select-none blur-[5px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_28%,black_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_28%,black_100%)]"
              aria-hidden="true"
            >
              <BlurredDetailsPlaceholder />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/75 to-transparent sm:h-28" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 px-4 pb-3 text-center sm:pb-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80">
                <ExternalLink className="size-3.5" />
                See more
              </span>
              <span className="text-xs text-muted-foreground">
                Continue with Mobile to see more
              </span>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
