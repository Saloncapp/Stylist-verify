/**
 * Builds src/data/india-lgd-locations.json from
 * planemad/india-local-government-directory (lgdirectory.gov.in dump).
 *
 * Run: node scripts/build-lgd-locations.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const tmp = path.join(root, "tmp-lgd");
const outFile = path.join(root, "src", "data", "india-lgd-locations.json");

const SMALL_WORDS = new Set(["and", "or", "of", "the", "da", "de"]);

function titleCase(raw) {
  const s = String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!s) return "";
  return s
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      if (!word) return word;
      if (i > 0 && SMALL_WORDS.has(word)) return word;
      // Keep short all-caps-ish tokens like HQ
      if (/^hq$/i.test(word)) return "HQ";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/** Minimal CSV parser that handles quoted fields. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (ch === "\r") continue;
    field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function rowsToObjects(rows) {
  const header = rows[0].map((h, idx) => {
    const trimmed = h.trim();
    // blocks.csv has duplicate "Block Name" headers; keep first by index suffix
    const prior = rows[0].slice(0, idx).map((x) => x.trim());
    if (prior.includes(trimmed)) return `${trimmed}__${idx}`;
    return trimmed;
  });
  return rows.slice(1).filter((r) => r.some((c) => c.trim())).map((r) => {
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = (r[i] ?? "").trim();
    });
    return obj;
  });
}

function readCsv(fileName) {
  const text = fs.readFileSync(path.join(tmp, fileName), "utf8");
  return rowsToObjects(parseCsv(text));
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

const statesRaw = readCsv("1-state.csv");
const districtsRaw = readCsv("2-district.csv");
const subdistrictsRaw = readCsv("3-subdistrict.csv");
const blocksRaw = readCsv("blocks.csv");

// Prefer first "State Name" column values
const stateNameByCode = new Map();
for (const row of statesRaw) {
  const code = row["State Code"];
  const name = titleCase(row["State Name"]);
  if (code && name) stateNameByCode.set(code, name);
}

/** districtKey = `${stateCode}::${districtCode}` */
const districtMeta = new Map();
for (const row of districtsRaw) {
  const stateCode = row["State Code"];
  const districtCode = row["District Code"];
  const stateName = stateNameByCode.get(stateCode) || titleCase(row["State Name"]);
  const districtName = titleCase(row["District Name"]);
  if (!stateCode || !districtCode || !districtName) continue;
  const key = `${stateCode}::${districtCode}`;
  districtMeta.set(key, { stateCode, stateName, districtCode, districtName });
}

const citiesByDistrict = new Map();
for (const row of subdistrictsRaw) {
  const stateCode = row["State Code"];
  const districtCode = row["District Code"];
  const name = titleCase(row["Sub-district Name"]);
  if (!stateCode || !districtCode || !name) continue;
  const key = `${stateCode}::${districtCode}`;
  if (!citiesByDistrict.has(key)) citiesByDistrict.set(key, []);
  citiesByDistrict.get(key).push(name);
}

const areasByDistrict = new Map();
for (const row of blocksRaw) {
  const stateCode = row["State Code"];
  const districtCode = row["District Code"];
  const name = titleCase(
    row["Block Name"] ||
      row["Block Name__7"] ||
      row["Block Name__8"] ||
      ""
  );
  if (!stateCode || !districtCode || !name) continue;
  const key = `${stateCode}::${districtCode}`;
  if (!areasByDistrict.has(key)) areasByDistrict.set(key, []);
  areasByDistrict.get(key).push(name);
}

/** Group by state name */
const byState = new Map();
for (const meta of districtMeta.values()) {
  if (!byState.has(meta.stateName)) byState.set(meta.stateName, []);
  const cities = uniqueSorted(citiesByDistrict.get(`${meta.stateCode}::${meta.districtCode}`) ?? []);
  const areas = uniqueSorted(areasByDistrict.get(`${meta.stateCode}::${meta.districtCode}`) ?? []);
  byState.get(meta.stateName).push({
    name: meta.districtName,
    cities,
    areas,
  });
}

const states = Array.from(byState.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, districts]) => ({
    name,
    districts: districts.sort((a, b) => a.name.localeCompare(b.name)),
  }));

const payload = {
  source: "planemad/india-local-government-directory",
  origin: "https://lgdirectory.gov.in",
  retrievedNote: "Administrative dump dated 11 March 2022 in upstream repo",
  mapping: {
    state: "administrative/1-state.csv",
    district: "administrative/2-district.csv",
    city: "administrative/3-subdistrict.csv (Sub-district / tehsil / taluka)",
    area: "administrative/blocks.csv (Block)",
  },
  states,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(payload));
const sizeKb = Math.round(fs.statSync(outFile).size / 1024);
console.log(
  `Wrote ${outFile} (${sizeKb} KB) — ${states.length} states, ${states.reduce((n, s) => n + s.districts.length, 0)} districts`
);
