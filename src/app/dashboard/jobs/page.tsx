import type { Metadata } from "next";
import { SalonJobsBoard } from "@/components/hiring/salon-jobs-board";

export const metadata: Metadata = {
  title: "Jobs",
};

export default function SalonJobsPage() {
  return <SalonJobsBoard />;
}
