"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2, MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { HiringJobCard } from "@/types";
import { toast } from "sonner";

interface JobCardProps {
  job: HiringJobCard;
  onApplied?: (jobId: string) => void;
  showSalonActions?: boolean;
  onCloseJob?: (jobId: string) => void;
  onReopenJob?: (jobId: string) => void;
}

export function JobCard({
  job,
  onApplied,
  showSalonActions,
  onCloseJob,
  onReopenJob,
}: JobCardProps) {
  const [applying, setApplying] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleApply() {
    if (job.applied || applying) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/apply`, { method: "POST" });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Could not apply");
        return;
      }
      onApplied?.(job.id);
      toast.success("Interest sent — the salon can see your application");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setApplying(false);
    }
  }

  async function handleStatus(next: "open" | "closed") {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Could not update job");
        return;
      }
      if (next === "closed") onCloseJob?.(job.id);
      else onReopenJob?.(job.id);
      toast.success(next === "closed" ? "Position closed" : "Position reopened");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full border-l-4 border-l-[#2563EB] shadow-sm">
        <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
              {job.salonLogoUrl ? (
                <Image
                  src={job.salonLogoUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <Building2 className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[#2563EB]">
                {job.salonName}
              </p>
              {job.salonAddress ? (
                <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3 shrink-0" />
                  <span className="line-clamp-2">{job.salonAddress}</span>
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
              {job.status === "closed" ? (
                <span className="rounded-md bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                  Closed
                </span>
              ) : null}
              <p className="text-sm font-medium text-foreground">{job.role}</p>
              <p className="text-xs text-muted-foreground">
                {job.employmentType}
                {job.level ? ` · ${job.level}` : ""}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 border-t border-border pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
              {job.description}
            </p>
          </div>

          {!showSalonActions ? (
            <div className="mt-auto flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                className="h-8 rounded-full px-4 text-xs sm:h-9 sm:px-5 sm:text-sm"
                disabled={job.applied || applying || job.status === "closed"}
                onClick={() => void handleApply()}
              >
                {applying ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin sm:size-4" />
                ) : null}
                {job.applied ? "Applied" : "I'm Interested"}
              </Button>
            </div>
          ) : (
            <div className="mt-auto flex justify-end gap-2 pt-1">
              {job.status === "open" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-4 text-xs sm:h-9 sm:px-5 sm:text-sm"
                  disabled={busy}
                  onClick={() => void handleStatus("closed")}
                >
                  Close position
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-4 text-xs sm:h-9 sm:px-5 sm:text-sm"
                  disabled={busy}
                  onClick={() => void handleStatus("open")}
                >
                  Reopen
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
