import Stylist, {
  type IEmploymentHistoryEntry,
  type IStylist,
  type ISalonSnapshot,
} from "@/models/Stylist";
import Salon from "@/models/Salon";
import type { Types } from "mongoose";
import { getAadhaarGroupKey } from "@/lib/aadhaar-crypto";
import { nextEmployeeId } from "@/lib/employee-id";
import { getEntrySalonSnapshot } from "@/lib/salon-snapshot";

declare global {
  // eslint-disable-next-line no-var
  var stylistProfilesUnified: boolean | undefined;
}

const LEGACY_ROOT_FIELDS = [
  "salonId",
  "salonName",
  "salonLogoUrl",
  "salonType",
  "salonAddress",
  "googleMapsLocation",
  "websiteUrl",
  "salonEmail",
  "salonNumber",
  "instagramUrl",
  "facebookUrl",
  "whatsappNumber",
  "youtubeUrl",
  "establishmentYear",
  "level",
  "role",
  "employmentType",
  "performanceSummary",
  "managerFeedback",
  "overallExperienceRating",
  "technicalSkillRating",
  "customerHandlingRating",
  "overallPerformanceRating",
  "specialistServices",
  "experienceCertificateUrl",
  "relievingLetterUrl",
  "status",
  "joiningDate",
  "leavingDate",
  "aadhaarNumber",
] as const;

function personKey(stylist: IStylist): string {
  try {
    return getAadhaarGroupKey(stylist);
  } catch {
    return `id:${stylist._id.toString()}`;
  }
}

async function dropLegacyCompoundIndex() {
  try {
    await Stylist.collection.dropIndex("aadhaarHash_1_salonId_1");
  } catch {
    // Index may already be gone
  }
}

function indexMatches(
  existing: { unique?: boolean; sparse?: boolean; key?: Record<string, unknown> },
  key: Record<string, 1 | -1>,
  options: { unique?: boolean; sparse?: boolean }
) {
  return (
    JSON.stringify(existing.key) === JSON.stringify(key) &&
    Boolean(existing.unique) === Boolean(options.unique) &&
    Boolean(existing.sparse) === Boolean(options.sparse)
  );
}

async function ensureIndex(
  key: Record<string, 1 | -1>,
  options: { unique?: boolean; sparse?: boolean } = {}
) {
  const defaultName = `${Object.keys(key).join("_")}_1`;
  const indexes = await Stylist.collection.indexes();

  for (const existing of indexes) {
    if (!existing.name || existing.name === "_id_") continue;
    const sameName = existing.name === defaultName;
    const sameKey = JSON.stringify(existing.key) === JSON.stringify(key);
    if (!sameName && !sameKey) continue;
    if (indexMatches(existing, key, options)) return;
    try {
      await Stylist.collection.dropIndex(existing.name);
    } catch {
      // Index may already have been dropped
    }
  }

  await Stylist.collection.createIndex(key, options);
}

async function migrateSalonAddresses() {
  // Use the native driver so aggregation-style updates work, and so the
  // legacy `location` field (not on the Mongoose schema) is still readable.
  await Salon.collection.updateMany(
    {
      $or: [
        { salonAddress: { $exists: false } },
        { salonAddress: "" },
        { salonAddress: null },
      ],
      location: { $exists: true, $nin: ["", null] },
    },
    [{ $set: { salonAddress: "$location" } }]
  );

  await Salon.collection.updateMany({}, { $unset: { location: "" } });
}

async function migrateSalonAuthFields() {
  await Salon.updateMany(
    {},
    {
      $unset: {
        password: "",
        authProvider: "",
        googleUid: "",
        salonNumberVerified: "",
      },
    }
  );

  // Empty strings break unique indexes (Mongo indexes "" but sparse skips only null/missing).
  await Salon.updateMany(
    { $or: [{ email: "" }, { email: null }] },
    { $unset: { email: "" } }
  );
  await Salon.updateMany(
    { $or: [{ firebaseUid: "" }, { firebaseUid: null }] },
    { $unset: { firebaseUid: "" } }
  );

  try {
    const indexes = await Salon.collection.indexes();
    for (const existing of indexes) {
      const keys = Object.keys(existing.key ?? {});
      const isEmailUnique =
        existing.unique && keys.length === 1 && keys[0] === "email";
      const dropByName =
        existing.name === "email_1" || existing.name === "googleUid_1";

      if (isEmailUnique || dropByName) {
        try {
          if (existing.name) {
            await Salon.collection.dropIndex(existing.name);
          }
        } catch {
          // ignore
        }
      }
    }
    await Salon.collection.createIndex({ salonNumber: 1 }, { unique: true });
    await Salon.collection.createIndex(
      { firebaseUid: 1 },
      { unique: true, sparse: true }
    );
  } catch (error) {
    console.error("Salon index migration error:", error);
  }
}

