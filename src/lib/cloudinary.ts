import { v2 as cloudinary } from "cloudinary";

function ensureCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export async function uploadImage(
  file: Buffer,
  mimeType = "image/jpeg",
  folder = "salon-staff"
): Promise<string> {
  ensureCloudinaryConfig();

  const dataUri = `data:${mimeType};base64,${file.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "auto" }],
  });

  if (!result.secure_url) {
    throw new Error("Cloudinary upload returned no URL");
  }

  return result.secure_url;
}

export { cloudinary };
