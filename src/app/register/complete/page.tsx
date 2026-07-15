import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";

export const metadata: Metadata = {
  title: "Complete Profile",
};

export default function CompleteProfilePage() {
  return (
    <>
      <Navbar variant="auth" />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <CompleteProfileForm />
      </main>
    </>
  );
}
