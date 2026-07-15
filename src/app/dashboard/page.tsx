import type { Metadata } from "next";
import { Plus, Search } from "lucide-react";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatStylist } from "@/lib/formatters";
import Stylist from "@/models/Stylist";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StylistTable } from "@/components/dashboard/stylist-table";
import { LinkButton } from "@/components/link-button";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  await connectDB();

  const stylists = await Stylist.find({ salonId: session.salonId }).sort({
    createdAt: -1,
  });

  const stats = {
    total: stylists.length,
    active: stylists.filter((s) => s.status === "Active").length,
    relieved: stylists.filter((s) => s.status === "Relieved").length,
    absconded: stylists.filter((s) => s.status === "Abscond").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your registered stylists
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <LinkButton href="/dashboard/verify" variant="outline">
            <Search className="mr-2 size-4" />
            Verify Stylist
          </LinkButton>
          <LinkButton href="/dashboard/stylists/add">
            <Plus className="mr-2 size-4" />
            Add Stylist
          </LinkButton>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Stylists</h2>
        <StylistTable stylists={stylists.slice(0, 10).map(formatStylist)} />
      </div>
    </div>
  );
}
