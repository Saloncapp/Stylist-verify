"use client";

import { useRef, useState, useTransition } from "react";
import { Briefcase } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OpenToWorkToggleProps {
  initialOpenToWork: boolean;
  className?: string;
  /** Compact control for dashboard header (before profile chip). */
  variant?: "card" | "header";
}

export function OpenToWorkToggle({
  initialOpenToWork,
  className,
  variant = "card",
}: OpenToWorkToggleProps) {
  const [openToWork, setOpenToWork] = useState(initialOpenToWork);
  const [pending, startTransition] = useTransition();
  const inFlight = useRef(false);

  function handleChange(checked: boolean) {
    if (inFlight.current) return;
    const previous = openToWork;
    setOpenToWork(checked);
    inFlight.current = true;
    startTransition(async () => {
      try {
        const res = await fetch("/api/me/stylist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ openToWork: checked }),
        });
        const result = await res.json();
        if (!result.success) {
          setOpenToWork(previous);
          toast.error(result.message || "Could not update Open to Work");
          return;
        }
      } catch {
        setOpenToWork(previous);
        toast.error("Something went wrong");
      } finally {
        inFlight.current = false;
      }
    });
  }

  if (variant === "header") {
    return (
      <div
        className={cn(
          "flex h-9 items-center gap-2 rounded-lg border px-2.5 text-sm font-medium transition-colors sm:px-3",
          openToWork
            ? "border-success/30 bg-success/10 text-success"
            : "border-border bg-card text-muted-foreground",
          className
        )}
        title={
          openToWork
            ? "Open to Work is on — salons can discover you"
            : "Turn on Open to Work so salons can discover you"
        }
      >
        <Briefcase className="size-3.5 shrink-0" aria-hidden="true" />
        <Label
          htmlFor="open-to-work-header"
          className={cn(
            "hidden cursor-pointer text-xs font-medium sm:inline",
            openToWork ? "text-success" : "text-muted-foreground"
          )}
        >
          Open to Work
        </Label>
        <Switch
          id="open-to-work-header"
          checked={openToWork}
          disabled={pending}
          onCheckedChange={handleChange}
          aria-label="Open to Work"
          className="scale-90 data-[checked]:bg-[#16A34A]"
        />
      </div>
    );
  }

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border",
              openToWork
                ? "border-success/30 bg-success/10 text-success"
                : "border-border bg-muted/40 text-muted-foreground"
            )}
          >
            <Briefcase className="size-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <Label
              htmlFor="open-to-work"
              className={cn(
                "text-base font-semibold",
                openToWork && "text-success"
              )}
            >
              Open to Work
            </Label>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When on, salons can see you in their hiring talent pool.
            </p>
          </div>
        </div>
        <Switch
          id="open-to-work"
          checked={openToWork}
          disabled={pending}
          onCheckedChange={handleChange}
          aria-label="Open to Work"
          className="data-[checked]:bg-[#16A34A]"
        />
      </CardContent>
    </Card>
  );
}
