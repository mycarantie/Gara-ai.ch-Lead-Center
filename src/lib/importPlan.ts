import { IMPORT_FIELDS, type ImportRow } from "./csv";
import { CANTONS } from "./labels";
import { normalizeUrl } from "./leads";
import { normalizePhone } from "./phone";

// Fields a re-import may fill in on an existing lead, and only when the lead has no value yet
export const FILLABLE = [
  "email",
  "contact_name",
  "website",
  "autoscout_url",
  "address",
  "city",
  "canton",
  "region",
  "cars_online",
  "current_system",
  "notes",
] as const;

export type ExistingLead = { id: string; garage_name: string; phone: string | null } & Record<
  (typeof FILLABLE)[number],
  string | number | null
>;

type Skipped = { line: number; name: string; reason: string };

export interface ImportPlan {
  toInsert: { line: number; lead: Record<string, unknown> }[];
  toUpdate: { line: number; name: string; id: string; patch: Record<string, unknown> }[];
  duplicates: Skipped[];
  errors: Skipped[];
}

const FIELD_KEYS = IMPORT_FIELDS.map((field) => field.key) as string[];

// Same link written with or without https://, www. or a trailing slash counts as one
function urlKey(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/\/+$/, "");
}

// Fallback identity for rows that have neither a phone nor an AutoScout link
function nameKey(name: string, city: string | null): string {
  return `${name.trim().toLowerCase()}|${(city ?? "").trim().toLowerCase()}`;
}

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Decides, for each CSV row, whether it is a new lead, completes an existing one, or is skipped.
// `firstLine` is the CSV line number of rows[0], used in the report (the header is line 1).
export function planImport(
  rows: ImportRow[],
  existing: ExistingLead[],
  region: string,
  firstLine: number,
): ImportPlan {
  const plan: ImportPlan = { toInsert: [], toUpdate: [], duplicates: [], errors: [] };

  const byPhone = new Map<string, ExistingLead>();
  const byUrl = new Map<string, ExistingLead>();
  const byName = new Map<string, ExistingLead>();
  for (const lead of existing) {
    if (lead.phone) byPhone.set(lead.phone, lead);
    if (typeof lead.autoscout_url === "string" && lead.autoscout_url) {
      byUrl.set(urlKey(lead.autoscout_url), lead);
    }
    byName.set(nameKey(lead.garage_name, lead.city as string | null), lead);
  }

  // Keys of rows accepted earlier in this same file, which are not in the database yet
  const seen = new Set<string>();
  const fallbackRegion = clean(region);

  rows.forEach((raw, index) => {
    const line = firstLine + index;
    const row = Object.fromEntries(
      Object.entries(raw ?? {}).filter(([key]) => FIELD_KEYS.includes(key)),
    ) as ImportRow;

    const name = clean(row.garage_name);
    if (!name) {
      plan.errors.push({ line, name: "", reason: "Nom du garage manquant" });
      return;
    }

    const phone = normalizePhone(row.phone);
    const autoscout = normalizeUrl(row.autoscout_url);
    const cars = parseInt((row.cars_online ?? "").replace(/\D/g, ""), 10);
    const canton = clean(row.canton)?.toUpperCase() ?? null;

    const lead = {
      garage_name: name,
      contact_name: clean(row.contact_name),
      phone,
      email: clean(row.email),
      website: normalizeUrl(row.website),
      autoscout_url: autoscout,
      address: clean(row.address),
      city: clean(row.city),
      canton: canton && CANTONS.includes(canton) ? canton : null,
      region: clean(row.region) ?? fallbackRegion,
      cars_online: Number.isFinite(cars) ? cars : null,
      is_franchise: /^(true|1|oui|yes|vrai|x)$/i.test(row.is_franchise?.trim() ?? ""),
      current_system: clean(row.current_system),
      notes: clean(row.notes),
      status: "to_contact",
    };

    const useName = !phone && !autoscout;
    const match =
      (phone && byPhone.get(phone)) ||
      (autoscout && byUrl.get(urlKey(autoscout))) ||
      (useName && byName.get(nameKey(name, lead.city))) ||
      null;

    if (match) {
      const patch: Record<string, unknown> = {};
      for (const field of FILLABLE) {
        const current = match[field];
        const incoming = lead[field];
        if ((current === null || current === "") && incoming !== null) {
          patch[field] = incoming;
          // So a later row for the same lead does not fill the same field again
          match[field] = incoming;
        }
      }
      if (Object.keys(patch).length > 0) {
        plan.toUpdate.push({ line, name, id: match.id, patch });
      } else {
        plan.duplicates.push({ line, name, reason: "Déjà présent, rien à compléter" });
      }
      return;
    }

    const keys = [
      phone && `phone:${phone}`,
      autoscout && `url:${urlKey(autoscout)}`,
      useName && `name:${nameKey(name, lead.city)}`,
    ].filter(Boolean) as string[];

    if (keys.some((key) => seen.has(key))) {
      plan.duplicates.push({ line, name, reason: "En double dans le fichier" });
      return;
    }
    keys.forEach((key) => seen.add(key));
    plan.toInsert.push({ line, lead });
  });

  return plan;
}
