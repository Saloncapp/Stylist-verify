"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone } from "lucide-react";
import { CopyPhoneButton } from "@/components/copy-phone-button";
import { StylistAvatar } from "@/components/stylist-avatar";
import { SendInterestDialog } from "@/components/hiring/send-interest-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OpenToWorkTalentCard } from "@/types";
import { cn } from "@/lib/utils";

interface TalentCardProps {
  talent: OpenToWorkTalentCard;
  /** Borderless row layout for dashboard preview panels. */
  plain?: boolean;
  showCopyPhone?: boolean;
  showSendInterest?: boolean;
}

function PhoneRow({
  mobileNumber,
  showCopyPhone,
  phoneRevealed = false,
  className,
}: {
  mobileNumber: string;
  showCopyPhone?: boolean;
  phoneRevealed?: boolean;
  className?: string;
}) {
  const canCopy = showCopyPhone && phoneRevealed;

  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs sm:text-sm",
        className
      )}
    >
      <Phone className="size-3 shrink-0 text-[#2563EB]" aria-hidden="true" />
      <span
        className={cn(
          "text-muted-foreground",
          canCopy && "whitespace-nowrap"
        )}
      >
        {mobileNumber}
      </span>
      {canCopy ? <CopyPhoneButton value={mobileNumber} /> : null}
    </p>
  );
}

export function TalentCard({
  talent,
  plain = false,
  showCopyPhone = false,
  showSendInterest = false,
}: TalentCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const interestButton =
    showSendInterest && !plain ? (
      <Button
        type="button"
        size="sm"
        className="h-8 shrink-0 self-center rounded-full px-4 text-xs sm:h-9 sm:px-5 sm:text-sm"
        disabled={sent}
        onClick={() => setDialogOpen(true)}
      >
        {sent ? "Interest Sent" : "Interested"}
      </Button>
    ) : null;

  if (plain) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
      >
        <StylistAvatar
          name={talent.name}
          photoUrl={talent.photoUrl}
          size="md"
          alt={talent.name}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-black">{talent.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {talent.latestRole || "Stylist"}
            {talent.latestLevel ? ` · ${talent.latestLevel}` : ""}
          </p>
          {talent.address ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{talent.address}</span>
            </p>
          ) : null}
        </div>

        <PhoneRow
          mobileNumber={talent.mobileNumber}
          showCopyPhone={showCopyPhone}
          phoneRevealed={talent.phoneRevealed}
          className="shrink-0"
        />
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card className="h-full border-l-4 border-l-[#2563EB] shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex gap-3">
              <StylistAvatar
                name={talent.name}
                photoUrl={talent.photoUrl}
                size="lg"
                alt={talent.name}
              />
              <div
                className={cn(
                  "flex min-w-0 flex-1 gap-3",
                  interestButton ? "items-start justify-between" : "flex-col"
                )}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div>
                    <p className="truncate font-semibold text-black">
                      {talent.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {talent.latestRole || "Stylist"}
                      {talent.latestLevel ? ` · ${talent.latestLevel}` : ""}
                    </p>
                  </div>
                  <PhoneRow
                    mobileNumber={talent.mobileNumber}
                    showCopyPhone={showCopyPhone}
                    phoneRevealed={talent.phoneRevealed}
                  />
                  {talent.address ? (
                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 size-3 shrink-0" />
                      <span className="line-clamp-2">{talent.address}</span>
                    </p>
                  ) : null}
                </div>
                {interestButton}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {showSendInterest ? (
        <SendInterestDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          talent={talent}
          onSent={() => setSent(true)}
        />
      ) : null}
    </>
  );
}
