"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import {
  ApplicationStatusBadge,
  getApplicationStatusColor,
} from "@/components/hiring/application-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApplicationStatus, HiringApplicationCard } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUSES: ApplicationStatus[] = ["Interested", "Hired", "Rejected"];

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card py-12 text-center shadow-sm">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function ApplicationRow({ application }: { application: HiringApplicationCard }) {
  const accentColor = getApplicationStatusColor(application.status);

  return (
    <Card
      className="h-full shadow-sm"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-semibold text-black">
              {application.jobRole}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {application.salonName}
              {application.jobEmploymentType
                ? ` · ${application.jobEmploymentType}`
                : ""}
            </p>
            {application.salonAddress ? (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 size-3 shrink-0" />
                <span className="line-clamp-2">{application.salonAddress}</span>
              </p>
            ) : null}
          </div>
          <ApplicationStatusBadge status={application.status} />
        </div>
      </CardContent>
    </Card>
  );
}

export function StylistApplicationsBoard() {
  const [tab, setTab] = useState<ApplicationStatus>("Interested");
  const [items, setItems] = useState<HiringApplicationCard[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (
      status: ApplicationStatus,
      nextCursor: string | null,
      append: boolean
    ) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: "12",
          status,
        });
        if (nextCursor) params.set("cursor", nextCursor);
        const res = await fetch(`/api/me/applications?${params}`);
        const result = await res.json();
        if (!result.success) {
          toast.error(result.message || "Failed to load applications");
          return;
        }
        const page = result.data.items as HiringApplicationCard[];
        setItems((prev) => (append ? [...prev, ...page] : page));
        setCursor(result.data.nextCursor ?? null);
      } catch {
        toast.error("Failed to load applications");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    void load(tab, null, false);
  }, [tab, load]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">
          Track jobs you&apos;ve applied to and their current status.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (
            value === "Interested" ||
            value === "Hired" ||
            value === "Rejected"
          ) {
            setTab(value);
          }
        }}
      >
        <div className="flex w-full justify-center">
          <TabsList className="grid h-11 w-full max-w-xl grid-cols-3 gap-1 p-1">
            {STATUSES.map((status) => {
              const isActive = tab === status;
              const color = getApplicationStatusColor(status);

              return (
                <TabsTrigger
                  key={status}
                  value={status}
                  className={cn(
                    "flex h-full min-w-0 items-center justify-center px-2 text-xs sm:text-sm",
                    "data-active:shadow-sm"
                  )}
                  style={isActive ? undefined : { color }}
                >
                  {status}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Loading applications…
        </div>
      ) : items.length === 0 ? (
        <EmptyBlock message="No applications in this section yet." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((app) => (
              <ApplicationRow key={app.id} application={app} />
            ))}
          </div>
          {cursor ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={loadingMore}
                onClick={() => void load(tab, cursor, true)}
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
