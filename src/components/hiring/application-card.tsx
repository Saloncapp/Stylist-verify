"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MapPin, Phone } from "lucide-react";
import { useAddStylist } from "@/components/dashboard/add-stylist-provider";
import { StylistAvatar } from "@/components/stylist-avatar";
import { ApplicationStatusBadge } from "@/components/hiring/application-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ApplicationStatus, HiringApplicationCard } from "@/types";
import { getApplicationStatusColor } from "@/components/hiring/application-status-badge";
import { toast } from "sonner";

interface ApplicationCardProps {
  application: HiringApplicationCard;
  onStatusChange?: (
    id: string,
    status: ApplicationStatus
  ) => void;
}

export function ApplicationCard({
  application,
  onStatusChange,
}: ApplicationCardProps) {
  const { openHireApplicant } = useAddStylist();
  const [busy, setBusy] = useState(false);
  const accentColor = getApplicationStatusColor(application.status);

  async function rejectApplication() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected" }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Could not update status");
        return;
      }
      onStatusChange?.(application.id, "Rejected");
      toast.success("Application rejected");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="h-full shadow-sm"
        style={{ borderLeft: `4px solid ${accentColor}` }}
      >
        <CardContent className="flex h-full flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <StylistAvatar
              name={application.stylistName}
              photoUrl={application.stylistPhotoUrl}
              size="md"
              alt={application.stylistName}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {application.stylistName}
              </p>
              <p className="text-sm text-muted-foreground">
                {application.latestRole || "Stylist"} · for{" "}
                {application.jobRole}
              </p>
            </div>
            <ApplicationStatusBadge status={application.status} />
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="size-3 shrink-0 text-[#2563EB]" />
            <span className="whitespace-nowrap">{application.stylistMobile}</span>
          </p>
          {application.stylistAddress ? (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3 shrink-0" />
              <span className="line-clamp-2">{application.stylistAddress}</span>
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            {application.status === "Interested" ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    openHireApplicant(application, (updated) => {
                      if (updated) {
                        onStatusChange?.(updated.id, updated.status);
                      }
                    })
                  }
                >
                  Hire
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void rejectApplication()}
                >
                  {busy ? (
                    <Loader2 className="mr-1 size-3.5 animate-spin" />
                  ) : null}
                  Reject
                </Button>
              </>
            ) : null}
            {application.status === "Rejected" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  if (busy) return;
                  setBusy(true);
                  try {
                    const res = await fetch(
                      `/api/applications/${application.id}`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "Interested" }),
                      }
                    );
                    const result = await res.json();
                    if (!result.success) {
                      toast.error(result.message || "Could not update status");
                      return;
                    }
                    onStatusChange?.(application.id, "Interested");
                    toast.success("Marked as Interested");
                  } catch {
                    toast.error("Something went wrong");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Restore
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
