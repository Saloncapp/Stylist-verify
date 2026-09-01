import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStylistSession } from "@/lib/auth";
import { AccountSecurityPanel } from "@/components/account/account-security-panel";

export const metadata: Metadata = {
  title: "Account Security",
};

export default async function StylistSecurityPage() {
  const session = await requireStylistSession();
  if (!session?.stylistId) {
    redirect("/");
  }

  return (
    <AccountSecurityPanel backHref="/stylist/profile" />
  );
}
