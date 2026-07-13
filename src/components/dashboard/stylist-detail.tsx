"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { statusUpdateSchema, type StatusUpdateInput } from "@/lib/validations";
import type { StylistRecord } from "@/types";
import { toast } from "sonner";
import { format } from "@/lib/date";

export function StylistDetail({ stylist }: { stylist: StylistRecord }) {
  const router = useRouter();
  const [showUpdate, setShowUpdate] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StatusUpdateInput>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { status: stylist.status },
  });

  const newStatus = watch("status");

  async function onSubmit(data: StatusUpdateInput) {
    try {
      const res = await fetch(`/api/stylists/${stylist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to update status");
        return;
      }

      toast.success("Status updated successfully");
      setShowUpdate(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
          <div className="relative size-28 overflow-hidden rounded-2xl border border-border">
            <Image
              src={stylist.photoUrl}
              alt={stylist.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <h1 className="text-2xl font-bold">{stylist.name}</h1>
              <StatusBadge status={stylist.status} />
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Mobile:</span>{" "}
                {stylist.mobileNumber}
              </p>
              <p>
                <span className="text-muted-foreground">Level:</span> {stylist.level}
              </p>
              <p>
                <span className="text-muted-foreground">Aadhaar:</span>{" "}
                {stylist.aadhaarNumber.replace(/(\d{4})(?=\d)/g, "$1 ")}
              </p>
              <p>
                <span className="text-muted-foreground">Joined:</span>{" "}
                {format(stylist.joiningDate)}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{stylist.address}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Update Status</CardTitle>
          {!showUpdate && (
            <Button variant="outline" size="sm" onClick={() => setShowUpdate(true)}>
              Change Status
            </Button>
          )}
        </CardHeader>
        {showUpdate && (
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select
                  defaultValue={stylist.status}
                  onValueChange={(v) =>
                    setValue("status", v as StatusUpdateInput["status"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Relieved">Relieved</SelectItem>
                    <SelectItem value="Abscond">Abscond</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(newStatus === "Relieved" || newStatus === "Abscond") && (
                <div className="space-y-2">
                  <Label htmlFor="remark">Remark</Label>
                  <Textarea
                    id="remark"
                    placeholder="Describe the reason..."
                    rows={3}
                    {...register("remark")}
                  />
                  {errors.remark && (
                    <p className="text-sm text-danger">{errors.remark.message}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUpdate(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Employment History</CardTitle>
        </CardHeader>
        <CardContent>
          {stylist.employmentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {[...stylist.employmentHistory].reverse().map((entry, index) => (
                <div
                  key={`${entry.updatedAt}-${index}`}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{entry.salonName}</p>
                    <StatusBadge status={entry.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Level: {entry.level}
                  </p>
                  {entry.joiningDate && (
                    <p className="text-sm text-muted-foreground">
                      Joined: {format(entry.joiningDate)}
                    </p>
                  )}
                  {entry.leavingDate && (
                    <p className="text-sm text-muted-foreground">
                      Left: {format(entry.leavingDate)}
                    </p>
                  )}
                  {entry.remark && (
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">Remark:</span>{" "}
                      {entry.remark}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
