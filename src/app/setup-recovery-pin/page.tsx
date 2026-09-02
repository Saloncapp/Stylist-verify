import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SetupRecoveryPinPageClient } from "@/components/account/setup-recovery-pin-page-client";

export const metadata: Metadata = {
  title: "Set Up Recovery PIN",
};

export default function SetupRecoveryPinPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="sr-only">
          <CardTitle>Set up recovery PIN</CardTitle>
          <CardDescription>
            Secure your account with a 6-digit recovery PIN
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <SetupRecoveryPinPageClient />
        </CardContent>
      </Card>
    </main>
  );
}
