"use client";

import { CreditCard, Loader2, Search, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type StylistSearchType = "aadhaar" | "mobile";

interface StylistSearchCardProps {
  searchType: StylistSearchType;
  onSearchTypeChange: (type: StylistSearchType) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  inputLength: number;
  errorMessage?: string;
  inputProps: React.ComponentProps<"input">;
  idPrefix?: string;
  submitLabel?: string;
  className?: string;
}

const SEARCH_OPTIONS = [
  {
    value: "mobile" as const,
    label: "Mobile",
    icon: Smartphone,
    placeholder: "98XXX XXXXX",
    maxLength: 10,
    helperText:
      "Multiple stylists may share the same mobile number — all matching records will be shown.",
  },
  {
    value: "aadhaar" as const,
    label: "Aadhaar",
    icon: CreditCard,
    placeholder: "XXXX XXXX XXXX",
    maxLength: 12,
    helperText:
      "Returns all salon employment records linked to this Aadhaar number.",
  },
] as const;

export function StylistSearchCard({
  searchType,
  onSearchTypeChange,
  onSubmit,
  isSubmitting,
  inputLength,
  errorMessage,
  inputProps,
  idPrefix = "",
  submitLabel = "Verify",
  className,
}: StylistSearchCardProps) {
  const activeOption =
    SEARCH_OPTIONS.find((option) => option.value === searchType) ??
    SEARCH_OPTIONS[0];
  const ActiveIcon = activeOption.icon;
  const inputId =
    searchType === "aadhaar"
      ? `${idPrefix}aadhaarNumber`
      : `${idPrefix}mobileNumber`;
  const isComplete = inputLength >= activeOption.maxLength;
  const counterClass = isComplete ? "text-success" : "text-danger";

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Search stylist records
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter an Aadhaar or Mobile number to view full employment history.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={inputId} className="text-sm font-medium">
              Search by
            </Label>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-input bg-background">
                <Select
                  value={searchType}
                  onValueChange={(value) =>
                    onSearchTypeChange(value as StylistSearchType)
                  }
                >
                  <SelectTrigger
                    className="h-11 w-[9.25rem] shrink-0 items-center justify-between rounded-none border-0 border-r border-input bg-muted/40 px-3 shadow-none focus-visible:ring-0"
                    aria-label={`Search by ${activeOption.label}`}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2 text-primary">
                      <ActiveIcon className="size-4 shrink-0" />
                      <span className="truncate text-sm font-medium">
                        {activeOption.label}
                      </span>
                    </span>
                  </SelectTrigger>
                  <SelectContent align="start" className="min-w-[9.25rem]">
                    {SEARCH_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="items-center py-2"
                        >
                          <Icon className="size-4 shrink-0 text-primary" />
                          <span className="text-primary">{option.label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Input
                  id={inputId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={activeOption.maxLength}
                  placeholder={activeOption.placeholder}
                  className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
                  {...inputProps}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full shrink-0 px-5 sm:w-auto sm:min-w-[7.5rem]"
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
          </div>

          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
              {activeOption.helperText}
            </p>
            <p className={cn("shrink-0 text-xs tabular-nums", counterClass)}>
              {inputLength} / {activeOption.maxLength}
            </p>
          </div>

          {errorMessage ? (
            <p className="text-sm text-danger">{errorMessage}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
