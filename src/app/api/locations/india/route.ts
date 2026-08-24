import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api";
import {
  isKnownDistrict,
  listAreasForDistrict,
  listCitiesForDistrict,
  listDistrictsForState,
  listIndianStates,
} from "@/lib/india-location-data";

/**
 * India location cascade (LGD dataset).
 * GET ?level=states
 * GET ?level=districts&state=
 * GET ?level=cities&state=&district=
 * GET ?level=areas&state=&district=
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const level = searchParams.get("level")?.trim() ?? "";

    if (level === "states") {
      return jsonSuccess({ states: listIndianStates() });
    }

    if (level === "districts") {
      const state = searchParams.get("state")?.trim() ?? "";
      if (!state) return jsonError("State is required", 400);
      return jsonSuccess({ districts: listDistrictsForState(state) });
    }

    if (level === "cities") {
      const state = searchParams.get("state")?.trim() ?? "";
      const district = searchParams.get("district")?.trim() ?? "";
      if (!state || !district) {
        return jsonError("State and district are required", 400);
      }
      return jsonSuccess({
        cities: listCitiesForDistrict(state, district),
        knownDistrict: isKnownDistrict(state, district),
      });
    }

    if (level === "areas") {
      const state = searchParams.get("state")?.trim() ?? "";
      const district = searchParams.get("district")?.trim() ?? "";
      if (!state || !district) {
        return jsonError("State and district are required", 400);
      }
      // Areas (blocks) are district-scoped in LGD; city is unused for filtering.
      return jsonSuccess({
        areas: listAreasForDistrict(state, district).map((name) => ({
          name,
          pincode: "",
        })),
        knownDistrict: isKnownDistrict(state, district),
      });
    }

    return jsonError("Invalid level", 400);
  } catch (error) {
    console.error("Locations API error:", error);
    return jsonError("Failed to load locations", 500);
  }
}
