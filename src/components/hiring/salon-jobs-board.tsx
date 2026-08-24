"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/hiring/job-card";
import { PostJobDialog } from "@/components/hiring/post-job-dialog";
import type { HiringJobCard } from "@/types";
import { toast } from "sonner";

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card py-12 text-center shadow-sm">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export function SalonJobsBoard() {
  const [jobs, setJobs] = useState<HiringJobCard[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (nextCursor: string | null, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "12" });
      if (nextCursor) params.set("cursor", nextCursor);
      const res = await fetch(`/api/jobs/mine?${params}`);
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Failed to load positions");
        return;
      }
      const page = result.data.items as HiringJobCard[];
      setJobs((prev) => (append ? [...prev, ...page] : page));
      setCursor(result.data.nextCursor ?? null);
    } catch {
      toast.error("Failed to load positions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(null, false);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            Post and manage positions for stylists to discover.
          </p>
        </div>
        <PostJobDialog onCreated={(job) => setJobs((prev) => [job, ...prev])} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Loading positions…
        </div>
      ) : jobs.length === 0 ? (
        <EmptyBlock message="No positions posted yet." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showSalonActions
                onCloseJob={(id) =>
                  setJobs((prev) =>
                    prev.map((j) =>
                      j.id === id ? { ...j, status: "closed" } : j
                    )
                  )
                }
                onReopenJob={(id) =>
                  setJobs((prev) =>
                    prev.map((j) =>
                      j.id === id ? { ...j, status: "open" } : j
                    )
                  )
                }
              />
            ))}
          </div>
          {cursor ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={loadingMore}
                onClick={() => void load(cursor, true)}
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
