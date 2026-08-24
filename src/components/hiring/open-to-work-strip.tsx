"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { TalentCard } from "@/components/hiring/talent-card";
import type { OpenToWorkTalentCard } from "@/types";

/** Compact Open to Work strip for salon dashboard home. */
export function OpenToWorkStrip() {
  const [items, setItems] = useState<OpenToWorkTalentCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/stylists/open-to-work?limit=6");
        const result = await res.json();
        if (!cancelled && result.success) {
          setItems(result.data.items as OpenToWorkTalentCard[]);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Open to Work</h2>
        <LinkButton href="/dashboard/hiring" variant="ghost" size="sm">
          View all
        </LinkButton>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-10 text-center shadow-sm">
          <p className="text-muted-foreground">
            No stylists are Open to Work right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((talent) => (
            <TalentCard key={talent.id} talent={talent} />
          ))}
        </div>
      )}
    </div>
  );
}
