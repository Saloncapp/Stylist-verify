import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { requireStylistSession } from "@/lib/auth";
import { buildPrivateVerifiedStylistFromRecords } from "@/lib/verify";
import Stylist from "@/models/Stylist";
import { VerifiedStylistView } from "@/components/verify/verified-stylist-view";
import { LinkButton } from "@/components/link-button";

export const metadata: Metadata = {
  title: "Employment",
};

export default async function StylistEmploymentPage() {
  const session = await requireStylistSession();
  if (!session?.stylistId) {
    redirect("/");
  }

  await connectDB();

  const stylist = await Stylist.findById(session.stylistId);
  if (!stylist) {
    redirect("/");
  }

  const verified = buildPrivateVerifiedStylistFromRecords([stylist]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employment</h1>
          <p className="text-muted-foreground">
            Your verified employment history across salons.
          </p>
        </div>
        <LinkButton href="/stylist/profile" className="w-full sm:w-auto">
          Edit profile
        </LinkButton>
      </div>

      <VerifiedStylistView
        name={verified.name}
        employeeId={verified.employeeId}
        photoUrl={verified.photoUrl}
        status={verified.status}
        mobile={verified.mobileNumber}
        aadhaar={verified.aadhaarMasked}
        address={verified.address}
        employmentHistory={verified.employmentHistory}
      />
    </div>
  );
}
