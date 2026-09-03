import { redirect } from "next/navigation";

/** Legacy /recover URL → home Continue-with-Mobile recover step */
export default function RecoverAccountPage() {
  redirect("/?recover=1#continue-with-mobile");
}
