import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { requireStylistSession } from "@/lib/auth";
import {
  getStylistApplicationStatusCounts,
  getStylistApplicationsPreview,
  getStylistJobsPreview,
} from "@/lib/hiring";
import Stylist from "@/models/Stylist";
import { LinkButton } from "@/components/link-button";
import { StylistDashboardPanels } from "@/components/stylist/stylist-dashboard-panels";
import { StylistStatsCards } from "@/components/stylist/stylist-stats-cards";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function StylistHomePage() {
  const session = await requireStylistSession();
  if (!session?.stylistId) {
    redirect("/");
  }

  await connectDB();

  const stylist = await Stylist.findById(session.stylistId);
  if (!stylist) {
    redirect("/");
  }

  const [jobs, applications, statusCounts] = await Promise.all([
    getStylistJobsPreview(session.stylistId, stylist),
    getStylistApplicationsPreview(session.stylistId),
    getStylistApplicationStatusCounts(session.stylistId),
  ]);

  const stats = {
    openJobs: jobs.count,
    applications:
      statusCounts.Interested + statusCounts.Hired + statusCounts.Rejected,
    interested: statusCounts.Interested,
    employment: stylist.employmentHistory?.length ?? 0,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of open jobs, your applications, and employment history
          </p>
        </div>
        <LinkButton href="/stylist/jobs" className="w-full sm:w-auto">
          Browse Jobs
        </LinkButton>
      </div>

      <StylistStatsCards stats={stats} />

      <StylistDashboardPanels jobs={jobs} applications={applications} />
    </div>
  );
}
