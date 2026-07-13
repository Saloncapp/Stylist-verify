import { clearSessionCookie } from "@/lib/auth";
import { jsonSuccess } from "@/lib/api";

export async function POST() {
  await clearSessionCookie();
  return jsonSuccess({ message: "Logged out successfully" });
}
