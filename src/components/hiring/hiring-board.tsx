"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/hiring/job-card";
import { TalentCard } from "@/components/hiring/talent-card";
import { ApplicationCard } from "@/components/hiring/application-card";
import { PostJobDialog } from "@/components/hiring/post-job-dialog";
import type {
  ApplicationStatus,
  HiringApplicationCard,
  HiringJobCard,
  OpenToWorkTalentCard,
} from "@/types";
import { toast } from "sonner";

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card py-12 text-center shadow-sm">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground">
      <Loader2 className="mr-2 size-5 animate-spin" />
      {label}
    </div>
  );
}

export function HiringBoard({
  initialTalent = [],
  initialTalentCursor = null,
  initialJobs = [],
  initialJobsCursor = null,
  initialApplications = [],
  initialApplicationsCursor = null,
}: {
  initialTalent?: OpenToWorkTalentCard[];
  initialTalentCursor?: string | null;
  initialJobs?: HiringJobCard[];
  initialJobsCursor?: string | null;
  initialApplications?: HiringApplicationCard[];
  initialApplicationsCursor?: string | null;
}) {
  const [talent, setTalent] = useState(initialTalent);
  const [talentCursor, setTalentCursor] = useState(initialTalentCursor);
  const [talentLoading, setTalentLoading] = useState(initialTalent.length === 0);
  const [talentMore, setTalentMore] = useState(false);

  const [jobs, setJobs] = useState(initialJobs);
  const [jobsCursor, setJobsCursor] = useState(initialJobsCursor);
  const [jobsLoading, setJobsLoading] = useState(initialJobs.length === 0);
  const [jobsMore, setJobsMore] = useState(false);

  const [apps, setApps] = useState(initialApplications);
  const [appsCursor, setAppsCursor] = useState(initialApplicationsCursor);
  const [appsLoading, setAppsLoading] = useState(
    initialApplications.length === 0
  );
  const [appsMore, setAppsMore] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const loadTalent = useCallback(async (cursor: string | null, append: boolean) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (append) setTalentMore(true);
    else setTalentLoading(true);
    try {
      const params = new URLSearchParams({ limit: "12" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/stylists/open-to-work?${params}`, {
        signal: controller.signal,
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Failed to load talent");
        return;
      }
      const page = result.data.items as OpenToWorkTalentCard[];
      setTalent((prev) => (append ? [...prev, ...page] : page));
      setTalentCursor(result.data.nextCursor ?? null);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Failed to load talent");
      }
    } finally {
      setTalentLoading(false);
      setTalentMore(false);
    }
  }, []);

  const loadJobs = useCallback(async (cursor: string | null, append: boolean) => {
    if (append) setJobsMore(true);
    else setJobsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "12" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/jobs/mine?${params}`);
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Failed to load positions");
        return;
      }
      const page = result.data.items as HiringJobCard[];
      setJobs((prev) => (append ? [...prev, ...page] : page));
      setJobsCursor(result.data.nextCursor ?? null);
    } catch {
      toast.error("Failed to load positions");
    } finally {
      setJobsLoading(false);
      setJobsMore(false);
    }
  }, []);

  const loadApps = useCallback(async (cursor: string | null, append: boolean) => {
    if (append) setAppsMore(true);
    else setAppsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "12" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/applications?${params}`);
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Failed to load applicants");
        return;
      }
      const page = result.data.items as HiringApplicationCard[];
      setApps((prev) => (append ? [...prev, ...page] : page));
      setAppsCursor(result.data.nextCursor ?? null);
    } catch {
      toast.error("Failed to load applicants");
    } finally {
      setAppsLoading(false);
      setAppsMore(false);
    }
  }, []);

  useEffect(() => {
    if (initialTalent.length === 0) void loadTalent(null, false);
    if (initialJobs.length === 0) void loadJobs(null, false);
    if (initialApplications.length === 0) void loadApps(null, false);
    return () => abortRef.current?.abort();
  }, [
    initialTalent.length,
    initialJobs.length,
    initialApplications.length,
    loadTalent,
    loadJobs,
    loadApps,
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Open to Work</h2>
          <p className="text-sm text-muted-foreground">
            Stylists currently available for new opportunities.
          </p>
        </div>
        {talentLoading ? (
          <LoadingBlock label="Loading talent…" />
        ) : talent.length === 0 ? (
          <EmptyBlock message="No stylists are Open to Work right now." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {talent.map((t) => (
                <TalentCard key={t.id} talent={t} />
              ))}
            </div>
            {talentCursor ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={talentMore}
                  onClick={() => void loadTalent(talentCursor, true)}
                >
                  {talentMore ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Positions</h2>
            <p className="text-sm text-muted-foreground">
              Roles you&apos;ve posted for stylists to discover.
            </p>
          </div>
          <PostJobDialog
            onCreated={(job) => setJobs((prev) => [job, ...prev])}
          />
        </div>
        {jobsLoading ? (
          <LoadingBlock label="Loading positions…" />
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
            {jobsCursor ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={jobsMore}
                  onClick={() => void loadJobs(jobsCursor, true)}
                >
                  {jobsMore ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Applicant Pool</h2>
          <p className="text-sm text-muted-foreground">
            Stylists who expressed interest in your openings.
          </p>
        </div>
        {appsLoading ? (
          <LoadingBlock label="Loading applicants…" />
        ) : apps.length === 0 ? (
          <EmptyBlock message="No applications yet." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onStatusChange={(id, status: ApplicationStatus) =>
                    setApps((prev) =>
                      prev.map((a) => (a.id === id ? { ...a, status } : a))
                    )
                  }
                />
              ))}
            </div>
            {appsCursor ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={appsMore}
                  onClick={() => void loadApps(appsCursor, true)}
                >
                  {appsMore ? (
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
