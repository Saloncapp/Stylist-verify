import type { Types } from "mongoose";
import type { SalonType } from "@/lib/salon-constants";
import { normalizeOptionalUrl } from "@/lib/salon-constants";
import Stylist from "@/models/Stylist";

export interface SalonDetailsSync {
  salonName: string;
  salonLogoUrl?: string;
  salonType: SalonType;
  salonAddress?: string;
  salonEmail?: string;
  salonNumber?: string;
  googleMapsLocation?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
  establishmentYear?: number;
}

export function salonSnapshotFromSalon(salon: {
  salonName: string;
  email: string;
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

/** Propagate salon branding and details to stylist records and their employment history */
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

  await Stylist.updateMany({ salonId }, { $set: snapshot });

  await Stylist.updateMany(
    { "employmentHistory.salonId": salonId },
    {
      $set: {
        "employmentHistory.$[elem].salonName": snapshot.salonName,
        "employmentHistory.$[elem].salonLogoUrl": snapshot.salonLogoUrl,
        "employmentHistory.$[elem].salonType": snapshot.salonType,
        "employmentHistory.$[elem].salonAddress": snapshot.salonAddress,
        "employmentHistory.$[elem].salonEmail": snapshot.salonEmail,
        "employmentHistory.$[elem].salonNumber": snapshot.salonNumber,
        "employmentHistory.$[elem].googleMapsLocation":
          snapshot.googleMapsLocation,
        "employmentHistory.$[elem].websiteUrl": snapshot.websiteUrl,
        "employmentHistory.$[elem].instagramUrl": snapshot.instagramUrl,
        "employmentHistory.$[elem].facebookUrl": snapshot.facebookUrl,
        "employmentHistory.$[elem].whatsappNumber": snapshot.whatsappNumber,
        "employmentHistory.$[elem].youtubeUrl": snapshot.youtubeUrl,
        "employmentHistory.$[elem].establishmentYear":
          snapshot.establishmentYear,
      },
    },
    {
      arrayFilters: [{ "elem.salonId": salonId }],
    }
  );
}
