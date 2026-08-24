import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  clearSessionCookie,
  requireSalonSession,
  toSalonUser,
} from "@/lib/auth";
import Salon from "@/models/Salon";
import Application from "@/models/Application";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardClientShell } from "@/components/dashboard/dashboard-client-shell";
import { DASHBOARD_INTERACTIVE_CLASS } from "@/lib/dashboard-layout";
import { cn } from "@/lib/utils";
import type { SalonUser } from "@/types";

async function getSalonUser(): Promise<
  | { salon: SalonUser; interestedCount: number }
  | "unauthenticated"
  | "invalid"
> {
  const session = await requireSalonSession();
  if (!session?.salonId) return "unauthenticated";

  await connectDB();
  const salon = await Salon.findById(session.salonId);
  if (!salon) return "invalid";

  const interestedCount = await Application.countDocuments({
    salonId: session.salonId,
    status: "Interested",
  });

  return { salon: toSalonUser(salon), interestedCount };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getSalonUser();

  if (result === "unauthenticated") {
    redirect("/");
  }

  if (result === "invalid") {
    await clearSessionCookie();
    redirect("/");
  }

  return (
    <DashboardClientShell>
      <div className={cn("flex min-h-full bg-muted/30", DASHBOARD_INTERACTIVE_CLASS)}>
        <DashboardSidebar
          interestedCount={result.interestedCount}
          className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r lg:flex"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            salon={result.salon}
            interestedCount={result.interestedCount}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </DashboardClientShell>
  );
}
