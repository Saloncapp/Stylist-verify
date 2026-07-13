import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const key = process.env.AADHAAR_ENCRYPTION_KEY;
  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "AADHAAR_ENCRYPTION_KEY must be set to 64 hex characters (32 bytes)"
    );
  }
  return Buffer.from(key, "hex");
}

function getHashKey(): Buffer {
  const key = process.env.AADHAAR_HASH_KEY ?? process.env.AADHAAR_ENCRYPTION_KEY;
  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "AADHAAR_ENCRYPTION_KEY (or AADHAAR_HASH_KEY) must be 64 hex characters"
    );
  }
  return Buffer.from(key, "hex");
}

/** Deterministic hash for database lookup — never reversible */
export function hashAadhaar(aadhaar: string): string {
  return createHmac("sha256", getHashKey()).update(aadhaar).digest("hex");
}

/** AES-256-GCM encrypt for secure storage */
export function encryptAadhaar(aadhaar: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(aadhaar, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

/** Decrypt stored Aadhaar (authorized server-side use only) */
export function decryptAadhaar(encrypted: string): string {
  const [ivB64, tagB64, dataB64] = encrypted.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted Aadhaar format");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function prepareAadhaarStorage(aadhaar: string) {
  return {
    aadhaarHash: hashAadhaar(aadhaar),
    aadhaarEncrypted: encryptAadhaar(aadhaar),
  };
}

/** Public display: only last 4 digits visible */
export function maskAadhaar(aadhaar: string): string {
  const digits = aadhaar.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX XXXX XXXX";
  return `XXXX XXXX ${digits.slice(-4)}`;
}

export function getAadhaarFromRecord(record: {
  aadhaarEncrypted?: string;
  aadhaarNumber?: string;
}): string {
  if (record.aadhaarEncrypted) {
    return decryptAadhaar(record.aadhaarEncrypted);
  }
  if (record.aadhaarNumber) {
    return record.aadhaarNumber;
  }
  throw new Error("No Aadhaar data on record");
}

export function getAadhaarGroupKey(record: {
  aadhaarHash?: string;
  aadhaarEncrypted?: string;
  aadhaarNumber?: string;
}): string {
  if (record.aadhaarHash) return record.aadhaarHash;
  if (record.aadhaarEncrypted) return hashAadhaar(decryptAadhaar(record.aadhaarEncrypted));
  if (record.aadhaarNumber) return hashAadhaar(record.aadhaarNumber);
  throw new Error("No Aadhaar data on record");
}
