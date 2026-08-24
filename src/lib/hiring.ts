import mongoose, { type Types } from "mongoose";
import Application from "@/models/Application";
import Job from "@/models/Job";
import Stylist from "@/models/Stylist";
import type { ISalon } from "@/models/Salon";
import type { IEmploymentHistoryEntry, IStylist } from "@/models/Stylist";
import type { IJob, IJobSalonSnapshot } from "@/models/Job";
import type {
  IApplicationJobSnapshot,
  IApplicationStylistSnapshot,
} from "@/models/Application";
import type { StylistRole } from "@/lib/employment-constants";
import { maskMobileNumber } from "@/lib/mask";
import type {
  ApplicationStatus,
  HiringApplicationCard,
  HiringJobCard,
  InterestRequestCard,
  OpenToWorkTalentCard,
  StylistLevel,
} from "@/types";

const DEFAULT_PAGE_LIMIT = 12;
const MAX_PAGE_LIMIT = 24;
export const DASHBOARD_PREVIEW_LIMIT = 2;

export const OPEN_TO_WORK_STYLIST_SELECT =
  "name mobileNumber address photoUrl employmentHistory openToWorkAt";

export function parseHiringLimit(raw: string | null): number {
  const n = Number(raw ?? DEFAULT_PAGE_LIMIT);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_LIMIT;
  return Math.min(Math.floor(n), MAX_PAGE_LIMIT);
}

export function encodeHiringCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ t: createdAt.toISOString(), id }),
    "utf8"
  ).toString("base64url");
}

export function decodeHiringCursor(
  cursor: string | null
): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as { t?: string; id?: string };
    if (!parsed.t || !parsed.id) return null;
    const createdAt = new Date(parsed.t);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

/** Cursor filter for newest-first pagination (createdAt desc, _id desc). */
export function hiringCursorFilter(
  cursor: { createdAt: Date; id: string } | null
): Record<string, unknown> | undefined {
  if (!cursor) return undefined;
  return {
    $or: [
      { createdAt: { $lt: cursor.createdAt } },
      {
        createdAt: cursor.createdAt,
        _id: { $lt: cursor.id },
      },
    ],
  };
}

function entryTime(entry: IEmploymentHistoryEntry): number {
  return new Date(entry.joiningDate ?? entry.updatedAt).getTime();
}

export function getLatestEmploymentEntry(
  stylist: Pick<IStylist, "employmentHistory">
): IEmploymentHistoryEntry | undefined {
  const history = stylist.employmentHistory ?? [];
  if (history.length === 0) return undefined;
  return [...history].sort((a, b) => entryTime(b) - entryTime(a))[0];
}

export function getLatestRole(
  stylist: Pick<IStylist, "employmentHistory">
): StylistRole | undefined {
  return getLatestEmploymentEntry(stylist)?.role;
}

export function buildJobSalonSnapshot(
  salon: Pick<ISalon, "salonName" | "salonAddress" | "logoUrl">
): IJobSalonSnapshot {
  return {
    salonName: salon.salonName,
    salonAddress: salon.salonAddress || "",
    salonLogoUrl: salon.logoUrl || "",
  };
}

export function buildApplicationStylistSnapshot(
  stylist: Pick<
    IStylist,
    "name" | "mobileNumber" | "address" | "photoUrl" | "employmentHistory"
  >
): IApplicationStylistSnapshot {
  return {
    name: stylist.name,
    mobileNumber: stylist.mobileNumber,
    address: stylist.address || "",
    photoUrl: stylist.photoUrl || "",
    latestRole: getLatestRole(stylist),
  };
}

export function buildApplicationJobSnapshot(
  job: Pick<IJob, "role" | "employmentType" | "salonSnapshot">
): IApplicationJobSnapshot {
  return {
    role: job.role,
    employmentType: job.employmentType,
    salonName: job.salonSnapshot.salonName,
    salonAddress: job.salonSnapshot.salonAddress || "",
  };
}

