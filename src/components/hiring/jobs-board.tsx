"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/hiring/job-card";
import type { HiringJobCard } from "@/types";
import { toast } from "sonner";

interface JobsBoardProps {
  initialItems?: HiringJobCard[];
  initialCursor?: string | null;
  pageSize?: number;
  /** Compact home preview — no load more */
  preview?: boolean;
}

export function JobsBoard({
  initialItems = [],
  initialCursor = null,
  pageSize = 12,
  preview = false,
}: JobsBoardProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (nextCursor: string | null, append: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          limit: String(preview ? Math.min(pageSize, 4) : pageSize),
        });
        if (nextCursor) params.set("cursor", nextCursor);
        const res = await fetch(`/api/jobs?${params}`, {
          signal: controller.signal,
        });
        const result = await res.json();
        if (!result.success) {
          toast.error(result.message || "Failed to load jobs");
          return;
        }
        const page = result.data.items as HiringJobCard[];
        setItems((prev) => (append ? [...prev, ...page] : page));
        setCursor(result.data.nextCursor ?? null);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        toast.error("Failed to load jobs");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [pageSize, preview]
  );

  useEffect(() => {
    if (initialItems.length > 0) {
      setLoading(false);
      return;
    }
    void load(null, false);
    return () => abortRef.current?.abort();
  }, [initialItems.length, load]);

  function handleApplied(jobId: string) {
    setItems((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, applied: true } : j))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading jobs…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
        <p className="text-muted-foreground">No open positions right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((job) => (
          <JobCard key={job.id} job={job} onApplied={handleApplied} />
        ))}
      </div>
      {!preview && cursor ? (
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
    </div>
  );
}
