import { Star } from "lucide-react";
import {
  PERFORMANCE_RATING_CATEGORIES,
  calculateOverallPerformanceRating,
  formatOverallPerformanceRating,
  hasPerformanceRatings,
  type PerformanceRatingFields,
} from "@/lib/performance-ratings";
import { cn } from "@/lib/utils";

const NO_DATA = "No data available";

interface PerformanceRatingDisplayProps {
  ratings: PerformanceRatingFields;
  className?: string;
  compact?: boolean;
}

function StarRow({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const starSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => {
        const starNumber = index + 1;
        const filled = rating >= starNumber - 0.25;

        return (
          <Star
            key={starNumber}
            className={cn(
              starSize,
              filled
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            )}
          />
        );
      })}
    </div>
  );
}

export function PerformanceRatingBadge({
  ratings,
  className,
}: {
  ratings: PerformanceRatingFields;
  className?: string;
}) {
  if (!hasPerformanceRatings(ratings)) return null;

  const overall =
    ratings.overallPerformanceRating ??
    calculateOverallPerformanceRating(ratings);

  if (overall == null) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900",
        className
      )}
      title="Overall performance rating for this salon employment"
    >
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span>{overall.toFixed(1)} / 5</span>
    </div>
  );
}

export function PerformanceRatingDisplay({
  ratings,
  className,
  compact = false,
}: PerformanceRatingDisplayProps) {
  if (!hasPerformanceRatings(ratings)) {
    return compact ? null : (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {NO_DATA}
      </p>
    );
  }

  const overall =
    ratings.overallPerformanceRating ??
    calculateOverallPerformanceRating(ratings);
  const overallLabel = formatOverallPerformanceRating(overall);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <PerformanceRatingBadge ratings={ratings} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {overallLabel ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-amber-900/70">
              Overall Performance Rating
            </p>
            <div className="mt-1 flex items-center gap-2">
              <StarRow rating={overall ?? 0} size="md" />
              <span className="text-sm font-semibold text-amber-950">
                {overallLabel}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-3">
        {PERFORMANCE_RATING_CATEGORIES.map(({ key, label }) => {
          const value = ratings[key];
          return (
            <div
              key={key}
              className="rounded-lg border border-border bg-background/80 px-3 py-2"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="mt-1 flex items-center gap-2">
                <StarRow rating={value ?? 0} />
                <span className="text-sm font-medium">
                  {value ? `${value} / 5` : NO_DATA}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
