import type { Types } from "mongoose";
import type { SalonType } from "@/lib/salon-constants";
import { normalizeOptionalUrl } from "@/lib/salon-constants";
import Stylist from "@/models/Stylist";
import type { ISalonSnapshot } from "@/models/Stylist";

export type SalonDetailsSync = ISalonSnapshot;

export function salonSnapshotFromSalon(salon: {
  salonName: string;
  email?: string;
  salonNumber?: string;
  logoUrl?: string;
  salonType: SalonType;
  salonAddress?: string;
  googleMapsLocation?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
  establishmentYear?: number;
}): SalonDetailsSync {
  return {
    salonName: salon.salonName,
    salonLogoUrl: salon.logoUrl ?? "",
    salonType: salon.salonType,
    salonAddress: salon.salonAddress ?? "",
    salonEmail: salon.email ?? "",
    salonNumber: salon.salonNumber ?? "",
    googleMapsLocation: normalizeOptionalUrl(salon.googleMapsLocation),
    websiteUrl: normalizeOptionalUrl(salon.websiteUrl),
    instagramUrl: normalizeOptionalUrl(salon.instagramUrl),
    facebookUrl: normalizeOptionalUrl(salon.facebookUrl),
    whatsappNumber: salon.whatsappNumber ?? "",
    youtubeUrl: normalizeOptionalUrl(salon.youtubeUrl),
    establishmentYear: salon.establishmentYear,
  };
}

/** Propagate salon branding and details to employment history snapshots */
export async function syncSalonDetailsToStylists(
  salonId: Types.ObjectId,
  details: SalonDetailsSync
): Promise<void> {
  const snapshot = {
    salonName: details.salonName,
    salonLogoUrl: details.salonLogoUrl ?? "",
    salonType: details.salonType,
    salonAddress: details.salonAddress ?? "",
    salonEmail: details.salonEmail ?? "",
    salonNumber: details.salonNumber ?? "",
    googleMapsLocation: details.googleMapsLocation ?? "",
    websiteUrl: details.websiteUrl ?? "",
    instagramUrl: details.instagramUrl ?? "",
    facebookUrl: details.facebookUrl ?? "",
    whatsappNumber: details.whatsappNumber ?? "",
    youtubeUrl: details.youtubeUrl ?? "",
    establishmentYear: details.establishmentYear ?? null,
  };

  await Stylist.updateMany(
    { "employmentHistory.salonId": salonId },
    {
      $set: {
        "employmentHistory.$[elem].salonSnapshot": snapshot,
      },
    },
    {
      arrayFilters: [{ "elem.salonId": salonId }],
    }
  );
}
