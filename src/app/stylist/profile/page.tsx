import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { requireStylistSession, toStylistAccount } from "@/lib/auth";
import { getAadhaarFromRecord, maskAadhaar } from "@/lib/aadhaar-crypto";
import Stylist from "@/models/Stylist";
import { StylistSelfProfileForm } from "@/components/stylist/stylist-self-profile-form";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function StylistProfilePage() {
  const session = await requireStylistSession();
  if (!session?.stylistId) {
    redirect("/");
  }

  await connectDB();

  const stylist = await Stylist.findById(session.stylistId);
  if (!stylist) {
    redirect("/");
  }

  let aadhaarMasked: string | undefined;
  try {
    aadhaarMasked = maskAadhaar(getAadhaarFromRecord(stylist));
  } catch {
    aadhaarMasked = undefined;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Update your name, address, and photo.
        </p>
      </div>
      <StylistSelfProfileForm
        initialStylist={toStylistAccount({
          ...stylist.toObject(),
          aadhaarMasked,
        })}
      />
    </div>
  );
}
