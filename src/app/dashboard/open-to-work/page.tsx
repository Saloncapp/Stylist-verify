import type { Metadata } from "next";
import { OpenToWorkBoard } from "@/components/hiring/open-to-work-board";

export const metadata: Metadata = {
  title: "Open to Work Stylists",
};

export default function DashboardOpenToWorkPage() {
  return <OpenToWorkBoard />;
}
