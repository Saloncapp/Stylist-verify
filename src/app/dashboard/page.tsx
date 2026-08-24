import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { formatStylist } from "@/lib/formatters";
import {
  getDashboardApplicantsPreview,
  getDashboardOpenToWorkPreview,
} from "@/lib/hiring";
import { stylistAccessibleBySalonQuery } from "@/lib/stylist-employment";
import Stylist from "@/models/Stylist";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DashboardHiringPanels } from "@/components/dashboard/dashboard-hiring-panels";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireSalonSession();
  if (!session?.salonId) return null;

  await connectDB();

  const [stylists, applicants, openToWork] = await Promise.all([
    Stylist.find(stylistAccessibleBySalonQuery(session.salonId)).sort({
      createdAt: -1,
    }),
    getDashboardApplicantsPreview(session.salonId),
    getDashboardOpenToWorkPreview(session.salonId),
  ]);

  const formatted = stylists.map((stylist) =>
    formatStylist(stylist, session.salonId)
  );

  const stats = {
    total: formatted.length,
    active: formatted.filter((s) => s.status === "Active").length,
    relieved: formatted.filter((s) => s.status === "Relieved").length,
    absconded: formatted.filter((s) => s.status === "Abscond").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your salon activity and hiring pipeline
        </p>
      </div>

      <StatsCards stats={stats} />

      <DashboardHiringPanels applicants={applicants} openToWork={openToWork} />
    </div>
  );
}
