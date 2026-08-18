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
        <VerifyForm />
      </main>
      <Footer />
    </>
  );
}
