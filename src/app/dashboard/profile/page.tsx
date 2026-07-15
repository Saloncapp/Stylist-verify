import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSession, toSalonUser } from "@/lib/auth";
import Salon from "@/models/Salon";
import { SalonProfileForm } from "@/components/dashboard/salon-profile-form";

export const metadata: Metadata = {
  title: "Salon Profile",
};

export default async function SalonProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  await connectDB();

  const salon = await Salon.findById(session.salonId).select("-password");
  if (!salon) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Salon Profile</h1>
        <p className="text-muted-foreground">
          Update your salon details and account settings
        </p>
      </div>
      <SalonProfileForm initialSalon={toSalonUser(salon)} />
    </div>
  );
}
