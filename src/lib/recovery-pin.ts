import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { normalizeIndianMobile } from "@/lib/phone";
import Salon from "@/models/Salon";
import Stylist from "@/models/Stylist";

export const RECOVERY_PIN_LENGTH = 6;
export const MAX_RECOVERY_PIN_ATTEMPTS = 3;
export const RECOVERY_PIN_LOCK_MS = 24 * 60 * 60 * 1000;

export function isValidRecoveryPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export async function hashRecoveryPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function verifyRecoveryPin(
  pin: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export type AccountRecoveryRecord = {
  role: "salon" | "stylist";
  accountId: string;
  phone: string;
  firebaseUid?: string;
  recoveryPinHash?: string;
  recoveryPinFailedAttempts: number;
  recoveryPinLockedUntil?: Date;
};

export async function findAccountByPhone(
  phone: string
): Promise<AccountRecoveryRecord | null> {
  const normalized = normalizeIndianMobile(phone);
  if (!normalized) return null;

  await connectDB();

  const salon = await Salon.findOne({ salonNumber: normalized }).select(
    "+recoveryPinHash"
  );
  if (salon) {
    return {
      role: "salon",
      accountId: String(salon._id),
      phone: normalized,
      firebaseUid: salon.firebaseUid,
      recoveryPinHash: salon.recoveryPinHash,
      recoveryPinFailedAttempts: salon.recoveryPinFailedAttempts ?? 0,
      recoveryPinLockedUntil: salon.recoveryPinLockedUntil,
    };
  }

  const stylist = await Stylist.findOne({ mobileNumber: normalized }).select(
    "+recoveryPinHash"
  );
  if (stylist) {
    return {
      role: "stylist",
      accountId: String(stylist._id),
      phone: normalized,
      firebaseUid: stylist.firebaseUid,
      recoveryPinHash: stylist.recoveryPinHash,
      recoveryPinFailedAttempts: stylist.recoveryPinFailedAttempts ?? 0,
      recoveryPinLockedUntil: stylist.recoveryPinLockedUntil,
    };
  }

  return null;
}

export function isRecoveryPinLocked(account: AccountRecoveryRecord): boolean {
  if (!account.recoveryPinLockedUntil) return false;
  return account.recoveryPinLockedUntil.getTime() > Date.now();
}

export function recoveryPinLockMessage(lockedUntil: Date): string {
  const hours = Math.max(
    1,
    Math.ceil((lockedUntil.getTime() - Date.now()) / (60 * 60 * 1000))
  );
  return `Too many failed attempts. Try again in about ${hours} hour${hours === 1 ? "" : "s"}.`;
}

export async function recordRecoveryPinFailure(
  account: AccountRecoveryRecord
): Promise<{ locked: boolean; attemptsRemaining: number; lockedUntil?: Date }> {
  await connectDB();
  const nextAttempts = account.recoveryPinFailedAttempts + 1;
  const shouldLock = nextAttempts >= MAX_RECOVERY_PIN_ATTEMPTS;
  const lockedUntil = shouldLock
    ? new Date(Date.now() + RECOVERY_PIN_LOCK_MS)
    : undefined;

  const update = {
    recoveryPinFailedAttempts: shouldLock ? 0 : nextAttempts,
    recoveryPinLockedUntil: lockedUntil,
  };

  if (account.role === "salon") {
    await Salon.updateOne({ _id: account.accountId }, { $set: update });
  } else {
    await Stylist.updateOne({ _id: account.accountId }, { $set: update });
  }

  return {
    locked: shouldLock,
    attemptsRemaining: shouldLock
      ? 0
      : MAX_RECOVERY_PIN_ATTEMPTS - nextAttempts,
    lockedUntil,
  };
}

export async function resetRecoveryPinAttempts(
  account: Pick<AccountRecoveryRecord, "role" | "accountId">
): Promise<void> {
  await connectDB();
  const update = {
    recoveryPinFailedAttempts: 0,
    recoveryPinLockedUntil: undefined,
  };
  if (account.role === "salon") {
    await Salon.updateOne({ _id: account.accountId }, { $unset: { recoveryPinLockedUntil: 1 }, $set: { recoveryPinFailedAttempts: 0 } });
  } else {
    await Stylist.updateOne({ _id: account.accountId }, { $unset: { recoveryPinLockedUntil: 1 }, $set: { recoveryPinFailedAttempts: 0 } });
  }
}

export async function setRecoveryPin(
  account: Pick<AccountRecoveryRecord, "role" | "accountId">,
  pin: string
): Promise<void> {
  const recoveryPinHash = await hashRecoveryPin(pin);
  await connectDB();
  if (account.role === "salon") {
    await Salon.updateOne(
      { _id: account.accountId },
      {
        $set: { recoveryPinHash, recoveryPinFailedAttempts: 0 },
        $unset: { recoveryPinLockedUntil: 1 },
      }
    );
  } else {
    await Stylist.updateOne(
      { _id: account.accountId },
      { $set: { recoveryPinHash, recoveryPinFailedAttempts: 0 }, $unset: { recoveryPinLockedUntil: 1 } }
    );
  }
}

export async function getRecoveryPinStatus(
  role: "salon" | "stylist",
  accountId: string
): Promise<{ hasRecoveryPin: boolean }> {
  await connectDB();
  if (role === "salon") {
    const salon = await Salon.findById(accountId).select("+recoveryPinHash");
    return { hasRecoveryPin: Boolean(salon?.recoveryPinHash) };
  }
  const stylist = await Stylist.findById(accountId).select("+recoveryPinHash");
  return { hasRecoveryPin: Boolean(stylist?.recoveryPinHash) };
}
