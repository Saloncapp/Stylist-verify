"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Loader2, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StylistRecord } from "@/types";
import { toast } from "sonner";

interface StylistDocumentsDialogProps {
  stylist: StylistRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (stylist: StylistRecord) => void;
}

type DocumentField = "experienceCertificateUrl" | "relievingLetterUrl";

const ACCEPT =
  "application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp";

export function StylistDocumentsDialog({
  stylist,
  open,
  onOpenChange,
  onSaved,
}: StylistDocumentsDialogProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(stylist);
  const [uploading, setUploading] = useState<DocumentField | null>(null);

  useEffect(() => {
    if (open) setCurrent(stylist);
  }, [open, stylist]);

  async function uploadAndSave(field: DocumentField, file: File) {
    setUploading(field);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "document");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const uploadResult = await uploadRes.json();

      if (!uploadResult.success) {
        toast.error(uploadResult.message || "Failed to upload document");
        return;
      }

      const res = await fetch(`/api/stylists/${stylist.id}/documents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: uploadResult.data.url }),
      });
      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to save document");
        return;
      }

      const updated = result.data?.stylist as StylistRecord | undefined;
      if (updated) {
        setCurrent(updated);
        onSaved?.(updated);
      }

      toast.success(
        current[field]
          ? "Document replaced"
          : "Document uploaded"
      );
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUploading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Documents</DialogTitle>
          <DialogDescription>
            Optional employment documents for {current.name}. These stay with
            your salon&apos;s employment record and appear during verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <DocumentSlot
            title="Experience Certificate"
            url={current.experienceCertificateUrl}
            uploading={uploading === "experienceCertificateUrl"}
            disabled={uploading !== null}
            onFile={(file) =>
              uploadAndSave("experienceCertificateUrl", file)
            }
          />
          <DocumentSlot
            title="Relieving Letter"
            url={current.relievingLetterUrl}
            uploading={uploading === "relievingLetterUrl"}
            disabled={uploading !== null}
            onFile={(file) => uploadAndSave("relievingLetterUrl", file)}
          />
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentSlot({
  title,
  url,
  uploading,
  disabled,
  onFile,
}: {
  title: string;
  url?: string;
  uploading: boolean;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasDocument = Boolean(url);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      toast.error("Upload a PDF or image (JPEG, PNG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    onFile(file);
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Optional · PDF or image, up to 10MB
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {hasDocument && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ExternalLink className="mr-1 size-4" />
            View document
          </a>
        )}

        <Button
          type="button"
          variant={hasDocument ? "outline" : "default"}
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : hasDocument ? (
            <FileText className="mr-1 size-4" />
          ) : (
            <Upload className="mr-1 size-4" />
          )}
          {uploading
            ? "Uploading..."
            : hasDocument
              ? "Replace"
              : "Upload"}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
