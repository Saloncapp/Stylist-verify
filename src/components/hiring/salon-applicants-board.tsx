"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApplicationCard } from "@/components/hiring/application-card";
import { getApplicationStatusColor } from "@/components/hiring/application-status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApplicationStatus, HiringApplicationCard } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const APPLICANT_STATUSES: ApplicationStatus[] = [
  "Interested",
  "Hired",
  "Rejected",
];

const EMPTY_MESSAGES: Record<ApplicationStatus, string> = {
  Interested: "No interested applicants yet.",
  Hired: "No hired applicants yet.",
  Rejected: "No rejected applicants yet.",
};

type TabState = {
  apps: HiringApplicationCard[];
  cursor: string | null;
  loaded: boolean;
  loading: boolean;
  loadingMore: boolean;
};

type TabStateMap = Record<ApplicationStatus, TabState>;

function createInitialTabState(): TabStateMap {
  return {
    Interested: emptyTabState(),
    Hired: emptyTabState(),
    Rejected: emptyTabState(),
  };
}

function emptyTabState(): TabState {
  return {
    apps: [],
    cursor: null,
    loaded: false,
    loading: false,
    loadingMore: false,
  };
}

function parseApplicantTab(value: string | null): ApplicationStatus {
  if (
    value === "Interested" ||
    value === "Hired" ||
    value === "Rejected"
  ) {
    return value;
  }
  return "Interested";
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card py-12 text-center shadow-sm">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function StatusCountPill({
  count,
  color,
  active,
}: {
  count: number;
  color: string;
  active: boolean;
}) {
  return (
    <span
      className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums"
      style={{
        backgroundColor: active ? color : `${color}1A`,
        color: active ? "#fff" : color,
      }}
    >
      {count}
    </span>
  );
}

function ApplicantsBoardSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-4 w-full max-w-md animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex justify-center">
        <div className="h-11 w-full max-w-xl animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="flex min-h-[280px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading applicants…
      </div>
    </div>
  );
}

function SalonApplicantsBoardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = parseApplicantTab(searchParams.get("tab"));

  const [tabState, setTabState] = useState<TabStateMap>(createInitialTabState);
  const [counts, setCounts] = useState<Record<ApplicationStatus, number>>({
    Interested: 0,
    Hired: 0,
    Rejected: 0,
  });
  const tabStateRef = useRef(tabState);
  tabStateRef.current = tabState;

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/applications/counts");
      const result = await res.json();
      if (result.success) {
        setCounts(result.data.counts);
      }
    } catch {
      /* list responses can still reconcile individual tab totals */
    }
  }, []);

  const load = useCallback(
    async (
      status: ApplicationStatus,
      nextCursor: string | null,
      append: boolean
    ) => {
      setTabState((prev) => ({
        ...prev,
        [status]: {
          ...prev[status],
          loading: !append,
          loadingMore: append,
        },
      }));

      try {
        const params = new URLSearchParams({
          limit: "12",
          status,
        });
        if (nextCursor) params.set("cursor", nextCursor);

        const res = await fetch(`/api/applications?${params}`);
        const result = await res.json();
        if (!result.success) {
          toast.error(result.message || "Failed to load applicants");
          setTabState((prev) => ({
            ...prev,
            [status]: {
              ...prev[status],
              loaded: true,
              loading: false,
              loadingMore: false,
            },
          }));
          return;
        }

        const page = result.data.items as HiringApplicationCard[];
        const totalCount = result.data.totalCount as number | undefined;

        setTabState((prev) => ({
          ...prev,
          [status]: {
            apps: append ? [...prev[status].apps, ...page] : page,
            cursor: result.data.nextCursor ?? null,
            loaded: true,
            loading: false,
            loadingMore: false,
          },
        }));

        if (typeof totalCount === "number") {
          setCounts((prev) => ({ ...prev, [status]: totalCount }));
        }
      } catch {
        toast.error("Failed to load applicants");
        setTabState((prev) => ({
          ...prev,
          [status]: {
            ...prev[status],
            loaded: true,
            loading: false,
            loadingMore: false,
          },
        }));
      }
    },
    []
  );

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    const state = tabStateRef.current[activeTab];
    if (state.loaded || state.loading) return;
    void load(activeTab, null, false);
  }, [activeTab, load]);

  function handleTabChange(value: string | number | null) {
    if (
      value !== "Interested" &&
      value !== "Hired" &&
      value !== "Rejected"
    ) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleStatusChange(id: string, nextStatus: ApplicationStatus) {
    const previousStatus = activeTab;

    setTabState((prev) => ({
      ...prev,
      [previousStatus]: {
        ...prev[previousStatus],
        apps: prev[previousStatus].apps.filter((app) => app.id !== id),
      },
      ...(nextStatus !== previousStatus
        ? {
            [nextStatus]: {
              ...prev[nextStatus],
              loaded: false,
            },
          }
        : {}),
    }));

    setCounts((prev) => ({
      ...prev,
      [previousStatus]: Math.max(0, prev[previousStatus] - 1),
      [nextStatus]: prev[nextStatus] + 1,
    }));
  }

  const current = tabState[activeTab];
  const showInitialLoader = current.loading && !current.loaded;
  const showEmpty = current.loaded && current.apps.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applicants</h1>
        <p className="text-muted-foreground">
          Review interested stylists, hired team members, and rejected
          applications.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
        <div className="flex w-full justify-center">
          <TabsList className="grid h-11 w-full max-w-xl grid-cols-3 gap-1 p-1">
            {APPLICANT_STATUSES.map((status) => {
              const color = getApplicationStatusColor(status);
              const isActive = activeTab === status;
              const count = counts[status];

              return (
                <TabsTrigger
                  key={status}
                  value={status}
                  className={cn(
                    "flex h-full min-w-0 items-center justify-center gap-1.5 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm",
                    "data-active:shadow-sm"
                  )}
                >
                  <span className="truncate">{status}</span>
                  <StatusCountPill
                    count={count}
                    color={color}
                    active={isActive}
                  />
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>

      <section className="min-h-[280px]">
        {showInitialLoader ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading {activeTab.toLowerCase()} applicants…
          </div>
        ) : showEmpty ? (
          <EmptyBlock message={EMPTY_MESSAGES[activeTab]} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {current.apps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
            {current.cursor ? (
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={current.loadingMore}
                  onClick={() => void load(activeTab, current.cursor, true)}
                >
                  {current.loadingMore ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

export function SalonApplicantsBoard() {
  return (
    <Suspense fallback={<ApplicantsBoardSkeleton />}>
      <SalonApplicantsBoardContent />
    </Suspense>
  );
}
