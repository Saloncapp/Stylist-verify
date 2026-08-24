import type { Metadata } from "next";
import { FindStylistPageContent } from "@/components/dashboard/find-stylist-page-content";

export const metadata: Metadata = {
  title: "Find Stylist",
};

export default function DashboardFindStylistPage() {
  return <FindStylistPageContent />;
}
