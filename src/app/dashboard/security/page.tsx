import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSalonSession } from "@/lib/auth";
import { AccountSecurityPanel } from "@/components/account/account-security-panel";

export const metadata: Metadata = {
  title: "Account Security",
};

export default async function SalonSecurityPage() {
  const session = await requireSalonSession();
  if (!session?.salonId) {
    redirect("/");
  }

  return (
    <AccountSecurityPanel backHref="/dashboard/profile" />
  );
}
