"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddStylist } from "@/components/dashboard/add-stylist-provider";
import { cn } from "@/lib/utils";

export function AddStylistButton({
  className,
  variant = "default",
  size = "default",
}: {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const { openAddStylist } = useAddStylist();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={openAddStylist}
    >
      <Plus className="mr-2 size-4" />
      Add Stylist
    </Button>
  );
}
