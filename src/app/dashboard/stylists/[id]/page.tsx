import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatStylist } from "@/lib/formatters";
import Stylist from "@/models/Stylist";
import { StylistDetail } from "@/components/dashboard/stylist-detail";
import { LinkButton } from "@/components/link-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Stylist ${id}` };
}

export default async function StylistDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) return null;

  const { id } = await params;

  await connectDB();

  const stylist = await Stylist.findOne({
    _id: id,
    salonId: session.salonId,
  });

  if (!stylist) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <LinkButton href="/dashboard/stylists" variant="ghost" size="sm">
        <ArrowLeft className="mr-2 size-4" />
        Back to Stylists
      </LinkButton>
      <StylistDetail stylist={formatStylist(stylist)} />
    </div>
  );
}
