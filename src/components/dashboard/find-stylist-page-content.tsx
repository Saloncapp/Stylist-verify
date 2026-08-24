"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenToWorkList } from "@/components/hiring/open-to-work-list";
import { SearchStylistDialog } from "@/components/dashboard/search-stylist-dialog";

export function FindStylistPageContent() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Find Stylist</h1>
          <p className="text-muted-foreground">
            Browse stylists currently Open to Work and search verified records
            when you need a specific match.
          </p>
        </div>
        <Button
          type="button"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="mr-2 size-4" />
          Search Stylist
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">Open to Work</h2>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ color: "#16A34A", backgroundColor: "#16A34A1A" }}
          >
            Available
          </span>
        </div>
        <OpenToWorkList showSendInterest />
      </div>

      <SearchStylistDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