/** Default salon→stylist interest message. */
export function buildInterestMessage(role: string): string {
  const position = role.trim() || "Stylist";
  return `Hi, we are looking for ${position} to join our team. Your experience and skills match our requirement.`;
}

export function formatInterestRequestCard(request: {
  _id: { toString(): string };
  jobId: { toString(): string };
  stylistId: { toString(): string };
  salonId: { toString(): string };
  status: InterestRequestCard["status"];
  message: string;
  jobSnapshot: {
    role: string;
    employmentType?: string;
    salonName: string;
    salonAddress?: string;
    salonLogoUrl?: string;
  };
  stylistSnapshot: {
    name: string;
    photoUrl?: string;
  };
  createdAt: Date;
}): InterestRequestCard {
  return {
    id: request._id.toString(),
    jobId: request.jobId.toString(),
    stylistId: request.stylistId.toString(),
    salonId: request.salonId.toString(),
    status: request.status,
    message: request.message,
    salonName: request.jobSnapshot.salonName,
    salonAddress: request.jobSnapshot.salonAddress || undefined,
    salonLogoUrl: request.jobSnapshot.salonLogoUrl || undefined,
    jobRole: request.jobSnapshot.role,
    jobEmploymentType: request.jobSnapshot.employmentType || undefined,
    stylistName: request.stylistSnapshot.name,
    stylistPhotoUrl: request.stylistSnapshot.photoUrl || undefined,
    createdAt: request.createdAt.toISOString(),
  };
}

export function formatJobCard(
  job: {
    _id: { toString(): string };
    salonId: { toString(): string };
    salonSnapshot: {
      salonName: string;
      salonAddress?: string;
      salonLogoUrl?: string;
    };
    role: HiringJobCard["role"];
    employmentType: HiringJobCard["employmentType"];
    level?: StylistLevel;
    description: string;
    status: HiringJobCard["status"];
    createdAt: Date | string;
  },
  applied = false
): HiringJobCard {
  return {
    id: job._id.toString(),
    salonId: job.salonId.toString(),
    salonName: job.salonSnapshot.salonName,
    salonAddress: job.salonSnapshot.salonAddress || undefined,
    salonLogoUrl: job.salonSnapshot.salonLogoUrl || undefined,
    role: job.role,
    employmentType: job.employmentType,
    level: job.level,
    description: job.description,
    status: job.status,
    applied,
    createdAt: new Date(job.createdAt).toISOString(),
  };
}

export function formatApplicationCard(
  app: {
    _id: { toString(): string };
    jobId: Types.ObjectId | string;
    stylistId: Types.ObjectId | string;
    salonId: Types.ObjectId | string;
    status: HiringApplicationCard["status"];
    stylistSnapshot: IApplicationStylistSnapshot;
    jobSnapshot: IApplicationJobSnapshot;
    createdAt: Date;
  }
): HiringApplicationCard {
  return {
    id: app._id.toString(),
    jobId: app.jobId.toString(),
    stylistId: app.stylistId.toString(),
    salonId: app.salonId.toString(),
    status: app.status,
    stylistName: app.stylistSnapshot.name,
    stylistMobile: app.stylistSnapshot.mobileNumber,
    stylistAddress: app.stylistSnapshot.address || undefined,
    stylistPhotoUrl: app.stylistSnapshot.photoUrl || undefined,
    latestRole: app.stylistSnapshot.latestRole,
    jobRole: app.jobSnapshot.role,
    jobEmploymentType: app.jobSnapshot.employmentType || undefined,
    salonName: app.jobSnapshot.salonName,
    salonAddress: app.jobSnapshot.salonAddress || undefined,
    createdAt: app.createdAt.toISOString(),
  };
}

