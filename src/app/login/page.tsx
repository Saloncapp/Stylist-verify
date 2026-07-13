import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <>
      <Navbar variant="auth" />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <LoginForm />
      </main>
    </>
  );
}
