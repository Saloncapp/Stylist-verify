"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { stylistSchema, type StylistInput } from "@/lib/validations";
import { handleDigitInput } from "@/lib/digit-input";
import { toast } from "sonner";

export function AddStylistForm() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StylistInput>({
    resolver: zodResolver(stylistSchema),
    defaultValues: {
      level: "L1",
      status: "Active",
      photoUrl: "",
    },
  });

  const status = watch("status");

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Upload failed");
        return;
      }

      setPhotoUrl(data.data.url);
      setValue("photoUrl", data.data.url, { shouldValidate: true });
      toast.success("Photo uploaded");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: StylistInput) {
    try {
      const res = await fetch("/api/stylists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to add stylist");
        return;
      }

      toast.success("Stylist added successfully");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Add New Stylist</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Stylist Name</Label>
            <Input id="name" placeholder="Full name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-danger">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                placeholder="10-digit mobile"
                {...register("mobileNumber", {
                  onChange: (e) => handleDigitInput(e, 10),
                })}
              />
              {errors.mobileNumber && (
                <p className="text-sm text-danger">{errors.mobileNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Stylist Level</Label>
              <Select
                defaultValue="L1"
                onValueChange={(v) =>
                  setValue("level", v as StylistInput["level"], { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["L1", "L2", "L3", "L4"].map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.level && (
                <p className="text-sm text-danger">{errors.level.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
            <Input
              id="aadhaarNumber"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={12}
              placeholder="12-digit Aadhaar"
              {...register("aadhaarNumber", {
                onChange: (e) => handleDigitInput(e, 12),
              })}
            />
            {errors.aadhaarNumber && (
              <p className="text-sm text-danger">{errors.aadhaarNumber.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Same stylist can be enrolled at multiple salons. Aadhaar cannot be
              registered twice at the same salon.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Full address"
              rows={3}
              {...register("address")}
            />
            {errors.address && (
              <p className="text-sm text-danger">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Staff Photo</Label>
            <div className="flex items-center gap-4">
              {photoUrl && (
                <div className="relative size-20 overflow-hidden rounded-xl border border-border">
                  <Image src={photoUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Upload className="size-4" />
                {uploading ? "Uploading..." : "Upload Photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            {errors.photoUrl && (
              <p className="text-sm text-danger">{errors.photoUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              defaultValue="Active"
              onValueChange={(v) =>
                setValue("status", v as StylistInput["status"], { shouldValidate: true })
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

          {(status === "Relieved" || status === "Abscond") && (
            <div className="space-y-2">
              <Label htmlFor="remark">Remark</Label>
              <Textarea
                id="remark"
                placeholder="Describe the reason for this status..."
                rows={3}
                {...register("remark")}
              />
              {errors.remark && (
                <p className="text-sm text-danger">{errors.remark.message}</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || uploading}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Add Stylist
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