function legacySnapshotFromStylist(
  stylist: IStylist & Record<string, unknown>
): ISalonSnapshot | null {
  if (!stylist.salonId || !stylist.salonName) return null;
  return {
    salonName: stylist.salonName as string,
    salonLogoUrl: (stylist.salonLogoUrl as string) ?? "",
    salonType: (stylist.salonType as ISalonSnapshot["salonType"]) ?? "Unisex",
    salonAddress: (stylist.salonAddress as string) ?? "",
    salonEmail: (stylist.salonEmail as string) ?? "",
    salonNumber: (stylist.salonNumber as string) ?? "",
    googleMapsLocation: (stylist.googleMapsLocation as string) ?? "",
    websiteUrl: (stylist.websiteUrl as string) ?? "",
    instagramUrl: (stylist.instagramUrl as string) ?? "",
    facebookUrl: (stylist.facebookUrl as string) ?? "",
    whatsappNumber: (stylist.whatsappNumber as string) ?? "",
    youtubeUrl: (stylist.youtubeUrl as string) ?? "",
    establishmentYear: stylist.establishmentYear as number | undefined,
  };
}

function normalizeHistoryEntry(
  entry: IEmploymentHistoryEntry & Record<string, unknown>,
  employeeId?: string
): IEmploymentHistoryEntry {
  const salonSnapshot = getEntrySalonSnapshot(entry);
  const normalized: IEmploymentHistoryEntry = {
    _id: entry._id,
    salonId: entry.salonId,
    salonSnapshot,
    employeeId: (entry.employeeId as string | undefined) || employeeId,
    status: entry.status,
    remark: entry.remark,
    level: entry.level,
    role: entry.role,
    employmentType: entry.employmentType,
    performanceSummary: entry.performanceSummary ?? "",
    managerFeedback: entry.managerFeedback ?? "",
    overallExperienceRating: entry.overallExperienceRating,
    technicalSkillRating: entry.technicalSkillRating,
    customerHandlingRating: entry.customerHandlingRating,
    overallPerformanceRating: entry.overallPerformanceRating,
    specialistServices: entry.specialistServices ?? [],
    experienceCertificateUrl: entry.experienceCertificateUrl ?? "",
    relievingLetterUrl: entry.relievingLetterUrl ?? "",
    joiningDate: entry.joiningDate,
    leavingDate: entry.leavingDate,
    updatedAt: entry.updatedAt ?? new Date(),
  };
  return normalized;
}

function backfillHistoryFromRoot(
  stylist: IStylist & Record<string, unknown>
): boolean {
  let changed = false;
  const legacySnapshot = legacySnapshotFromStylist(stylist);
  const legacySalonId = stylist.salonId as Types.ObjectId | undefined;
  if (!legacySnapshot || !legacySalonId) {
    return changed;
  }

  const hasEntry = stylist.employmentHistory.some((entry) =>
    entry.salonId?.toString() === legacySalonId.toString()
  );

  if (!hasEntry) {
    stylist.employmentHistory.push({
      salonId: legacySalonId,
      salonSnapshot: legacySnapshot,
      status: stylist.status as IEmploymentHistoryEntry["status"],
      level: stylist.level as IEmploymentHistoryEntry["level"],
      role: stylist.role as IEmploymentHistoryEntry["role"],
      employmentType:
        stylist.employmentType as IEmploymentHistoryEntry["employmentType"],
      performanceSummary: (stylist.performanceSummary as string) ?? "",
      managerFeedback: (stylist.managerFeedback as string) ?? "",
      overallExperienceRating: stylist.overallExperienceRating as
        | number
        | undefined,
      technicalSkillRating: stylist.technicalSkillRating as number | undefined,
      customerHandlingRating: stylist.customerHandlingRating as
        | number
        | undefined,
      overallPerformanceRating: stylist.overallPerformanceRating as
        | number
        | undefined,
      specialistServices: (stylist.specialistServices as string[]) ?? [],
      experienceCertificateUrl:
        (stylist.experienceCertificateUrl as string) ?? "",
      relievingLetterUrl: (stylist.relievingLetterUrl as string) ?? "",
      joiningDate: stylist.joiningDate as Date | undefined,
      leavingDate: stylist.leavingDate as Date | undefined,
      updatedAt: stylist.updatedAt ?? new Date(),
    });
    changed = true;
  }

  return changed;
}

