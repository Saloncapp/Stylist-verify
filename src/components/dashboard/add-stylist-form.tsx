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

      const employeeId = result.data?.stylist?.employeeId as string | undefined;
      if (result.data?.linked) {
        toast.success(
          employeeId
            ? `Employment added to existing profile ${employeeId}`
            : "Employment added to existing stylist profile"
        );
      } else {
        toast.success(
          employeeId
            ? `Stylist added successfully (${employeeId})`
            : "Stylist added successfully"
        );
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <StylistProfileForm
      variant="page"
      mode="create"
      title="Add New Stylist"
      submitLabel="Create stylist profile"
      onSubmit={onSubmit}
    />
  );
}
