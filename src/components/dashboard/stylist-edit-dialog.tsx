"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StylistProfileForm } from "@/components/dashboard/stylist-profile-form";
import {
  createStylistProfileUpdateSchema,
  type StylistInput,
} from "@/lib/validations";
import type { StylistRecord } from "@/types";
import { toast } from "sonner";

interface StylistEditDialogProps {
  stylist: StylistRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (stylist: StylistRecord) => void;
}

export function StylistEditDialog({
  stylist,
  open,
  onOpenChange,
  onSaved,
}: StylistEditDialogProps) {
  const schema = useMemo(
    () => createStylistProfileUpdateSchema(stylist.status),
    [stylist.status]
  );

  const defaultValues = useMemo<Partial<StylistInput>>(
    () => ({
      name: stylist.name,
      mobileNumber: stylist.mobileNumber,
      level: stylist.level,
      role: stylist.role,
      employmentType: stylist.employmentType,
      aadhaarNumber: stylist.aadhaarNumber,
      address: stylist.address ?? "",
      photoUrl: stylist.photoUrl ?? "",
      status: stylist.status,
      remark: "",
    }),
    [stylist]
  );

  async function onSubmit(data: StylistInput) {
    try {
      const res = await fetch(`/api/stylists/${stylist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to update stylist");
        return;
      }

      toast.success("Stylist profile updated");
      const updated = result.data?.stylist as StylistRecord | undefined;
      if (updated) onSaved?.(updated);
      else onOpenChange(false);
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Stylist</DialogTitle>
          <DialogDescription>
            Update profile information for {stylist.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto overscroll-contain pr-1">
          <StylistProfileForm
            key={stylist.id}
            variant="embedded"
            idPrefix={`edit-${stylist.id}`}
            schema={schema}
            defaultValues={defaultValues}
            initialStatus={stylist.status}
            submitLabel="Save Changes"
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
