import { redirect } from "next/navigation";

/** Legacy Hiring hub → Jobs. */
export default function HiringRedirectPage() {
  redirect("/dashboard/jobs");
}
