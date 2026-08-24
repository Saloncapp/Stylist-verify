import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api";
import { resolvePostalToCatalog } from "@/lib/india-location-data";
import { lookupPinCode, lookupPincodeForLocality } from "@/lib/india-locations";

/**
 * PIN helpers:
 * - GET ?pin=110001 → resolve State / District / City from India Post
 * - GET ?area=&city=&district=&state= → reverse locality → PIN (legacy)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pin = searchParams.get("pin")?.trim() ?? "";

    if (pin) {
      if (!/^\d{6}$/.test(pin)) {
        return jsonError("Enter a valid 6-digit PIN code", 400);
      }

      const postal = await lookupPinCode(pin);
      if (!postal) {
        return jsonSuccess({
          found: false,
          state: "",
          district: "",
          city: "",
        });
      }

      const catalog = resolvePostalToCatalog(postal);

      return jsonSuccess({
        found: true,
        // Catalog-matched names when possible; fall back to postal text for editing
        state: catalog.state || postal.state,
        district: catalog.district || postal.district,
        city: catalog.city || postal.city,
        postal,
        catalog,
      });
    }

    const area = searchParams.get("area")?.trim() ?? "";
    const city = searchParams.get("city")?.trim() ?? "";
    const district = searchParams.get("district")?.trim() ?? "";
    const state = searchParams.get("state")?.trim() ?? "";

    if (!area && !city) {
      return jsonError("PIN or area/city is required", 400);
    }

    const result = await lookupPincodeForLocality({
      area: area || city,
      city,
      district,
      state,
    });

    if (!result) {
      return jsonSuccess({ found: false, pincode: "" });
    }

    return jsonSuccess({
      found: true,
      pincode: result.pincode,
      name: result.name,
      district: result.district,
      state: result.state,
    });
  } catch (error) {
    console.error("Pincode lookup error:", error);
    return jsonError("Failed to look up PIN code", 500);
  }
}
