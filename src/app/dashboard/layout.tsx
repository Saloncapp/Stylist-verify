import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { getSession, toSalonUser } from "@/lib/auth";
import Salon from "@/models/Salon";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import type { SalonUser } from "@/types";

async function getSalonUser(): Promise<SalonUser | null> {
  const session = await getSession();
  if (!session) return null;

  await connectDB();
  const salon = await Salon.findById(session.salonId).select("-password");
  if (!salon) return null;

  return toSalonUser(salon);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const salon = await getSalonUser();

  if (!salon) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-col bg-muted/30">
      <DashboardHeader salon={salon} />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
