import { Card, CardContent } from "@/components/ui/card";
import { ShimmerBlock } from "@/components/verify/shimmer-block";

/** Skeleton matching `VerifiedStylistView` while private verify loads. */
export function VerifiedStylistViewSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Loading stylist profile"
    >
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <ShimmerBlock className="mx-auto size-24 shrink-0 rounded-2xl sm:mx-0 sm:size-28" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <ShimmerBlock className="h-8 w-44" />
                  <ShimmerBlock className="size-5 rounded-full" />
                  <ShimmerBlock className="h-6 w-20 rounded-full" />
                </div>
                <ShimmerBlock className="h-4 w-36" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ShimmerBlock className="h-4 w-40" />
                <ShimmerBlock className="h-4 w-44" />
                <ShimmerBlock className="h-4 w-48" />
                <ShimmerBlock className="h-4 w-36" />
                <ShimmerBlock className="h-4 w-52" />
                <ShimmerBlock className="h-4 w-48" />
              </div>

              <ShimmerBlock className="mt-4 h-4 w-full max-w-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <ShimmerBlock className="h-5 w-40" />
          <ShimmerBlock className="h-4 w-20" />
        </div>

        <Card className="overflow-hidden border-l-4 border-l-muted-foreground/30 shadow-sm">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ShimmerBlock className="size-10 shrink-0 rounded-xl" />
                <div className="space-y-2">
                  <ShimmerBlock className="h-4 w-36" />
                  <ShimmerBlock className="h-3 w-24" />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <ShimmerBlock className="h-6 w-14 rounded-full" />
                <ShimmerBlock className="h-6 w-20 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <ShimmerBlock className="h-3.5 w-full" />
              <ShimmerBlock className="h-3.5 w-[88%]" />
              <ShimmerBlock className="h-3.5 w-[66%]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
