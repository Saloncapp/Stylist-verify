import type { Metadata } from "next";
import { VerifyStylistForm } from "@/components/dashboard/verify-stylist-form";

export const metadata: Metadata = {
  title: "Verify Stylist",
};

export default function DashboardVerifyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verify Stylist</h1>
        <p className="text-muted-foreground">
          Look up verified employment records before making a hiring decision
        </p>
      </div>
      <VerifyStylistForm />
    </div>
  );
}
