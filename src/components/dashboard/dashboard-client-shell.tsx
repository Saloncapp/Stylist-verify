"use client";

import { AddStylistProvider } from "@/components/dashboard/add-stylist-provider";

export function DashboardClientShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AddStylistProvider>{children}</AddStylistProvider>;
}
