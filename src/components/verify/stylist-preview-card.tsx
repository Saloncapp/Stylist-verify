"use client";

import Link from "next/link";
import { BadgeCheck, ExternalLink, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatOverallPerformanceRating } from "@/lib/performance-ratings";
import type { PublicStylistPreview } from "@/types";

const AUTH_HREF = "/login";

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
  const employmentLabel = `${preview.employmentCount} Employment History Found`;

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-success">
          <BadgeCheck className="size-5 shrink-0" />
          <p className="text-sm font-semibold">Stylist Record Found ✓</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            {preview.displayName}
          </h2>
          <div className="space-y-1.5 text-sm">
            <p className="text-muted-foreground">{preview.role}</p>
            <p>{preview.experienceLabel}</p>
            <p>{employmentLabel}</p>
            <p>
              Performance{" "}
              {performanceLabel ? (
                <span className="inline-flex items-center gap-1 font-medium">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {performanceLabel}
                </span>
              ) : (
                <span className="text-muted-foreground">No data available</span>
              )}
            </p>
          </div>
        </div>

        <Link
          href={AUTH_HREF}
          className="relative mt-1 block h-36 overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:h-40"
          aria-label="See full profile. Login or register to see more."
        >
          <div
            className="pointer-events-none select-none blur-[5px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_28%,black_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_28%,black_100%)]"
            aria-hidden="true"
          >
            <BlurredDetailsPlaceholder />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/75 to-transparent sm:h-28" />

          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 px-4 pb-3 text-center sm:pb-4">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
              <ExternalLink className="size-3.5" />
              See more
            </span>
            <span className="text-xs text-muted-foreground">
              Login or Register to see more
            </span>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
