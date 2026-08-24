"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Eye, Pencil, Phone } from "lucide-react";
import { StylistAvatar } from "@/components/stylist-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/link-button";
import { StatusBadge } from "@/components/status-badge";
import type { StylistRecord } from "@/types";

const StylistEditDialog = dynamic(
  () =>
    import("@/components/dashboard/stylist-edit-dialog").then(
      (mod) => mod.StylistEditDialog
    ),
  { ssr: false }
);

export function StylistTable({ stylists }: { stylists: StylistRecord[] }) {
  const [rows, setRows] = useState(stylists);
  const [editStylist, setEditStylist] = useState<StylistRecord | null>(null);

  useEffect(() => {
    setRows(stylists);
  }, [stylists]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] table-fixed text-sm">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[20%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Stylist
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Mobile
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Level
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((stylist) => (
                  <tr
                    key={stylist.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-4 align-middle sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <StylistAvatar
                          name={stylist.name}
                          photoUrl={stylist.photoUrl}
                          size="sm"
                          variant="profile"
                          className="size-10 shrink-0"
                          alt={stylist.name}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-black">
                            {stylist.name}
                          </p>
                          {stylist.employeeId ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {stylist.employeeId}
                            </p>
                          ) : stylist.role ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {stylist.role}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle sm:px-5">
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone
                          className="size-3.5 shrink-0 text-[#2563EB]"
                          aria-hidden="true"
                        />
                        <span className="truncate whitespace-nowrap">
                          {stylist.mobileNumber}
                        </span>
                      </p>
                    </td>
                    <td className="px-4 py-4 align-middle font-medium sm:px-5">
                      {stylist.level || "—"}
                    </td>
                    <td className="px-4 py-4 align-middle sm:px-5">
                      <StatusBadge status={stylist.status} />
                    </td>
                    <td className="px-4 py-4 align-middle sm:px-5">
                      <div className="flex items-center justify-center gap-2">
                        <LinkButton
                          href={`/dashboard/stylists/${stylist.id}`}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full px-3 text-xs"
                        >
                          <Eye className="mr-1 size-3.5" />
                          View
                        </LinkButton>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full px-3 text-xs"
                          onClick={() => setEditStylist(stylist)}
                        >
                          <Pencil className="mr-1 size-3.5" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {editStylist ? (
        <StylistEditDialog
          stylist={editStylist}
          open={Boolean(editStylist)}
          onOpenChange={(open) => {
            if (!open) setEditStylist(null);
          }}
          onSaved={(updated) => {
            setRows((prev) =>
              prev.map((row) => (row.id === updated.id ? updated : row))
            );
            setEditStylist((current) =>
              current?.id === updated.id ? updated : current
            );
          }}
        />
      ) : null}
    </>
  );
}
