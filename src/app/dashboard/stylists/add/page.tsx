import type { Metadata } from "next";
import { AddStylistForm } from "@/components/dashboard/add-stylist-form";

export const metadata: Metadata = {
  title: "Add Stylist",
};

export default function AddStylistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Stylist</h1>
        <p className="text-muted-foreground">
          Register a new stylist to your salon records
        </p>
      </div>
      <AddStylistForm />
    </div>
  );
}