export function formatOpenToWorkTalent(
  stylist: {
    _id: { toString(): string };
    name: string;
    mobileNumber: string;
    address?: string;
    photoUrl?: string;
    employmentHistory?: IEmploymentHistoryEntry[];
    openToWorkAt?: Date | string | null;
  },
  options?: { revealPhone?: boolean }
): OpenToWorkTalentCard {
  const latest = getLatestEmploymentEntry({
    employmentHistory: stylist.employmentHistory ?? [],
  });
  const revealPhone = options?.revealPhone === true;
  return {
    id: stylist._id.toString(),
    name: stylist.name,
    mobileNumber: revealPhone
      ? stylist.mobileNumber
      : maskMobileNumber(stylist.mobileNumber),
    phoneRevealed: revealPhone,
    address: stylist.address || undefined,
    photoUrl: stylist.photoUrl || undefined,
    latestRole: latest?.role,
    latestLevel: latest?.level as StylistLevel | undefined,
    openToWorkAt: stylist.openToWorkAt
      ? new Date(stylist.openToWorkAt).toISOString()
      : undefined,
  };
}

/** Excludes this salon's active staff from the open-to-work talent pool. */
export function buildOpenToWorkTalentFilter(
  salonId: string,
  cursor?: { createdAt: Date; id: string } | null
): Record<string, unknown> {
  const salonObjectId = new mongoose.Types.ObjectId(salonId);
  const otwCursor = cursor
    ? {
        $or: [
          { openToWorkAt: { $lt: cursor.createdAt } },
          {
            openToWorkAt: cursor.createdAt,
            _id: { $lt: new mongoose.Types.ObjectId(cursor.id) },
          },
        ],
      }
    : {};

  return {
    openToWork: true,
    $nor: [
      {
        employmentHistory: {
          $elemMatch: {
            salonId: salonObjectId,
            $or: [
              { status: "Active" },
              { status: null },
              { status: { $exists: false } },
            ],
          },
        },
      },
    ],
    ...otwCursor,
  };
}

/** Per-status application counts for a salon (Mongoose-cast filters). */
export async function getApplicationStatusCounts(
  salonId: string
): Promise<Record<ApplicationStatus, number>> {
  const [interested, hired, rejected] = await Promise.all([
    Application.countDocuments({ salonId, status: "Interested" }),
    Application.countDocuments({ salonId, status: "Hired" }),
    Application.countDocuments({ salonId, status: "Rejected" }),
  ]);

  return {
    Interested: interested,
    Hired: hired,
    Rejected: rejected,
  };
}

/** Interested applicants preview for salon dashboard (queue: oldest first). */
export async function getDashboardApplicantsPreview(salonId: string): Promise<{
  count: number;
  items: HiringApplicationCard[];
}> {
  const filter = { salonId, status: "Interested" as const };
  const [count, apps] = await Promise.all([
    Application.countDocuments(filter),
    Application.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .limit(DASHBOARD_PREVIEW_LIMIT)
      .lean(),
  ]);

  return {
    count,
    items: apps.map((app) => formatApplicationCard(app as never)),
  };
}

/** Open-to-work talent preview for salon dashboard (most recent toggles first). */
export async function getDashboardOpenToWorkPreview(salonId: string): Promise<{
  count: number;
  items: OpenToWorkTalentCard[];
}> {
  const filter = buildOpenToWorkTalentFilter(salonId);
  const [count, stylists] = await Promise.all([
    Stylist.countDocuments(filter),
    Stylist.find(filter)
      .select(OPEN_TO_WORK_STYLIST_SELECT)
      .sort({ openToWorkAt: -1, _id: -1 })
      .limit(DASHBOARD_PREVIEW_LIMIT)
      .lean(),
  ]);

  return {
    count,
    items: stylists.map((stylist) => formatOpenToWorkTalent(stylist as never)),
  };
}

