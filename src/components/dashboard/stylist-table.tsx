"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/link-button";
import { StatusBadge } from "@/components/status-badge";
import type { StylistRecord } from "@/types";

export function StylistTable({ stylists }: { stylists: StylistRecord[] }) {
  if (stylists.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No stylists registered yet.</p>
          <LinkButton href="/dashboard/stylists/add" className="mt-4">
            Add Your First Stylist
          </LinkButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium">Stylist</th>
                <th className="px-4 py-3 text-left font-medium">Mobile</th>
                <th className="px-4 py-3 text-left font-medium">Level</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stylists.map((stylist) => (
                <tr key={stylist.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 overflow-hidden rounded-full bg-muted">
                        {stylist.photoUrl ? (
                          <Image
                            src={stylist.photoUrl}
                            alt={stylist.name}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="font-medium">{stylist.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {stylist.mobileNumber}
                  </td>
                  <td className="px-4 py-3">{stylist.level}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={stylist.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <LinkButton
                      href={`/dashboard/stylists/${stylist.id}`}
                      variant="ghost"
                      size="sm"
                    >
                      <Eye className="mr-1 size-4" />
                      View
                    </LinkButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
