import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { jsonError, jsonSuccess } from "@/lib/api";

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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return jsonError("Only JPEG, PNG, and WebP images are allowed", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return jsonError("File size must be less than 5MB", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(buffer);

    return jsonSuccess({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return jsonError("Failed to upload image", 500);
  }
}
