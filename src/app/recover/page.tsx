import type { Metadata } from "next";
import { RecoverAccountFlow } from "@/components/account/recover-account-flow";

export const metadata: Metadata = {
  title: "Recover Account",
};

export default function RecoverAccountPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-4 py-10">
      <RecoverAccountFlow />
    </div>
  );
}
