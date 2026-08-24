import lgdData from "@/data/india-lgd-locations.json";

/**
 * India location cascade backed by
 * https://github.com/planemad/india-local-government-directory
 * (source: https://lgdirectory.gov.in).
 *
 * Mapping:
 * - State    → LGD State
 * - District → LGD District
 * - City     → LGD Sub-district (tehsil / taluka / mandal)
 * - Area     → LGD Block
 */

type LgdDistrict = {
  name: string;
  cities: string[];
  areas: string[];
};

type LgdState = {
  name: string;
  districts: LgdDistrict[];
};

type LgdFile = {
  source?: string;
  states: LgdState[];
};

const data = lgdData as LgdFile;

const EMPTY: string[] = [];

const stateMap = new Map<string, LgdState>();
const districtMap = new Map<string, LgdDistrict>(); // key: `${state}::${district}`

for (const state of data.states) {
  stateMap.set(state.name, state);
  for (const district of state.districts) {
    districtMap.set(`${state.name}::${district.name}`, district);
  }
}

const INDIAN_STATE_NAMES: string[] = data.states
  .map((s) => s.name)
  .sort((a, b) => a.localeCompare(b));

/** Common India Post → LGD state name aliases. */
const STATE_ALIASES: Record<string, string> = {
  delhi: "Delhi",
  "nct of delhi": "Delhi",
  "delhi nct": "Delhi",
  orissa: "Odisha",
  pondicherry: "Puducherry",
  puducherry: "Puducherry",
  "dadra & nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "andaman & nicobar islands": "Andaman and Nicobar Islands",
  "jammu & kashmir": "Jammu and Kashmir",
};

function districtKey(state: string, district: string): string {
  return `${state}::${district}`;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\s*\((ut|nct)\)\s*$/i, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Best-effort match of a free-text name against catalog options. */
export function matchLocationName(candidates: string[], raw: string): string {
  const target = normalizeName(raw);
  if (!target || candidates.length === 0) return "";

  const exact = candidates.find((c) => normalizeName(c) === target);
  if (exact) return exact;

  const starts = candidates.find((c) => {
    const n = normalizeName(c);
    return n.startsWith(target) || target.startsWith(n);
  });
  if (starts) return starts;

  const includes = candidates.find((c) => {
    const n = normalizeName(c);
    return n.includes(target) || target.includes(n);
  });
  return includes ?? "";
}

/** Map India Post locality fields onto LGD catalog names when possible. */
export function resolvePostalToCatalog(input: {
  state: string;
  district: string;
  city: string;
}): { state: string; district: string; city: string } {
  const alias =
    STATE_ALIASES[normalizeName(input.state)] ??
    STATE_ALIASES[normalizeName(input.state).replace(/^the /, "")];
  const state =
    alias && stateMap.has(alias)
      ? alias
      : matchLocationName(INDIAN_STATE_NAMES, input.state);

  const districts = state ? listDistrictsForState(state) : EMPTY;
  const district = matchLocationName(districts, input.district);

  const cities =
    state && district ? listCitiesForDistrict(state, district) : EMPTY;
  const city =
    matchLocationName(cities, input.city) ||
    matchLocationName(cities, input.district);

  return { state, district, city };
}

/** Official LGD state / UT names. */
export function listIndianStates(): string[] {
  return INDIAN_STATE_NAMES;
}

/** Districts for a state. */
export function listDistrictsForState(state: string): string[] {
  if (!state) return EMPTY;
  const entry = stateMap.get(state);
  if (!entry) return EMPTY;
  return entry.districts.map((d) => d.name);
}

/** Sub-districts (City / Town options) for a district. */
export function listCitiesForDistrict(
  state: string,
  district: string
): string[] {
  if (!state || !district) return EMPTY;
  return districtMap.get(districtKey(state, district))?.cities ?? EMPTY;
}

/** Blocks (Area / Locality options) for a district. */
export function listAreasForDistrict(
  state: string,
  district: string
): string[] {
  if (!state || !district) return EMPTY;
  return districtMap.get(districtKey(state, district))?.areas ?? EMPTY;
}

export function isKnownDistrict(state: string, district: string): boolean {
  if (!state || !district) return false;
  return districtMap.has(districtKey(state, district));
}

/** @deprecated Prefer listCitiesForDistrict — kept for older call sites. */
export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}
