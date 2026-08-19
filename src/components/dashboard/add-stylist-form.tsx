"use client";

import { useRouter } from "next/navigation";
import { StylistProfileForm } from "@/components/dashboard/stylist-profile-form";
import type { StylistInput } from "@/lib/validations";
import { toast } from "sonner";

export function AddStylistForm() {
  const router = useRouter();

  async function onSubmit(data: StylistInput) {
    try {
      const res = await fetch("/api/stylists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to add stylist");
        return;
      }

      toast.success("Stylist added successfully");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <StylistProfileForm
      variant="page"
      title="Add New Stylist"
      submitLabel="Add Stylist"
      onSubmit={onSubmit}
    />
  );
}
