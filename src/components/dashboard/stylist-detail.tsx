"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Loader2 } from "lucide-react";
import { StylistAvatar } from "@/components/stylist-avatar";
import { LinkButton } from "@/components/link-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmploymentSalonHeader } from "@/components/employment-salon-header";
import { EmploymentHistoryDetails } from "@/components/employment-history-details";
import { PerformanceRatingBadge } from "@/components/performance/performance-rating-display";
import { statusUpdateSchema, type StatusUpdateInput } from "@/lib/validations";
import { formatEmploymentDuration } from "@/lib/employment-duration";
import type { StylistRecord } from "@/types";
import { toast } from "sonner";
import { format } from "@/lib/date";

export function StylistDetail({ stylist }: { stylist: StylistRecord }) {
  const router = useRouter();
  const [showUpdate, setShowUpdate] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StatusUpdateInput>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { status: stylist.status },
  });

  const newStatus = watch("status");
  const experienceRecords = [...stylist.employmentHistory].reverse();

  async function onSubmit(data: StatusUpdateInput) {
    try {
      const res = await fetch(`/api/stylists/${stylist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to update status");
        return;
      }

      toast.success("Status updated successfully");
      setShowUpdate(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
      <Card className="shadow-sm lg:sticky lg:top-[5.5rem] lg:self-start">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-1.5">
            <LinkButton
              href="/dashboard/stylists"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Back to stylists"
            >
              <ChevronLeft className="size-5" />
            </LinkButton>
            Stylist Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start lg:flex-col lg:items-center">
            <StylistAvatar
              name={stylist.name}
              photoUrl={stylist.photoUrl}
              size="2xl"
              className="rounded-2xl"
              alt={stylist.name}
            />
            <div className="min-w-0 w-full text-center sm:text-left lg:text-center">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-start lg:flex-col lg:items-center">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  {stylist.name}
                </h1>
                <StatusBadge status={stylist.status} />
              </div>
              <div className="mt-4 border-b border-border" />
            </div>
          </div>

          <div className="grid gap-2 text-sm">
            {stylist.employeeId ? (
              <p>
                <span className="text-muted-foreground">Employee ID:</span>{" "}
                {stylist.employeeId}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Mobile:</span>{" "}
              {stylist.mobileNumber}
            </p>
            <p>
              <span className="text-muted-foreground">Level:</span>{" "}
              {stylist.level}
            </p>
            <p>
              <span className="text-muted-foreground">Role / Position:</span>{" "}
              {stylist.role}
            </p>
            <p>
              <span className="text-muted-foreground">Employment Type:</span>{" "}
              {stylist.employmentType}
            </p>
            <p>
              <span className="text-muted-foreground">Duration:</span>{" "}
              {formatEmploymentDuration(
                stylist.joiningDate,
                stylist.leavingDate,
                stylist.status
              ) || "No data available"}
            </p>
            <p>
              <span className="text-muted-foreground">Aadhaar:</span>{" "}
              {stylist.aadhaarMasked}
            </p>
            <p>
              <span className="text-muted-foreground">Joined:</span>{" "}
              {format(stylist.joiningDate)}
            </p>
            {stylist.address ? (
              <p>
                <span className="text-muted-foreground">Address:</span>{" "}
                {stylist.address}
              </p>
            ) : null}
          </div>

          <div className="border-t border-border pt-4">
            {!showUpdate ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowUpdate(true)}
              >
                Update Status
              </Button>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Status</Label>
                  <Select
                    defaultValue={stylist.status}
                    onValueChange={(v) =>
                      setValue("status", v as StatusUpdateInput["status"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Relieved">Relieved</SelectItem>
                      <SelectItem value="Abscond">Abscond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newStatus === "Relieved" || newStatus === "Abscond") && (
                  <div className="space-y-2">
                    <Label htmlFor="remark">Remark</Label>
                    <Textarea
                      id="remark"
                      placeholder="Describe the reason..."
                      rows={3}
                      {...register("remark")}
                    />
                    {errors.remark && (
                      <p className="text-sm text-danger">{errors.remark.message}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="submit" disabled={isSubmitting} className="sm:flex-1">
                    {isSubmitting && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="sm:flex-1"
                    onClick={() => setShowUpdate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-col shadow-sm lg:col-span-2 lg:max-h-[calc(100dvh-6.5rem)]">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Experience</CardTitle>
          <span className="text-sm text-muted-foreground">
            {experienceRecords.length} record
            {experienceRecords.length === 1 ? "" : "s"}
          </span>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {experienceRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No experience recorded yet.
            </p>
          ) : (
            <div className="space-y-4 pb-1">
              {experienceRecords.map((entry, index) => {
                const isActive = entry.status === "Active";
                return (
                  <div
                    key={`${entry.updatedAt}-${index}`}
                    className={`rounded-xl border border-border border-l-4 p-4 ${
                      isActive
                        ? "border-l-success"
                        : "border-l-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <EmploymentSalonHeader
                        entry={entry}
                        className="min-w-0 flex-1"
                      />
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <PerformanceRatingBadge ratings={entry} />
                        <StatusBadge status={entry.status} />
                      </div>
                    </div>
                    <EmploymentHistoryDetails entry={entry} salonOnly />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
