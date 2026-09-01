import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { requireSalonSession, toSalonUser } from "@/lib/auth";
import Salon from "@/models/Salon";
import { SalonProfileForm } from "@/components/dashboard/salon-profile-form";
import { AccountSettingsLinks } from "@/components/account/account-settings-links";

export const metadata: Metadata = {
  title: "Salon Profile",
};

export default async function SalonProfilePage() {
  const session = await requireSalonSession();
  if (!session?.salonId) {
    redirect("/");
  }

  await connectDB();

  const salon = await Salon.findById(session.salonId);
  if (!salon) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Salon Profile</h1>
        <p className="text-muted-foreground">
          View and update your salon details. Manage login and recovery options
          under Account Security.
        </p>
      </div>
      <SalonProfileForm initialSalon={toSalonUser(salon)} />
      <AccountSettingsLinks securityHref="/dashboard/security" />
    </div>
  );
}
