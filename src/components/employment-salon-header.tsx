"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalonIdentity } from "@/components/salon-identity";
import { VisitSalonDialog } from "@/components/visit-salon-dialog";
import { employmentEntryToSalonVisit } from "@/lib/salon-visit";
import type {
  EmploymentHistoryEntry,
  VerificationEmploymentEntry,
  VerificationEmploymentPrivateEntry,
} from "@/types";
import { cn } from "@/lib/utils";

type EmploymentSalonEntry =
  | EmploymentHistoryEntry
  | VerificationEmploymentEntry
  | VerificationEmploymentPrivateEntry;

interface EmploymentSalonHeaderProps {
  entry: EmploymentSalonEntry;
  className?: string;
}

export function EmploymentSalonHeader({
  entry,
  className,
}: EmploymentSalonHeaderProps) {
  const [open, setOpen] = useState(false);
  const salonProfile = employmentEntryToSalonVisit(entry);

  return (
    <>
      <SalonIdentity
        salonName={entry.salonName}
        salonLogoUrl={entry.salonLogoUrl}
        salonType={entry.salonType}
        logoSize="sm"
        className={cn("min-w-0", className)}
        nameSuffix={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-primary transition-colors hover:bg-primary/10 hover:text-primary"
            onClick={() => setOpen(true)}
            aria-label="View salon profile"
            title="View salon profile"
          >
            <ExternalLink className="size-4" />
          </Button>
        }
      />

      <VisitSalonDialog
        salon={salonProfile}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
