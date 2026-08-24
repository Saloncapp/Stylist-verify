import { redirect } from "next/navigation";

/**
 * Legacy /login URL — disabled.
 * Auth entry is the home page Continue-with-Mobile flow (`/`).
 */
export default function LoginPage() {
  redirect("/");
}
