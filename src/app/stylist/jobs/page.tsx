import type { Metadata } from "next";
import { JobsBoard } from "@/components/hiring/jobs-board";

export const metadata: Metadata = {
  title: "Jobs",
};

export default function StylistJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground">
          Open positions from salons. Tap I&apos;m Interested to apply.
        </p>
      </div>
      <JobsBoard pageSize={12} />
    </div>
  );
}
