"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2, MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { InterestRequestCard } from "@/types";
import { toast } from "sonner";

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card py-12 text-center shadow-sm">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function InterestCard({
  interest,
  onResolved,
}: {
  interest: InterestRequestCard;
  onResolved: (id: string) => void;
}) {
  const [busy, setBusy] = useState<"accept" | "cancel" | null>(null);

  async function accept() {
    if (busy) return;
    setBusy("accept");
    try {
      const res = await fetch(`/api/me/interests/${interest.id}/accept`, {
        method: "POST",
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Could not send interest");
        return;
      }
      toast.success("Interest sent — the salon can see your application");
      onResolved(interest.id);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    if (busy) return;
    setBusy("cancel");
    try {
      const res = await fetch(`/api/me/interests/${interest.id}/cancel`, {
        method: "POST",
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Could not cancel request");
        return;
      }
      onResolved(interest.id);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full border-l-4 border-l-[#2563EB] shadow-sm">
        <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
              {interest.salonLogoUrl ? (
                <Image
                  src={interest.salonLogoUrl}
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
                {interest.salonName}
              </p>
              {interest.salonAddress ? (
                <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3 shrink-0" />
                  <span className="line-clamp-2">{interest.salonAddress}</span>
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
              <p className="text-sm font-medium text-black">{interest.jobRole}</p>
              {interest.jobEmploymentType ? (
                <p className="text-xs text-muted-foreground">
                  {interest.jobEmploymentType}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex-1 space-y-1.5 border-t border-border pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Message
            </p>
            <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
              {interest.message}
            </p>
          </div>

          <div className="mt-auto flex flex-wrap justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-4 text-xs sm:h-9 sm:px-5 sm:text-sm"
              disabled={busy != null}
              onClick={() => void cancel()}
            >
              {busy === "cancel" ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full px-4 text-xs sm:h-9 sm:px-5 sm:text-sm"
              disabled={busy != null}
              onClick={() => void accept()}
            >
              {busy === "accept" ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Send Interest
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StylistInterestsBoard() {
  const [items, setItems] = useState<InterestRequestCard[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (nextCursor: string | null, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "12",
        status: "pending",
      });
      if (nextCursor) params.set("cursor", nextCursor);
      const res = await fetch(`/api/me/interests?${params}`);
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Failed to load interests");
        return;
      }
      const page = result.data.items as InterestRequestCard[];
      setItems((prev) => (append ? [...prev, ...page] : page));
      setCursor(result.data.nextCursor ?? null);
    } catch {
      toast.error("Failed to load interests");
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interests</h1>
        <p className="text-muted-foreground">
          Salons interested in hiring you. Send Interest to apply, or Cancel to
          dismiss.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Loading interest requests…
        </div>
      ) : items.length === 0 ? (
        <EmptyBlock message="No pending interest requests right now." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((interest) => (
              <InterestCard
                key={interest.id}
                interest={interest}
                onResolved={(id) =>
                  setItems((prev) => prev.filter((item) => item.id !== id))
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
