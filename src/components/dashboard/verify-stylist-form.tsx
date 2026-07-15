"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Search, Users } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status-badge";
import { verifySchema, type VerifyInput } from "@/lib/validations";
import { handleDigitInput } from "@/lib/digit-input";
import type { VerifiedStylistPrivateResult } from "@/types";
import { format } from "@/lib/date";
import { toast } from "sonner";

interface PrivateVerifyResult {
  found: boolean;
  stylists: VerifiedStylistPrivateResult[];
  multiple?: boolean;
}

function PrivateStylistResultCard({
  stylist,
}: {
  stylist: VerifiedStylistPrivateResult;
}) {
  return (
    <div className="space-y-4">
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
              <h2 className="text-2xl font-bold">{stylist.name}</h2>
              <StatusBadge status={stylist.status} />
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Mobile:</span>{" "}
                {stylist.mobileNumber}
              </p>
              <p>
                <span className="text-muted-foreground">Level:</span>{" "}
                {stylist.level}
              </p>
              <p>
                <span className="text-muted-foreground">Aadhaar:</span>{" "}
                {stylist.aadhaarMasked}
              </p>
              <p>
                <span className="text-muted-foreground">Current Status:</span>{" "}
                {stylist.status}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{stylist.address}</p>
          </div>
        </CardContent>
      </Card>

      {stylist.employmentHistory.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Employment History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stylist.employmentHistory.map((entry, index) => (
              <div
                key={`${entry.salonId}-${entry.updatedAt}-${index}`}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{entry.salonName}</p>
                  <StatusBadge status={entry.status} />
                </div>
                <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {entry.stylistName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Mobile:</span>{" "}
                    {entry.mobileNumber}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Level:</span>{" "}
                    {entry.level}
                  </p>
                </div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function VerifyStylistForm() {
  const [result, setResult] = useState<PrivateVerifyResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchType, setSearchType] = useState<"aadhaar" | "mobile">("aadhaar");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
  });

  async function onSubmit(data: VerifyInput) {
    try {
      const payload =
        searchType === "aadhaar"
          ? { aadhaarNumber: data.aadhaarNumber }
          : { mobileNumber: data.mobileNumber };

      const res = await fetch("/api/verify/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await res.json();

      if (!response.success) {
        toast.error(response.message || "Verification failed");
        return;
      }

      setResult(response.data);
      setSearched(true);
    } catch {
      toast.error("Something went wrong");
    }
  }

  function handleTabChange(value: string) {
    setSearchType(value as "aadhaar" | "mobile");
    reset();
    setResult(null);
    setSearched(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Search Stylist Records</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter Aadhaar or mobile number to view full stylist details
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={searchType} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="aadhaar">Aadhaar Number</TabsTrigger>
              <TabsTrigger value="mobile">Mobile Number</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <TabsContent value="aadhaar" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-aadhaarNumber">Aadhaar Number</Label>
                  <Input
                    id="dashboard-aadhaarNumber"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={12}
                    placeholder="12-digit Aadhaar number"
                    {...register("aadhaarNumber", {
                      onChange: (e) => handleDigitInput(e, 12),
                    })}
                  />
                  {errors.aadhaarNumber && (
                    <p className="text-sm text-danger">
                      {errors.aadhaarNumber.message}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="mobile" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-mobileNumber">Mobile Number</Label>
                  <Input
                    id="dashboard-mobileNumber"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    {...register("mobileNumber", {
                      onChange: (e) => handleDigitInput(e, 10),
                    })}
                  />
                  {errors.mobileNumber && (
                    <p className="text-sm text-danger">
                      {errors.mobileNumber.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Multiple stylists may share the same mobile number. All
                    matching records will be shown.
                  </p>
                </div>
              </TabsContent>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Search className="mr-2 size-4" />
                )}
                Verify Stylist
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>

      {searched && result && !result.found && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert>
            <AlertDescription className="text-center text-base">
              No stylist record found.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {searched && result?.found && result.stylists.length > 0 && (
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {result.multiple && (
            <Alert>
              <Users className="size-4" />
              <AlertDescription>
                {result.stylists.length} stylists found with this mobile number.
                Review each record below.
              </AlertDescription>
            </Alert>
          )}

          {result.stylists.map((stylist, index) => (
            <PrivateStylistResultCard
              key={`${stylist.aadhaarMasked}-${index}`}
              stylist={stylist}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
