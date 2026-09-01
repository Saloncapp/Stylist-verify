"use client";

import Link from "next/link";
import { ChevronRight, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  securityHref: string;
};

export function AccountSettingsLinks({ securityHref }: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <Link
          href={securityHref}
          className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/50 sm:px-6"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
            <Shield className="size-4 text-primary" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">
              Account Security
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Change phone number, recovery PIN, and more
            </span>
          </span>
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </Link>
      </CardContent>
    </Card>
  );
}
