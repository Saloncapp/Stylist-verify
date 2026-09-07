import { Card, CardContent } from "@/components/ui/card";
import { ShimmerBlock } from "@/components/verify/shimmer-block";

/** Skeleton matching `StylistPreviewCard` layout to avoid CLS while verifying. */
export function StylistPreviewCardSkeleton() {
  return (
    <Card
      className="overflow-hidden shadow-sm"
      aria-busy="true"
      aria-label="Loading stylist record"
    >
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ShimmerBlock className="size-5 shrink-0 rounded-full" />
          <ShimmerBlock className="h-4 w-44" />
        </div>

        <div className="space-y-2">
          <ShimmerBlock className="h-8 w-48 sm:w-56" />
          <div className="space-y-1.5">
            <ShimmerBlock className="h-4 w-36" />
            <ShimmerBlock className="h-4 w-52" />
            <ShimmerBlock className="h-4 w-56" />
            <ShimmerBlock className="h-4 w-40" />
          </div>
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
      </CardContent>
    </Card>
  );
}