/** Active salon ids for a stylist — used to hide their employer's open jobs. */
export function activeSalonIdsForStylist(
  stylist: Pick<IStylist, "employmentHistory">
): string[] {
  const ids = new Set<string>();
  for (const entry of stylist.employmentHistory ?? []) {
    if (entry.status === "Active" || entry.status == null) {
      ids.add(entry.salonId.toString());
    }
  }
  return [...ids];
}

/** Open jobs preview for stylist dashboard (newest first). */
export async function getStylistJobsPreview(
  stylistId: string,
  stylist: Pick<IStylist, "employmentHistory">
): Promise<{ count: number; items: HiringJobCard[] }> {
  const excludeSalonIds = activeSalonIdsForStylist(stylist);
  const filter: Record<string, unknown> = {
    status: "open",
    ...(excludeSalonIds.length > 0
      ? { salonId: { $nin: excludeSalonIds } }
      : {}),
  };

  const [count, jobs] = await Promise.all([
    Job.countDocuments(filter),
    Job.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(DASHBOARD_PREVIEW_LIMIT)
      .lean(),
  ]);

  const jobIds = jobs.map((j) => j._id);
  const applied = await Application.find({
    stylistId,
    jobId: { $in: jobIds },
  })
    .select("jobId")
    .lean();
  const appliedSet = new Set(applied.map((a) => a.jobId.toString()));

  return {
    count,
    items: jobs.map((job) =>
      formatJobCard(job as never, appliedSet.has(job._id.toString()))
    ),
  };
}

/** Applications preview for stylist dashboard (newest first). */
export async function getStylistApplicationsPreview(
  stylistId: string
): Promise<{ count: number; items: HiringApplicationCard[] }> {
  const filter = { stylistId };
  const [count, apps] = await Promise.all([
    Application.countDocuments(filter),
    Application.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(DASHBOARD_PREVIEW_LIMIT)
      .lean(),
  ]);

  return {
    count,
    items: apps.map((app) => formatApplicationCard(app as never)),
  };
}

/** Per-status application counts for a stylist. */
export async function getStylistApplicationStatusCounts(
  stylistId: string
): Promise<Record<ApplicationStatus, number>> {
  const [interested, hired, rejected] = await Promise.all([
    Application.countDocuments({ stylistId, status: "Interested" }),
    Application.countDocuments({ stylistId, status: "Hired" }),
    Application.countDocuments({ stylistId, status: "Rejected" }),
  ]);

  return {
    Interested: interested,
    Hired: hired,
    Rejected: rejected,
  };
}

declare global {
  // eslint-disable-next-line no-var
  var hiringIndexesReady: boolean | undefined;
}

/** Ensure Job / Application indexes (autoIndex is disabled). */
export async function ensureHiringIndexes(): Promise<void> {
  if (global.hiringIndexesReady) return;
  const Job = (await import("@/models/Job")).default;
  const Application = (await import("@/models/Application")).default;

  try {
    await Job.collection.createIndex({ status: 1, createdAt: -1 });
    await Job.collection.createIndex({ salonId: 1, createdAt: -1 });
    await Application.collection.createIndex(
      { jobId: 1, stylistId: 1 },
      { unique: true }
    );
    await Application.collection.createIndex({ salonId: 1, createdAt: -1 });
    await Application.collection.createIndex({ stylistId: 1, createdAt: -1 });
    await Application.collection.createIndex({ jobId: 1, status: 1 });

    const InterestRequest = (await import("@/models/InterestRequest")).default;
    await InterestRequest.collection.createIndex(
      { jobId: 1, stylistId: 1 },
      {
        unique: true,
        partialFilterExpression: { status: "pending" },
        name: "jobId_1_stylistId_1_pending",
      }
    );
    await InterestRequest.collection.createIndex({
      stylistId: 1,
      status: 1,
      createdAt: -1,
    });
    await InterestRequest.collection.createIndex({
      salonId: 1,
      status: 1,
      createdAt: -1,
    });
  } catch (error) {
    console.error("Hiring index error:", error);
  }

  global.hiringIndexesReady = true;
}