async function migrateStylistDocuments() {
  const stylists = await Stylist.find({});
  for (const stylist of stylists) {
    const raw = stylist as unknown as IStylist & Record<string, unknown>;
    let changed = backfillHistoryFromRoot(raw);

    const normalizedHistory = stylist.employmentHistory.map((entry) => {
      const normalized = normalizeHistoryEntry(
        entry as IEmploymentHistoryEntry & Record<string, unknown>,
        stylist.employeeId
      );
      if (!entry.employeeId && stylist.employeeId) {
        changed = true;
      }
      if (
        JSON.stringify(normalized) !==
        JSON.stringify({
          ...entry,
          salonSnapshot: normalized.salonSnapshot,
          employeeId: normalized.employeeId,
        })
      ) {
        changed = true;
      }
      return normalized;
    });

    stylist.employmentHistory = normalizedHistory;

    for (const field of LEGACY_ROOT_FIELDS) {
      if (field in raw && raw[field] !== undefined) {
        delete raw[field];
        changed = true;
      }
    }

    if (changed) {
      stylist.markModified("employmentHistory");
      await stylist.save();
    }
  }
}

export async function unifyStylistProfiles(): Promise<void> {
  // Always re-run: drops leftover unique email index that blocks new salon signups.
  await migrateSalonAuthFields();

  if (global.stylistProfilesUnified) return;

  await dropLegacyCompoundIndex();
  await migrateSalonAddresses();

  const records = await Stylist.find({});
  const groups = new Map<string, IStylist[]>();

  for (const record of records) {
    const key = personKey(record);
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const sorted = [...group].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    const keeper = sorted[0];
    const extras = sorted.slice(1);

    for (const extra of extras) {
      const rawExtra = extra as unknown as IStylist & Record<string, unknown>;
      backfillHistoryFromRoot(rawExtra);

      if (extra.employmentHistory?.length) {
        for (const entry of extra.employmentHistory) {
          keeper.employmentHistory.push(
            normalizeHistoryEntry(
              entry as IEmploymentHistoryEntry & Record<string, unknown>,
              keeper.employeeId
            )
          );
        }
      }

      if (!keeper.photoUrl && extra.photoUrl) keeper.photoUrl = extra.photoUrl;
      if (!keeper.address && extra.address) keeper.address = extra.address;
      if (!keeper.aadhaarEncrypted && extra.aadhaarEncrypted) {
        keeper.aadhaarEncrypted = extra.aadhaarEncrypted;
      }
      if (!keeper.aadhaarHash && extra.aadhaarHash) {
        keeper.aadhaarHash = extra.aadhaarHash;
      }
      await extra.deleteOne();
    }

    keeper.markModified("employmentHistory");
    await keeper.save();
  }

  await migrateStylistDocuments();

  const missingIds = await Stylist.find({
    $or: [
      { employeeId: { $exists: false } },
      { employeeId: "" },
      { employeeId: null },
    ],
  }).sort({ createdAt: 1 });

  for (const stylist of missingIds) {
    stylist.employeeId = await nextEmployeeId();
    for (const entry of stylist.employmentHistory) {
      if (!entry.employeeId) entry.employeeId = stylist.employeeId;
    }
    stylist.markModified("employmentHistory");
    await stylist.save();
  }

  try {
    await ensureIndex({ employeeId: 1 }, { unique: true, sparse: true });
    await ensureIndex({ aadhaarHash: 1 }, { unique: true, sparse: true });
    await ensureIndex({ mobileNumber: 1 }, { unique: true });
    await ensureIndex({ firebaseUid: 1 }, { unique: true, sparse: true });
    await ensureIndex({ "employmentHistory.salonId": 1 });
    await ensureIndex({
      "employmentHistory.salonId": 1,
      "employmentHistory.status": 1,
    });
    await ensureIndex({ openToWork: 1, openToWorkAt: -1 });
  } catch (error) {
    console.error("Stylist uniqueness index error:", error);
  }

  global.stylistProfilesUnified = true;
}
