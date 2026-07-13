import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { jsonError, jsonSuccess } from "@/lib/api";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function normalizeMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type.toLowerCase();
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".heif")) return "image/heif";
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

    if (!file) {
      return jsonError("No file provided", 400);
    }

    const mimeType = normalizeMimeType(file);

    if (!ALLOWED_TYPES.has(mimeType) && !mimeType.startsWith("image/")) {
      return jsonError("Only JPEG, PNG, and WebP images are allowed", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return jsonError("File size must be less than 5MB", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(buffer, mimeType);

    return jsonSuccess({ url });
  } catch (error) {
    console.error("Upload error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to upload image";

    if (message.includes("Cloudinary is not configured")) {
      return jsonError(message, 503);
    }

    return jsonError(message, 500);
  }
}
