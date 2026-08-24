"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VerifyStylistForm } from "@/components/dashboard/verify-stylist-form";

interface SearchStylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchStylistDialog({
  open,
  onOpenChange,
}: SearchStylistDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-1 border-b border-border px-5 py-4 sm:px-6">
          <DialogTitle>Search Stylist</DialogTitle>
          <DialogDescription>
            Search verified stylist records by Aadhaar or mobile number.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          <VerifyStylistForm embedded />
        </div>
      </DialogContent>
    </Dialog>
  );
}
