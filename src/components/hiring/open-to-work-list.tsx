"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalentCard } from "@/components/hiring/talent-card";
import type { OpenToWorkTalentCard } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card py-12 text-center shadow-sm">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

interface OpenToWorkListProps {
  className?: string;
  showCopyPhone?: boolean;
  showSendInterest?: boolean;
}

/** Paginated Open to Work talent list for salon dashboards. */
export function OpenToWorkList({
  className,
  showCopyPhone = false,
  showSendInterest = false,
}: OpenToWorkListProps) {
  const [talent, setTalent] = useState<OpenToWorkTalentCard[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextCursor: string | null, append: boolean) => {
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
    }
    try {
      const params = new URLSearchParams({ limit: "12" });
      if (nextCursor) params.set("cursor", nextCursor);
      const res = await fetch(`/api/stylists/open-to-work?${params}`);
      const result = await res.json();
      if (!result.success) {
        const message = result.message || "Failed to load stylists";
        if (!append) setError(message);
        toast.error(message);
        return;
      }
      const page = result.data.items as OpenToWorkTalentCard[];
      setTalent((prev) => (append ? [...prev, ...page] : page));
      setCursor(result.data.nextCursor ?? null);
    } catch {
      const message = "Failed to load stylists";
      if (!append) setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(null, false);
  }, [load]);

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center py-16 text-muted-foreground",
          className
        )}
      >
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading stylists…
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <EmptyBlock message={error} />
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={() => void load(null, false)}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (talent.length === 0) {
    return (
      <EmptyBlock
        message="No stylists are Open to Work right now. Check back soon."
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {talent.map((item) => (
          <TalentCard
            key={item.id}
            talent={item}
            showCopyPhone={showCopyPhone}
            showSendInterest={showSendInterest}
          />
        ))}
      </div>
      {cursor ? (
        <div className="flex justify-center pt-2">
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
