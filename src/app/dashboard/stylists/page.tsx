import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatStylist } from "@/lib/formatters";
import Stylist from "@/models/Stylist";
import { StylistTable } from "@/components/dashboard/stylist-table";
import { LinkButton } from "@/components/link-button";

export const metadata: Metadata = {
  title: "All Stylists",
};

export default async function StylistsPage() {
  const session = await getSession();
  if (!session) return null;

  await connectDB();

  const stylists = await Stylist.find({ salonId: session.salonId }).sort({
    createdAt: -1,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Stylists</h1>
          <p className="text-muted-foreground">
            {stylists.length} stylist{stylists.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <LinkButton href="/dashboard/stylists/add">
          <Plus className="mr-2 size-4" />
          Add Stylist
        </LinkButton>
      </div>

      <StylistTable stylists={stylists.map(formatStylist)} />
    </div>
  );
}
