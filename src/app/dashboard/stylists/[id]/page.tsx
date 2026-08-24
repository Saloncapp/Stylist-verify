import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { requireSalonSession } from "@/lib/auth";
import { formatStylist } from "@/lib/formatters";
import { findStylistForSalonQuery } from "@/lib/stylist-employment";
import Stylist from "@/models/Stylist";
import { StylistDetail } from "@/components/dashboard/stylist-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Stylist ${id}` };
}

export default async function StylistDetailPage({ params }: PageProps) {
  const session = await requireSalonSession();
  if (!session?.salonId) return null;

  const { id } = await params;

  await connectDB();

  const stylist = await Stylist.findOne(
    findStylistForSalonQuery(id, session.salonId)
  );

  if (!stylist) {
    notFound();
  }

  return <StylistDetail stylist={formatStylist(stylist, session.salonId)} />;
}
