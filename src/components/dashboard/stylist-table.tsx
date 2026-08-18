"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ClipboardPen, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/link-button";
import { StatusBadge } from "@/components/status-badge";
import { StylistPerformanceDialog } from "@/components/dashboard/stylist-performance-dialog";
import { StylistDocumentsDialog } from "@/components/dashboard/stylist-documents-dialog";
import { hasPerformanceInfo } from "@/lib/formatters";
import type { StylistRecord } from "@/types";

export function StylistTable({ stylists }: { stylists: StylistRecord[] }) {
  const [rows, setRows] = useState(stylists);
  const [performanceStylist, setPerformanceStylist] =
    useState<StylistRecord | null>(null);
  const [documentsStylist, setDocumentsStylist] =
    useState<StylistRecord | null>(null);

  useEffect(() => {
    setRows(stylists);
  }, [stylists]);

  if (rows.length === 0) {
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
    <>
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
                {rows.map((stylist) => {
                  const hasPerformance = hasPerformanceInfo(stylist);
                  return (
                    <tr
                      key={stylist.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted">
                            {stylist.photoUrl ? (
                              <Image
                                src={stylist.photoUrl}
                                alt={stylist.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground">
                                {stylist.name.charAt(0).toUpperCase()}
                              </span>
                            )}
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPerformanceStylist(stylist)}
                          >
                            <ClipboardPen className="mr-1 size-4" />
                            {hasPerformance
                              ? "Update Performance"
                              : "Add Performance"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDocumentsStylist(stylist)}
                          >
                            <FileText className="mr-1 size-4" />
                            Document
                          </Button>
                          <LinkButton
                            href={`/dashboard/stylists/${stylist.id}`}
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="mr-1 size-4" />
                            View
                          </LinkButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {performanceStylist && (
        <StylistPerformanceDialog
          stylist={performanceStylist}
          open={Boolean(performanceStylist)}
          onOpenChange={(open) => {
            if (!open) setPerformanceStylist(null);
          }}
          onSaved={(updated) => {
            setRows((prev) =>
              prev.map((row) => (row.id === updated.id ? updated : row))
            );
            setPerformanceStylist(null);
          }}
        />
      )}
      {documentsStylist && (
        <StylistDocumentsDialog
          stylist={documentsStylist}
          open={Boolean(documentsStylist)}
          onOpenChange={(open) => {
            if (!open) setDocumentsStylist(null);
          }}
          onSaved={(updated) => {
            setRows((prev) =>
              prev.map((row) => (row.id === updated.id ? updated : row))
            );
            setDocumentsStylist(updated);
          }}
        />
      )}
    </>
  );
}
