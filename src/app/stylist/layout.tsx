import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  CLEAR_SESSION_PATH,
  requireStylistSession,
  toStylistAccount,
} from "@/lib/auth";
import { getAadhaarFromRecord, maskAadhaar } from "@/lib/aadhaar-crypto";
import InterestRequest from "@/models/InterestRequest";
import Stylist from "@/models/Stylist";
import { StylistHeader } from "@/components/stylist/stylist-header";
import { StylistSidebar } from "@/components/stylist/stylist-sidebar";
import { DASHBOARD_INTERACTIVE_CLASS } from "@/lib/dashboard-layout";
import { cn } from "@/lib/utils";
import type { StylistAccount } from "@/types";

async function getStylistUser(): Promise<
  | { stylist: StylistAccount; pendingInterestCount: number }
  | "unauthenticated"
  | "invalid"
> {
  const session = await requireStylistSession();
  if (!session?.stylistId) return "unauthenticated";

  await connectDB();
  const stylist = await Stylist.findById(session.stylistId);
  if (!stylist) return "invalid";

  let aadhaarMasked: string | undefined;
  try {
    aadhaarMasked = maskAadhaar(getAadhaarFromRecord(stylist));
  } catch {
    aadhaarMasked = undefined;
  }

  const pendingInterestCount = await InterestRequest.countDocuments({
    stylistId: session.stylistId,
    status: "pending",
  });

  return {
    stylist: toStylistAccount({
      ...stylist.toObject(),
      aadhaarMasked,
    }),
    pendingInterestCount,
  };
}

export default async function StylistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getStylistUser();

  if (result === "unauthenticated" || result === "invalid") {
    // Route Handler clears the cookie (layouts cannot mutate cookies).
    redirect(CLEAR_SESSION_PATH);
  }

  return (
    <div
      className={cn("flex min-h-full bg-muted/30", DASHBOARD_INTERACTIVE_CLASS)}
    >
      <StylistSidebar
        pendingInterestCount={result.pendingInterestCount}
        className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r lg:flex"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <StylistHeader
          stylist={result.stylist}
          pendingInterestCount={result.pendingInterestCount}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
