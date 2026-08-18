import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadDocument, uploadImage } from "@/lib/cloudinary";
import { jsonError, jsonSuccess } from "@/lib/api";

export const runtime = "nodejs";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const DOCUMENT_TYPES = new Set([
  ...IMAGE_TYPES,
  "application/pdf",
]);

function normalizeMimeType(file: File, purpose: string): string {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type.toLowerCase();
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".heif")) return "image/heif";
  if (purpose === "document" && name.endsWith(".jpg")) return "image/jpeg";
  return "image/jpeg";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("Not authenticated", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const purpose = String(formData.get("purpose") ?? "image").toLowerCase();
    const isDocument = purpose === "document";

    if (!file) {
      return jsonError("No file provided", 400);
    }

    const mimeType = normalizeMimeType(file, purpose);
    const allowedTypes = isDocument ? DOCUMENT_TYPES : IMAGE_TYPES;
    const isAllowedType =
      allowedTypes.has(mimeType) ||
      (!isDocument && mimeType.startsWith("image/"));

    if (!isAllowedType) {
      return jsonError(
        isDocument
          ? "Only PDF, JPEG, PNG, and WebP files are allowed"
          : "Only JPEG, PNG, and WebP images are allowed",
        400
      );
    }

    const maxBytes = isDocument ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return jsonError(
        isDocument
          ? "File size must be less than 10MB"
          : "File size must be less than 5MB",
        400
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = isDocument
      ? await uploadDocument(buffer, mimeType)
      : await uploadImage(buffer, mimeType);

    return jsonSuccess({ url });
  } catch (error) {
    console.error("Upload error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to upload image";

    if (message.includes("Cloudinary is not configured")) {
      return jsonError(message, 503);
    }

    return jsonError(message, 500);
  }
}
