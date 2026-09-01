"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SecurityEvent = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

export function SecurityNotifications() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/account/security-events", {
          credentials: "include",
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data.events)) {
          setEvents(result.data.events as SecurityEvent[]);
        }
      } catch {
        // Non-blocking
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function dismissAll() {
    try {
      await fetch("/api/account/security-events", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Still hide locally
    }
    setDismissed(true);
  }

  if (loading || dismissed || events.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold">Security notification</p>
          <ul className="space-y-1 text-sm leading-relaxed">
            {events.map((event) => (
              <li key={event.id}>{event.message}</li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => void dismissAll()}
          >
            Dismiss
          </Button>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-amber-800/70 hover:bg-amber-100 hover:text-amber-950 dark:text-amber-200/70 dark:hover:bg-amber-900/40"
          aria-label="Dismiss security notifications"
          onClick={() => void dismissAll()}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
