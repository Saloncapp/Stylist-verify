import { Card, CardContent } from "@/components/ui/card";
import { ShimmerBlock } from "@/components/verify/shimmer-block";

/** Skeleton matching `StylistPreviewCard` layout to avoid CLS while verifying. */
export function StylistPreviewCardSkeleton() {
  return (
    <Card
      className="overflow-hidden border-[#0F6B5F]/20 shadow-sm"
      aria-busy="true"
      aria-label="Loading stylist record"
    >
      <CardContent className="space-y-0 p-0">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <ShimmerBlock className="h-4 w-44" />
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            <ShimmerBlock className="h-8 w-32 sm:w-40" />
            <ShimmerBlock className="h-5 w-28 rounded-full" />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="min-w-0 rounded-xl border border-border/70 bg-[#F4F8F7] px-3 py-3 dark:bg-card sm:px-3.5"
              >
                <ShimmerBlock className="h-3 w-16" />
                <ShimmerBlock className="mt-1.5 h-4 w-full" />
              </div>
            ))}
          </div>

          <div className="relative mt-1 h-36 overflow-hidden rounded-xl sm:h-40">
            <div className="space-y-3 p-1">
              <div className="flex items-center justify-between gap-3">
                <ShimmerBlock className="h-5 w-40" />
                <ShimmerBlock className="h-4 w-16" />
              </div>
              <div className="overflow-hidden rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ShimmerBlock className="size-10 rounded-xl" />
                    <div className="space-y-2">
                      <ShimmerBlock className="h-3.5 w-28" />
                      <ShimmerBlock className="h-4 w-16 rounded-full" />
                    </div>
                  </div>
                  <ShimmerBlock className="h-5 w-16 rounded-full" />
                </div>
                <ShimmerBlock className="mt-3 h-8 w-full rounded-lg" />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card via-card/75 to-transparent sm:h-28" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 px-4 pb-3 sm:pb-4">
              <ShimmerBlock className="h-4 w-20" />
              <ShimmerBlock className="h-3 w-44" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
