import type { Metadata } from "next";
import { StylistApplicationsBoard } from "@/components/stylist/stylist-applications-board";

export const metadata: Metadata = {
  title: "Applications",
};

export default function StylistApplicationsPage() {
  return <StylistApplicationsBoard />;
}
