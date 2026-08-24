"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPLOYMENT_TYPES,
  STYLIST_ROLES,
} from "@/lib/employment-constants";
import {
  createJobSchema,
  type CreateJobInput,
} from "@/lib/validations";
import type { HiringJobCard } from "@/types";
import { toast } from "sonner";

interface PostJobDialogProps {
  onCreated?: (job: HiringJobCard) => void;
}

export function PostJobDialog({ onCreated }: PostJobDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      role: "Stylist",
      employmentType: "Full-time",
      description: "",
    },
  });

  async function onSubmit(data: CreateJobInput) {
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Could not post position");
        return;
      }
      onCreated?.(result.data.job as HiringJobCard);
      toast.success("Position posted");
      form.reset({
        role: "Stylist",
        employmentType: "Full-time",
        description: "",
      });
      setOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Post a position
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a position</DialogTitle>
          <DialogDescription>
            Stylists will see this under Recent Jobs and can express interest.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => void onSubmit(values))}
        >
          <div className="space-y-1.5">
            <Label>Role / Position</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(v) =>
                form.setValue("role", v as CreateJobInput["role"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {STYLIST_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-destructive">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Employment type</Label>
              <Select
                value={form.watch("employmentType")}
                onValueChange={(v) =>
                  form.setValue(
                    "employmentType",
                    v as CreateJobInput["employmentType"],
                    { shouldValidate: true }
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Level (optional)</Label>
              <Select
                value={form.watch("level") ?? null}
                onValueChange={(v) =>
                  form.setValue(
                    "level",
                    (v as CreateJobInput["level"]) || undefined,
                    { shouldValidate: true }
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {(["L1", "L2", "L3", "L4"] as const).map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-description">Description</Label>
            <Textarea
              id="job-description"
              rows={4}
              placeholder="What you're looking for, schedule, experience…"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Post position
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
