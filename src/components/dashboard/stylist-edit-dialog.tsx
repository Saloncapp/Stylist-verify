"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardPen, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StylistProfileForm } from "@/components/dashboard/stylist-profile-form";
import { StylistPerformanceDialog } from "@/components/dashboard/stylist-performance-dialog";
import { StylistDocumentsDialog } from "@/components/dashboard/stylist-documents-dialog";
import { hasPerformanceInfo } from "@/lib/performance-ratings";
import {
  createStylistProfileUpdateSchema,
  stylistSchema,
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
  const [current, setCurrent] = useState(stylist);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);

  useEffect(() => {
    setCurrent(stylist);
  }, [stylist]);

  const schema = useMemo(
    () => createStylistProfileUpdateSchema(current.status ?? "Active"),
    [current.status]
  );

  const defaultValues = useMemo<Partial<StylistInput>>(
    () => ({
      name: current.name,
      mobileNumber: current.mobileNumber,
      level: current.level,
      role: current.role,
      employmentType: current.employmentType,
      aadhaarNumber: current.aadhaarNumber,
      address: current.address ?? "",
      photoUrl: current.photoUrl ?? "",
      status: current.status,
      remark: "",
    }),
    [current]
  );

  function handleUpdated(updated: StylistRecord) {
    setCurrent(updated);
    onSaved?.(updated);
  }

  async function onSubmit(data: StylistInput) {
    try {
      const res = await fetch(`/api/stylists/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          mobileNumber: current.mobileNumber,
          aadhaarNumber: current.aadhaarNumber,
        }),
      });
      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to update stylist");
        return;
      }

      toast.success("Stylist profile updated");
      const updated = result.data?.stylist as StylistRecord | undefined;
      if (updated) {
        handleUpdated(updated);
        onOpenChange(false);
      } else onOpenChange(false);
    } catch {
      toast.error("Something went wrong");
    }
  }

  const hasPerformance = hasPerformanceInfo(current);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle>Edit Stylist</DialogTitle>
            <DialogDescription>
              Update profile, performance, and documents for {current.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <StylistProfileForm
              key={current.id}
              variant="embedded"
              idPrefix={`edit-${current.id}`}
              schema={schema as typeof stylistSchema}
              defaultValues={defaultValues}
              initialStatus={current.status}
              submitLabel="Save Changes"
              onCancel={() => onOpenChange(false)}
              extraActions={
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => setPerformanceOpen(true)}
                  >
                    <ClipboardPen className="mr-1 size-3.5" />
                    {hasPerformance ? "Update Performance" : "Add Performance"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => setDocumentsOpen(true)}
                  >
                    <FileText className="mr-1 size-3.5" />
                    Documents
                  </Button>
                </>
              }
              onSubmit={onSubmit}
            />
          </div>
        </DialogContent>
      </Dialog>

      <StylistPerformanceDialog
        stylist={current}
        open={performanceOpen}
        onOpenChange={setPerformanceOpen}
        onSaved={handleUpdated}
      />
      <StylistDocumentsDialog
        stylist={current}
        open={documentsOpen}
        onOpenChange={setDocumentsOpen}
        onSaved={handleUpdated}
      />
    </>
  );
}
