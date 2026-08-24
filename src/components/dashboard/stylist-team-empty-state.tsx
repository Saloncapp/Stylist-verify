import { Users } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { Card, CardContent } from "@/components/ui/card";

/** Shown on the salon Stylist tab when no stylists are registered yet. */
export function StylistTeamEmptyState() {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col items-center px-4 py-12 text-center sm:px-8 sm:py-16">
        <p className="text-sm font-medium text-muted-foreground">
          0 Stylists Registered
        </p>

        <div
          className="mt-4 flex size-14 items-center justify-center rounded-full sm:size-16"
          style={{ backgroundColor: "#2563EB1A" }}
        >
          <Users className="size-7 text-[#2563EB] sm:size-8" aria-hidden="true" />
        </div>

        <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
          Your stylist team is empty
        </h2>

        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Add existing stylists to your salon or find verified stylists who are
          open to work.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm font-semibold">
          <LinkButton
            href="/dashboard/stylists?add=1"
            variant="link"
            className="h-auto p-0 text-[#2563EB] underline-offset-4 hover:underline"
          >
            Add Stylist
          </LinkButton>
          <span className="px-1 text-muted-foreground" aria-hidden="true">
            ·
          </span>
          <LinkButton
            href="/dashboard/verify"
            variant="link"
            className="h-auto p-0 text-[#2563EB] underline-offset-4 hover:underline"
          >
            Find Stylists
          </LinkButton>
        </div>
      </CardContent>
    </Card>
  );
}
