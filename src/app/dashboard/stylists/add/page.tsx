import { redirect } from "next/navigation";

/** Legacy route — add stylist now opens as a modal from the dashboard. */
export default function AddStylistPage() {
  redirect("/dashboard?add=1");
}
