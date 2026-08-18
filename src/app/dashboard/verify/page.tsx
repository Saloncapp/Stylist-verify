import type { Metadata } from "next";
import { VerifyStylistForm } from "@/components/dashboard/verify-stylist-form";

export const metadata: Metadata = {
  title: "Verify Stylist",
};

export default function DashboardVerifyPage() {
  return <VerifyStylistForm />;
}
