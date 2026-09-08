"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LegalBackButton() {
  const router = useRouter();

  function handleBack() {
    const referrer = document.referrer;
    if (referrer && referrer.startsWith(window.location.origin)) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="mt-0.5 size-9 shrink-0 text-foreground hover:bg-primary/10 hover:text-primary sm:mt-1"
      aria-label="Go back"
      onClick={handleBack}
    >
      <ChevronLeft className="size-5" />
    </Button>
  );
}
