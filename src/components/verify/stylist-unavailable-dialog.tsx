"use client";

import Link from "next/link";
import { ExternalLink, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AUTH_HREF = "/#continue-with-mobile";

interface StylistUnavailableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Popup when public verify search finds no stylist record.
 */
export function StylistUnavailableDialog({
  open,
  onOpenChange,
}: StylistUnavailableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-5 p-5 sm:max-w-md sm:p-6"
        showCloseButton
      >
        <DialogHeader className="items-center gap-3 text-center sm:items-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-warning/15 text-warning">
            <TriangleAlert className="size-6" />
          </div>
          <DialogTitle className="text-lg font-semibold tracking-tight text-warning sm:text-xl">
            Stylist information is currently unavailable
          </DialogTitle>
        </DialogHeader>

        <DialogFooter className="mx-0 mb-0 flex-col items-center gap-2 rounded-none border-0 bg-transparent p-0 sm:flex-col sm:justify-stretch">
          <p className="text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Register or login your salon with mobile OTP to add this stylist to
            your salon.
          </p>
          <Link
            href={AUTH_HREF}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => onOpenChange(false)}
          >
            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
            Try another option
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
