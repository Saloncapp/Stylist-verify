import type { StylistStatus } from "@/types";

function parseDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDurationParts(years: number, months: number): string {
  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} year${years === 1 ? "" : "s"}`);
  }

  if (months > 0) {
    parts.push(`${months} month${months === 1 ? "" : "s"}`);
  }

  if (parts.length === 0) {
    return "Less than 1 month";
  }

  return parts.join(" ");
}

function diffYearsMonths(start: Date, end: Date): { years: number; months: number } {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();

  if (end.getDate() < start.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years: Math.max(0, years), months: Math.max(0, months) };
}

/** Compute a read-only employment duration label from dates and status.
 * Returns empty string when duration cannot be calculated (caller shows "No data available").
 */
export function formatEmploymentDuration(
  joiningDate?: string | Date | null,
  leavingDate?: string | Date | null,
  status?: StylistStatus
): string {
  if (!joiningDate) {
    return "";
  }

  const start = parseDate(joiningDate);
  if (!start) {
    return "";
  }

  const isOngoing = status === "Active" && !leavingDate;
  const end = isOngoing
    ? new Date()
    : leavingDate
      ? parseDate(leavingDate)
      : null;

  if (!end) {
    return "";
  }

  const { years, months } = diffYearsMonths(start, end);
  return formatDurationParts(years, months);
}

function formatTotalExperienceLabel(years: number, months: number): string {
  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} Year${years === 1 ? "" : "s"}`);
  }

  if (months > 0) {
    parts.push(`${months} Month${months === 1 ? "" : "s"}`);
  }

  if (parts.length === 0) {
    return "Less than 1 Month";
  }

  return parts.join(" ");
}

/** Sum employment durations across all salon records.
 * Active records count from joining date to today.
 * Returns empty string when no valid dates exist (caller shows "No data available").
 */
export function formatTotalExperience(
  records: Array<{
    joiningDate?: string | Date | null;
    leavingDate?: string | Date | null;
    status?: StylistStatus;
  }>
): string {
  let totalMonths = 0;
  let hasValidPeriod = false;

  for (const record of records) {
    if (!record.joiningDate) continue;

    const start = parseDate(record.joiningDate);
    if (!start) continue;

    const end =
      record.status === "Active"
        ? new Date()
        : record.leavingDate
          ? parseDate(record.leavingDate)
          : null;

    if (!end || end.getTime() < start.getTime()) continue;

    hasValidPeriod = true;
    const { years, months } = diffYearsMonths(start, end);
    totalMonths += years * 12 + months;
  }

  if (!hasValidPeriod) {
    return "";
  }

  return formatTotalExperienceLabel(
    Math.floor(totalMonths / 12),
    totalMonths % 12
  );
}

/** Compact public preview label, e.g. "5+ Years Experience" */
export function formatPreviewExperience(
  records: Array<{
    joiningDate?: string | Date | null;
    leavingDate?: string | Date | null;
    status?: StylistStatus;
  }>
): string {
  let totalMonths = 0;
  let hasValidPeriod = false;

  for (const record of records) {
    if (!record.joiningDate) continue;

    const start = parseDate(record.joiningDate);
    if (!start) continue;

    const end =
      record.status === "Active"
        ? new Date()
        : record.leavingDate
          ? parseDate(record.leavingDate)
          : null;

    if (!end || end.getTime() < start.getTime()) continue;

    hasValidPeriod = true;
    const { years, months } = diffYearsMonths(start, end);
    totalMonths += years * 12 + months;
  }

  if (!hasValidPeriod) {
    return "Experience available after login";
  }

  const years = Math.floor(totalMonths / 12);
  if (years <= 0) {
    return "Less than 1 Year Experience";
  }

  return `${years}+ Year${years === 1 ? "" : "s"} Experience`;
}
