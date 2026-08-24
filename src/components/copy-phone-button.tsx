"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyPhoneButtonProps {
  value: string;
  className?: string;
}

export function CopyPhoneButton({ value, className }: CopyPhoneButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value.replace(/\s/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* visual checkmark is sufficient feedback */
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className ?? "size-7 shrink-0 text-muted-foreground hover:text-foreground"}
      onClick={() => void handleCopy()}
      aria-label={copied ? "Phone number copied" : "Copy phone number"}
      title={copied ? "Copied" : "Copy phone number"}
    >
      {copied ? (
        <Check className="size-3.5 text-success" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
    </Button>
  );
}
