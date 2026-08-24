import type { Metadata } from "next";
import { StylistInterestsBoard } from "@/components/stylist/stylist-interests-board";

export const metadata: Metadata = {
  title: "Interests",
};

export default function StylistInterestsPage() {
  return <StylistInterestsBoard />;
}
