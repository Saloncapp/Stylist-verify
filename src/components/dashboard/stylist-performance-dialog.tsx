"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarRatingInput } from "@/components/performance/star-rating-input";
import {
  performanceUpdateSchema,
  type PerformanceUpdateInput,
} from "@/lib/validations";
import { SPECIALIST_SERVICES } from "@/lib/employment-constants";
import {
  PERFORMANCE_RATING_CATEGORIES,
  calculateOverallPerformanceRating,
  formatOverallPerformanceRating,
} from "@/lib/performance-ratings";
import { hasPerformanceInfo } from "@/lib/performance-ratings";
import type { PerformanceRatingValue } from "@/lib/performance-ratings";
import type { StylistRecord } from "@/types";
import { toast } from "sonner";

interface StylistPerformanceDialogProps {
  stylist: StylistRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (stylist: StylistRecord) => void;
}

export function StylistPerformanceDialog({
  stylist,
  open,
  onOpenChange,
  onSaved,
}: StylistPerformanceDialogProps) {
  const router = useRouter();
  const [customService, setCustomService] = useState("");
  const isUpdate = hasPerformanceInfo(stylist);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PerformanceUpdateInput>({
    resolver: zodResolver(performanceUpdateSchema),
    defaultValues: {
      overallExperienceRating: stylist.overallExperienceRating ?? null,
      technicalSkillRating: stylist.technicalSkillRating ?? null,
      customerHandlingRating: stylist.customerHandlingRating ?? null,
      performanceSummary: stylist.performanceSummary ?? "",
      managerFeedback: stylist.managerFeedback ?? "",
      specialistServices: stylist.specialistServices ?? [],
    },
  });

  const specialistServices = watch("specialistServices") ?? [];
  const overallExperienceRating = watch("overallExperienceRating");
  const technicalSkillRating = watch("technicalSkillRating");
  const customerHandlingRating = watch("customerHandlingRating");

  const overallPerformanceRating = useMemo(
    () =>
      calculateOverallPerformanceRating({
        overallExperienceRating: overallExperienceRating ?? undefined,
        technicalSkillRating: technicalSkillRating ?? undefined,
        customerHandlingRating: customerHandlingRating ?? undefined,
      }),
    [overallExperienceRating, technicalSkillRating, customerHandlingRating]
  );

  useEffect(() => {
    if (open) {
      reset({
        overallExperienceRating: stylist.overallExperienceRating ?? null,
        technicalSkillRating: stylist.technicalSkillRating ?? null,
        customerHandlingRating: stylist.customerHandlingRating ?? null,
        performanceSummary: stylist.performanceSummary ?? "",
        managerFeedback: stylist.managerFeedback ?? "",
        specialistServices: stylist.specialistServices ?? [],
      });
      setCustomService("");
    }
  }, [open, stylist, reset]);

  function setRating(
    key:
      | "overallExperienceRating"
      | "technicalSkillRating"
      | "customerHandlingRating",
    value?: PerformanceRatingValue
  ) {
    setValue(key, value ?? null, { shouldValidate: true });
  }

  function toggleService(service: string) {
    const next = specialistServices.includes(service)
      ? specialistServices.filter((s) => s !== service)
      : [...specialistServices, service];
    setValue("specialistServices", next, { shouldValidate: true });
  }

  function addCustomService() {
    const trimmed = customService.trim();
    if (!trimmed) {
      toast.error("Enter a custom service name");
      return;
    }
    if (
      specialistServices.some((s) => s.toLowerCase() === trimmed.toLowerCase())
    ) {
      toast.error("This service is already added");
      return;
    }
    setValue("specialistServices", [...specialistServices, trimmed], {
      shouldValidate: true,
    });
    setCustomService("");
  }

  function removeService(service: string) {
    setValue(
      "specialistServices",
      specialistServices.filter((s) => s !== service),
      { shouldValidate: true }
    );
  }

  async function onSubmit(data: PerformanceUpdateInput) {
    try {
      const res = await fetch(`/api/stylists/${stylist.id}/performance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallExperienceRating: data.overallExperienceRating ?? null,
          technicalSkillRating: data.technicalSkillRating ?? null,
          customerHandlingRating: data.customerHandlingRating ?? null,
          performanceSummary: data.performanceSummary ?? "",
          managerFeedback: data.managerFeedback ?? "",
          specialistServices: data.specialistServices ?? [],
        }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to save performance information");
        return;
      }

      toast.success(
        isUpdate
          ? "Performance information updated"
          : "Performance information added"
      );

      const updated = result.data?.stylist as StylistRecord | undefined;
      if (updated) {
        onSaved?.(updated);
      } else {
        onOpenChange(false);
      }
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Update Performance" : "Add Performance"}
          </DialogTitle>
          <DialogDescription>
            Performance Information (Given by Salon) for {stylist.name}. This
            applies only to your salon&apos;s employment record.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Performance Ratings</p>
              {overallPerformanceRating != null ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  Overall:{" "}
                  {formatOverallPerformanceRating(overallPerformanceRating)}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Rate at least one category
                </span>
              )}
            </div>

            <div className="space-y-4">
              {PERFORMANCE_RATING_CATEGORIES.map(({ key, label }) => (
                <StarRatingInput
                  key={key}
                  id={`${stylist.id}-${key}`}
                  label={label}
                  value={
                    watch(key) != null
                      ? (watch(key) as PerformanceRatingValue)
                      : undefined
                  }
                  onChange={(value) => setRating(key, value)}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`perf-summary-${stylist.id}`}>
              Performance Summary
            </Label>
            <Textarea
              id={`perf-summary-${stylist.id}`}
              placeholder="Overall performance notes from the salon..."
              rows={3}
              {...register("performanceSummary")}
            />
            {errors.performanceSummary && (
              <p className="text-sm text-danger">
                {errors.performanceSummary.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Specialist Services</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIST_SERVICES.map((service) => {
                const selected = specialistServices.includes(service);
                return (
                  <Button
                    key={service}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    onClick={() => toggleService(service)}
                  >
                    {service}
                  </Button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                placeholder="Add custom service"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomService();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomService}
                className="shrink-0"
              >
                <Plus className="mr-1 size-4" />
                Add
              </Button>
            </div>

            {specialistServices.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {specialistServices.map((service) => (
                  <Badge
                    key={service}
                    variant="outline"
                    className="gap-1 pr-1 font-normal"
                  >
                    {service}
                    <button
                      type="button"
                      className="rounded-sm p-0.5 hover:bg-muted"
                      onClick={() => removeService(service)}
                      aria-label={`Remove ${service}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {errors.specialistServices && (
              <p className="text-sm text-danger">
                {errors.specialistServices.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {isUpdate ? "Update Performance" : "Add Performance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
