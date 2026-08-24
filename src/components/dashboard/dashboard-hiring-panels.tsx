import type { ReactNode } from "react";
import { Link2, UserRoundSearch, Users } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { ApplicantPreviewCard } from "@/components/dashboard/applicant-preview-card";
import { TalentCard } from "@/components/hiring/talent-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HiringApplicationCard, OpenToWorkTalentCard } from "@/types";
import { DASHBOARD_PREVIEW_LIMIT } from "@/lib/hiring";

interface DashboardHiringPanelsProps {
  applicants: {
    count: number;
    items: HiringApplicationCard[];
  };
  openToWork: {
    count: number;
    items: OpenToWorkTalentCard[];
  };
}

function PreviewEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

interface HiringPreviewPanelProps {
  title: string;
  description: string;
  count: number;
  countLabel: string;
  countColor: string;
  icon: typeof UserRoundSearch;
  emptyMessage: string;
  viewMoreHref: string;
  children: ReactNode;
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

function HiringPreviewPanel({
  title,
  description,
  count,
  countLabel,
  countColor,
  icon: Icon,
  emptyMessage,
  viewMoreHref,
  children,
}: HiringPreviewPanelProps) {
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

export function DashboardHiringPanels({
  applicants,
  openToWork,
}: DashboardHiringPanelsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <HiringPreviewPanel
        title="Applicants"
        description="Stylists who clicked I'm Interested on your job posts."
        count={applicants.count}
        countLabel={
          applicants.count === 1
            ? "interested applicant"
            : "interested applicants"
        }
        countColor="#2563EB"
        icon={UserRoundSearch}
        emptyMessage="No interested applicants yet. Post a job to start receiving applications."
        viewMoreHref="/dashboard/applicants"
      >
        {applicants.items.length > 0 ? (
          applicants.items.map((application) => (
            <ApplicantPreviewCard
              key={application.id}
              application={application}
            />
          ))
        ) : null}
      </HiringPreviewPanel>

      <HiringPreviewPanel
        title="Open to Work Stylists"
        description="Available talent you can discover and connect with."
        count={openToWork.count}
        countLabel={
          openToWork.count === 1
            ? "stylist available"
            : "stylists available"
        }
        countColor="#16A34A"
        icon={Users}
        emptyMessage="No stylists are Open to Work right now. Check back soon."
        viewMoreHref="/dashboard/verify"
      >
        {openToWork.items.length > 0 ? (
          openToWork.items.map((talent) => (
            <TalentCard key={talent.id} talent={talent} plain />
          ))
        ) : null}
      </HiringPreviewPanel>
    </div>
  );
}
