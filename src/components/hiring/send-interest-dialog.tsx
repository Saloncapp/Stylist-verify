"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HiringJobCard, OpenToWorkTalentCard } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SendInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: OpenToWorkTalentCard | null;
  onSent?: (stylistId: string, jobId: string) => void;
}

export function SendInterestDialog({
  open,
  onOpenChange,
  talent,
  onSent,
}: SendInterestDialogProps) {
  const [jobs, setJobs] = useState<HiringJobCard[]>([]);
  const [sentJobIds, setSentJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadJobs = useCallback(async () => {
    if (!talent) return;
    setLoading(true);
    try {
      const [jobsRes, sentRes] = await Promise.all([
        fetch("/api/jobs/mine?status=open&limit=24"),
        fetch(`/api/stylists/${talent.id}/interest`),
      ]);
      const [jobsResult, sentResult] = await Promise.all([
        jobsRes.json(),
        sentRes.json(),
      ]);

      if (!jobsResult.success) {
        toast.error(jobsResult.message || "Failed to load open jobs");
        return;
      }

      setJobs(jobsResult.data.items as HiringJobCard[]);
      setSentJobIds(
        new Set(
          sentResult.success
            ? ((sentResult.data.sentJobIds as string[]) ?? [])
            : []
        )
      );
    } catch {
      toast.error("Failed to load open jobs");
    } finally {
      setLoading(false);
    }
  }, [talent]);

  useEffect(() => {
    if (!open) return;
    setSelectedJobId(null);
    void loadJobs();
  }, [open, loadJobs]);

  async function handleSend() {
    if (!talent || !selectedJobId || sending) return;
    if (sentJobIds.has(selectedJobId)) return;
    setSending(true);
    try {
      const res = await fetch(`/api/stylists/${talent.id}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedJobId }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Could not send interest");
        return;
      }
      toast.success("Interest request sent to stylist");
      setSentJobIds((prev) => new Set([...prev, selectedJobId]));
      onSent?.(talent.id, selectedJobId);
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSending(false);
    }
  }

  const availableCount = jobs.filter((job) => !sentJobIds.has(job.id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Interest</DialogTitle>
          <DialogDescription>
            {talent
              ? `Choose an open position to invite ${talent.name}. They’ll receive your salon details and can accept or cancel.`
              : "Choose an open position for this stylist."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading open jobs…
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            You have no open job positions. Post a job first, then send
            interest.
          </div>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {jobs.map((job) => {
              const alreadySent = sentJobIds.has(job.id);
              const selected = selectedJobId === job.id;

              return (
                <li key={job.id}>
                  <button
                    type="button"
                    disabled={alreadySent}
                    onClick={() => {
                      if (!alreadySent) setSelectedJobId(job.id);
                    }}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                      alreadySent
                        ? "cursor-not-allowed border-border bg-muted/40 opacity-70"
                        : selected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                          : "border-border bg-card hover:bg-muted/50"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-semibold",
                          alreadySent ? "text-muted-foreground" : "text-[#2563EB]"
                        )}
                      >
                        {job.role}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.employmentType}
                        {job.level ? ` · ${job.level}` : ""}
                      </p>
                      {job.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {job.description}
                        </p>
                      ) : null}
                    </div>
                    {alreadySent ? (
                      <span className="shrink-0 rounded-full bg-muted-foreground/20 px-2.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                        Sent
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              !selectedJobId ||
              sending ||
              jobs.length === 0 ||
              availableCount === 0 ||
              (selectedJobId != null && sentJobIds.has(selectedJobId))
            }
            onClick={() => void handleSend()}
            className="rounded-full px-5"
          >
            {sending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Send Interest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
