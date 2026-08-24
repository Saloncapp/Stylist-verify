import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { formatStylist } from "@/lib/formatters";
import { stylistAccessibleBySalonQuery } from "@/lib/stylist-employment";
import Stylist from "@/models/Stylist";
import { StylistTable } from "@/components/dashboard/stylist-table";
import { StylistTeamEmptyState } from "@/components/dashboard/stylist-team-empty-state";
import { AddStylistButton } from "@/components/dashboard/add-stylist-button";

export const metadata: Metadata = {
  title: "Stylist",
};

export default async function StylistsPage() {
  const session = await requireSalonSession();
  if (!session?.salonId) return null;

  await connectDB();

  const stylists = await Stylist.find(
    stylistAccessibleBySalonQuery(session.salonId)
  ).sort({ createdAt: -1 });

  const formatted = stylists.map((stylist) =>
    formatStylist(stylist, session.salonId)
  );

  const hasRegisteredStylists = formatted.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stylist</h1>
          {hasRegisteredStylists ? (
            <p className="text-muted-foreground">
              {formatted.length} stylist{formatted.length !== 1 ? "s" : ""}{" "}
              registered
            </p>
          ) : null}
        </div>
        {hasRegisteredStylists ? (
          <AddStylistButton className="w-full sm:w-auto" />
        ) : null}
      </div>

      {hasRegisteredStylists ? (
        <StylistTable stylists={formatted} />
      ) : (
        <StylistTeamEmptyState />
      )}
    </div>
  );
}
