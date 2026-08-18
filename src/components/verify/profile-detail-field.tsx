"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DetailFieldProps {
  label: string;
  value: string;
  icon?: ReactNode;
  action?: ReactNode;
  valueClassName?: string;
  className?: string;
}

export function DetailField({
  label,
  value,
  icon,
  action,
  valueClassName,
  className,
}: DetailFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon ? <span className="text-muted-foreground/80">{icon}</span> : null}
        {label}
      </p>
      <div className="flex items-center gap-2">
        <p
          className={cn(
            "text-sm font-semibold text-foreground",
            valueClassName
          )}
        >
          {value}
        </p>
        {action}
      </div>
    </div>
  );
}

export function formatMobileDisplay(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return mobile;
}

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}
