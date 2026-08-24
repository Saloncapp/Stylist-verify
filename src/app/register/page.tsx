import { redirect } from "next/navigation";

/** Legacy route — registration is inline on the home Continue-with-Mobile card. */
export default function RegisterPage() {
  redirect("/");
}
