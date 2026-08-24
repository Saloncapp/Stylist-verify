import type { ReactNode } from "react";
import { Briefcase, ClipboardList, Link2 } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { StylistApplicationPreviewCard } from "@/components/stylist/stylist-application-preview-card";
import { StylistJobPreviewCard } from "@/components/stylist/stylist-job-preview-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HiringApplicationCard, HiringJobCard } from "@/types";
import { DASHBOARD_PREVIEW_LIMIT } from "@/lib/hiring";

interface StylistDashboardPanelsProps {
  jobs: {
    count: number;
    items: HiringJobCard[];
  };
  applications: {
    count: number;
    items: HiringApplicationCard[];
  };
}

function PreviewEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function ColoredPill({
  children,
  color,
  className = "",
}: {
  children: ReactNode;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full font-semibold ${className}`}
      style={{
        color,
        backgroundColor: `${color}1A`,
      }}
    >
      {children}
    </span>
  );
}

function formatDashboardCount(count: number): string {
  if (count > DASHBOARD_PREVIEW_LIMIT) {
    return `${DASHBOARD_PREVIEW_LIMIT}+`;
  }
  return String(count);
}

interface PreviewPanelProps {
  title: string;
  description: string;
  count: number;
  countLabel: string;
  countColor: string;
  icon: typeof Briefcase;
  emptyMessage: string;
  viewMoreHref: string;
  children: ReactNode;
}

function PreviewPanel({
  title,
  description,
  count,
  countLabel,
  countColor,
  icon: Icon,
  emptyMessage,
  viewMoreHref,
  children,
}: PreviewPanelProps) {
  return (
    <Card className="flex h-full flex-col shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              <ColoredPill color={countColor} className="px-3 py-1">
                {title}
              </ColoredPill>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${countColor}1A` }}
          >
            <Icon className="size-5" style={{ color: countColor }} />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-3">
          <p
            className="text-3xl font-bold tracking-tight"
            style={{ color: countColor }}
          >
            {formatDashboardCount(count)}
          </p>
          <p className="text-sm font-medium" style={{ color: countColor }}>
            {countLabel}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        {children ?? <PreviewEmptyState message={emptyMessage} />}
      </CardContent>

      {count > DASHBOARD_PREVIEW_LIMIT ? (
        <CardFooter className="mt-auto justify-center border-t-0 bg-transparent pt-4">
          <LinkButton
            href={viewMoreHref}
            variant="link"
            className="h-auto gap-1.5 p-0 text-sm font-medium"
          >
            <Link2 className="size-4" />
            View More
          </LinkButton>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function StylistDashboardPanels({
  jobs,
  applications,
}: StylistDashboardPanelsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PreviewPanel
        title="Recent Jobs"
        description="Open positions you can apply to."
        count={jobs.count}
        countLabel={jobs.count === 1 ? "open job" : "open jobs"}
        countColor="#2563EB"
        icon={Briefcase}
        emptyMessage="No open positions right now. Check back soon."
        viewMoreHref="/stylist/jobs"
      >
        {jobs.items.length > 0 ? (
          jobs.items.map((job) => (
            <StylistJobPreviewCard key={job.id} job={job} />
          ))
        ) : null}
      </PreviewPanel>

      <PreviewPanel
        title="Applications"
        description="Jobs you've expressed interest in."
        count={applications.count}
        countLabel={
          applications.count === 1 ? "application" : "applications"
        }
        countColor="#16A34A"
        icon={ClipboardList}
        emptyMessage="You haven't applied to any jobs yet."
        viewMoreHref="/stylist/applications"
      >
        {applications.items.length > 0 ? (
          applications.items.map((application) => (
            <StylistApplicationPreviewCard
              key={application.id}
              application={application}
            />
          ))
        ) : null}
      </PreviewPanel>
    </div>
  );
}
