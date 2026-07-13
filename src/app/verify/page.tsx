import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { VerifyForm } from "@/components/verify/verify-form";

export const metadata: Metadata = {
  title: "Verify Stylist",
};

export default function VerifyPage() {
  return (
    <>
      <Navbar variant="auth" />
      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight">Stylist Verification</h1>
          <p className="mt-2 text-muted-foreground">
            Look up verified employment records before making a hiring decision
          </p>
        </div>
        <VerifyForm />
      </main>
      <Footer />
    </>
  );
}
