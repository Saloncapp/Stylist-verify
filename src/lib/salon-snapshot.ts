import type { SalonType } from "@/lib/salon-constants";
import type {
  IEmploymentHistoryEntry,
  ISalonSnapshot,
} from "@/models/Stylist";

/** Read salon snapshot from nested or legacy flat employment entry fields */
export function getEntrySalonSnapshot(
  entry: IEmploymentHistoryEntry & Record<string, unknown>
): ISalonSnapshot {
  if (entry.salonSnapshot?.salonName) {
    return entry.salonSnapshot;
  }

  return {
    salonName: (entry.salonName as string) ?? "",
    salonLogoUrl: (entry.salonLogoUrl as string) ?? "",
    salonType: (entry.salonType as SalonType) ?? "Unisex",
    salonAddress: (entry.salonAddress as string) ?? "",
    salonEmail: (entry.salonEmail as string) ?? "",
    salonNumber: (entry.salonNumber as string) ?? "",
    googleMapsLocation: (entry.googleMapsLocation as string) ?? "",
    websiteUrl: (entry.websiteUrl as string) ?? "",
    instagramUrl: (entry.instagramUrl as string) ?? "",
    facebookUrl: (entry.facebookUrl as string) ?? "",
    whatsappNumber: (entry.whatsappNumber as string) ?? "",
    youtubeUrl: (entry.youtubeUrl as string) ?? "",
    establishmentYear: entry.establishmentYear as number | undefined,
  };
}

export function snapshotToFlatFields(snapshot: ISalonSnapshot) {
  return {
    salonName: snapshot.salonName,
    salonLogoUrl: snapshot.salonLogoUrl ?? "",
    salonType: snapshot.salonType,
    salonAddress: snapshot.salonAddress ?? "",
    salonEmail: snapshot.salonEmail ?? "",
    salonNumber: snapshot.salonNumber ?? "",
    googleMapsLocation: snapshot.googleMapsLocation ?? "",
    websiteUrl: snapshot.websiteUrl ?? "",
    instagramUrl: snapshot.instagramUrl ?? "",
    facebookUrl: snapshot.facebookUrl ?? "",
    whatsappNumber: snapshot.whatsappNumber ?? "",
    youtubeUrl: snapshot.youtubeUrl ?? "",
    establishmentYear: snapshot.establishmentYear,
  };
}
