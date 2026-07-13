import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <>
      <Navbar variant="auth" />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <RegisterForm />
      </main>
    </>
  );
}
