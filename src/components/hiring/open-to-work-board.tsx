"use client";

import { OpenToWorkList } from "@/components/hiring/open-to-work-list";

export function OpenToWorkBoard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Open to Work Stylists
        </h1>
        <p className="text-muted-foreground">
          Browse stylists currently available for new opportunities.
        </p>
      </div>
      <OpenToWorkList showSendInterest />
    </div>
  );
}
