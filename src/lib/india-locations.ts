/** Indian states and UTs for salon registration address. */
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

export interface SalonAddressParts {
  state: string;
  district: string;
  city: string;
  area: string;
  pinCode: string;
}

/** Compose a single salonAddress string stored on the Salon document. */
export function formatSalonAddress(parts: SalonAddressParts): string {
  const line = [parts.area, parts.city, parts.district, parts.state]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(", ");
  const pin = parts.pinCode.trim();
  if (!line) return pin;
  if (!pin) return line;
  return `${line} - ${pin}`;
}

export interface PinLookupResult {
  state: string;
  district: string;
  city: string;
}

export interface LocalityPinResult {
  pincode: string;
  name: string;
  district: string;
  state: string;
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s*\((ut|nct)\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lookup locality details from India Post PIN API (client-side). */
export async function lookupPinCode(
  pinCode: string
): Promise<PinLookupResult | null> {
  if (!/^\d{6}$/.test(pinCode)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      Status?: string;
      PostOffice?: Array<{
        State?: string;
        District?: string;
        Block?: string;
        Name?: string;
      }>;
    }>;
    const first = data[0];
    if (first?.Status !== "Success" || !first.PostOffice?.length) return null;
    const office = first.PostOffice[0]!;
    return {
      state: office.State?.trim() ?? "",
      district: office.District?.trim() ?? "",
      city: (office.Block || office.Name || "").trim(),
    };
  } catch {
    return null;
  }
}

type PostalApiRow = {
  Status?: string;
  PostOffice?: Array<{
    Name?: string;
    District?: string;
    State?: string;
    Block?: string;
    Pincode?: string;
  }>;
};

/**
 * Resolve a PIN for an area/locality via India Post (server-side preferred).
 * Tries area name, then city name.
 */
export async function lookupPincodeForLocality(input: {
  area: string;
  city?: string;
  district?: string;
  state?: string;
}): Promise<LocalityPinResult | null> {
  const queries = [input.area, input.city].map((q) => q?.trim()).filter(Boolean) as string[];
  const stateNorm = input.state ? normalizeKey(input.state) : "";
  const districtNorm = input.district ? normalizeKey(input.district) : "";

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) continue;
      const payload = (await res.json()) as PostalApiRow[];
      const offices = payload[0]?.Status === "Success" ? payload[0].PostOffice ?? [] : [];
      if (!offices.length) continue;

      const scored = offices
        .map((office) => {
          const name = office.Name?.trim() ?? "";
          const district = office.District?.trim() ?? "";
          const state = office.State?.trim() ?? "";
          const pincode = office.Pincode?.trim() ?? "";
          if (!/^\d{6}$/.test(pincode)) return null;

          let score = 0;
          if (normalizeKey(name) === normalizeKey(query)) score += 5;
          else if (normalizeKey(name).includes(normalizeKey(query))) score += 2;
          if (districtNorm && normalizeKey(district) === districtNorm) score += 3;
          if (stateNorm && normalizeKey(state) === stateNorm) score += 2;
          return { score, pincode, name, district, state };
        })
        .filter((row): row is LocalityPinResult & { score: number } => row != null);

      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (best && best.score > 0) {
        return {
          pincode: best.pincode,
          name: best.name,
          district: best.district,
          state: best.state,
        };
      }

      // Fallback: first office with a valid PIN
      const first = offices.find((o) => /^\d{6}$/.test(o.Pincode?.trim() ?? ""));
      if (first?.Pincode) {
        return {
          pincode: first.Pincode.trim(),
          name: first.Name?.trim() ?? query,
          district: first.District?.trim() ?? "",
          state: first.State?.trim() ?? "",
        };
      }
    } catch {
      // try next query
    }
  }

  return null;
}
