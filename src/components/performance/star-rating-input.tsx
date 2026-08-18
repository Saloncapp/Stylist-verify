"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PerformanceRatingValue } from "@/lib/performance-ratings";

interface StarRatingInputProps {
  id: string;
  label: string;
  value?: PerformanceRatingValue;
  onChange: (value?: PerformanceRatingValue) => void;
  disabled?: boolean;
}

export function StarRatingInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
}: StarRatingInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-xs text-muted-foreground">
          {value ? `${value} / 5` : "Not rated"}
        </span>
      </div>
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label={label}
      >
        {([1, 2, 3, 4, 5] as const).map((rating) => {
          const selected = value != null && rating <= value;

          return (
            <button
              key={rating}
              id={`${id}-${rating}`}
              type="button"
              role="radio"
              aria-checked={value === rating}
              aria-label={`${label}: ${rating} star${rating === 1 ? "" : "s"}`}
              disabled={disabled}
              onClick={() => onChange(value === rating ? undefined : rating)}
              className={cn(
                "rounded-md p-1 transition-colors",
                "hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50",
                selected ? "text-amber-500" : "text-muted-foreground/40"
              )}
            >
              <Star
                className={cn("size-5", selected && "fill-current")}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
