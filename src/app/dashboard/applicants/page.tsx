import type { Metadata } from "next";
import { SalonApplicantsBoard } from "@/components/hiring/salon-applicants-board";

export const metadata: Metadata = {
  title: "Applicant",
};

export default function SalonApplicantsPage() {
  return <SalonApplicantsBoard />;
}
