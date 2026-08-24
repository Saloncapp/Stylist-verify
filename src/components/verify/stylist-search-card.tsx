"use client";

import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StylistSearchType = "aadhaar" | "mobile";

interface StylistSearchCardProps {
  searchType: StylistSearchType;
  onSearchTypeChange: (type: StylistSearchType) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  aadhaarInputProps: React.ComponentProps<"input">;
  mobileInputProps: React.ComponentProps<"input">;
  aadhaarError?: string;
  mobileError?: string;
  idPrefix?: string;
  submitLabel?: string;
  className?: string;
}

const SEARCH_TABS = [
  {
    value: "aadhaar" as const,
    label: "Aadhaar",
    hint: "Recommended",
  },
  {
    value: "mobile" as const,
    label: "Mobile Number",
    hint: "Optional",
  },
] as const;

export function StylistSearchCard({
  searchType,
  onSearchTypeChange,
  onSubmit,
  isSubmitting,
  aadhaarInputProps,
  mobileInputProps,
  aadhaarError,
  mobileError,
  idPrefix = "",
  submitLabel = "Verify",
  className,
}: StylistSearchCardProps) {
  const aadhaarId = `${idPrefix}aadhaarNumber`;
  const mobileId = `${idPrefix}mobileNumber`;
  const activeError =
    searchType === "aadhaar" ? aadhaarError : mobileError;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-2xl border border-primary/40 bg-primary/[0.04] py-0 shadow-sm",
        className
      )}
    >
      <CardHeader className="border-b border-primary/25 bg-primary/10 px-6 py-5 sm:px-7 sm:py-6">
        <CardTitle className="text-center text-xl font-semibold tracking-tight text-primary">
          Search stylist records
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 bg-card/80 px-6 py-6 sm:px-7 sm:py-7">
        <form onSubmit={onSubmit} className="space-y-4">
          <div
            className="grid grid-cols-2 gap-1 rounded-lg border border-primary/20 bg-primary/5 p-1"
            role="tablist"
            aria-label="Search method"
          >
            {SEARCH_TABS.map((opt) => {
              const selected = searchType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={cn(
                    "rounded-md px-2.5 py-2 text-left transition-colors sm:px-3",
                    selected
                      ? "bg-background text-foreground shadow-sm ring-1 ring-primary/25"
                      : "text-muted-foreground hover:text-primary"
                  )}
                  onClick={() => onSearchTypeChange(opt.value)}
                >
                  <span className="block text-sm font-medium leading-tight">
                    {opt.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[0.65rem] leading-tight",
                      selected ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {opt.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor={searchType === "aadhaar" ? aadhaarId : mobileId}
              className="text-primary"
            >
              {searchType === "aadhaar" ? (
                <>
                  Aadhaar Number{" "}
                  <span className="font-normal text-primary/70">
                    (recommended)
                  </span>
                </>
              ) : (
                "Mobile Number (Optional)"
              )}
            </Label>

            {/* Merged input + Verify button */}
            <div
              className={cn(
                "flex h-11 min-w-0 items-stretch overflow-hidden rounded-lg border border-primary/40 bg-transparent transition-colors",
                "focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/25"
              )}
            >
              {/* Keep both fields mounted so values persist when switching. */}
              <Input
                id={aadhaarId}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={12}
                placeholder="12-digit Aadhaar"
                aria-describedby={`${aadhaarId}-help`}
                {...aadhaarInputProps}
                className={cn(
                  "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:border-0 focus-visible:ring-0",
                  searchType !== "aadhaar" && "hidden",
                  aadhaarInputProps.className
                )}
              />
              <Input
                id={mobileId}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                placeholder="10-digit mobile"
                aria-describedby={`${mobileId}-warning`}
                {...mobileInputProps}
                className={cn(
                  "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:border-0 focus-visible:ring-0",
                  searchType !== "mobile" && "hidden",
                  mobileInputProps.className
                )}
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-full shrink-0 rounded-none border-0 border-l border-primary/30 px-4 shadow-none sm:min-w-[7.5rem]"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Search className="mr-2 size-4" />
                    {submitLabel}
                  </>
                )}
              </Button>
            </div>

            {activeError ? (
              <p className="text-sm text-destructive" role="alert">
                {activeError}
              </p>
            ) : null}

            {searchType === "aadhaar" ? (
              <p
                id={`${aadhaarId}-help`}
                className="text-xs font-medium text-success"
              >
                Best for an exact stylist match.
              </p>
            ) : (
              <p
                id={`${mobileId}-warning`}
                className="flex items-start gap-1.5 text-xs font-medium leading-relaxed text-warning"
                role="note"
              >
                <span aria-hidden="true" className="shrink-0">
                  ⚠
                </span>
                <span>
                  Mobile numbers may not be unique to a stylist. For an exact
                  match, use the stylist&apos;s Aadhaar number.
                </span>
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
