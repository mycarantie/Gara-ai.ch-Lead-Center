"use server";

import { revalidatePath } from "next/cache";
import { IMPORT_FIELDS, type ImportResult, type ImportRow } from "@/lib/csv";
import { CANTONS } from "@/lib/labels";
import { fetchAll, normalizeUrl } from "@/lib/leads";
import { normalizePhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

const MAX_ROWS_PER_CALL = 500;
const FIELD_KEYS = IMPORT_FIELDS.map((field) => field.key) as string[];

// Same link written with or without https://, www. or a trailing slash counts as one
function urlKey(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/\/+$/, "");
}

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// `firstLine` is the CSV line number of rows[0], used in the report (the header is line 1).
export async function importLeads(
  rows: ImportRow[],
  region: string,
  firstLine: number,
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, duplicates: [], errors: [] };
  if (!Array.isArray(rows) || rows.length > MAX_ROWS_PER_CALL) {
    result.errors.push({ line: firstLine, name: "", reason: "Fichier trop volumineux." });
    return result;
  }

  const supabase = await createClient();
  const existing = await fetchAll<{ phone: string | null; autoscout_url: string | null }>(
    (from, to) => supabase.from("leads").select("phone, autoscout_url").order("id").range(from, to),
  );
  const phones = new Set(existing.map((lead) => lead.phone).filter(Boolean) as string[]);
  const urls = new Set(
    existing.map((lead) => lead.autoscout_url && urlKey(lead.autoscout_url)).filter(Boolean) as string[],
  );

  const fallbackRegion = clean(region);
  const toInsert: { line: number; lead: Record<string, unknown> }[] = [];

  rows.forEach((raw, index) => {
    const line = firstLine + index;
    const row = Object.fromEntries(
      Object.entries(raw ?? {}).filter(([key]) => FIELD_KEYS.includes(key)),
    ) as ImportRow;

    const name = clean(row.garage_name);
    if (!name) {
      result.errors.push({ line, name: "", reason: "Nom du garage manquant" });
      return;
    }

    const phone = normalizePhone(row.phone);
    const autoscout = normalizeUrl(row.autoscout_url);
    if (phone && phones.has(phone)) {
      result.duplicates.push({ line, name, reason: "Téléphone déjà présent" });
      return;
    }
    if (autoscout && urls.has(urlKey(autoscout))) {
      result.duplicates.push({ line, name, reason: "Lien AutoScout déjà présent" });
      return;
    }
    if (phone) phones.add(phone);
    if (autoscout) urls.add(urlKey(autoscout));

    const cars = parseInt((row.cars_online ?? "").replace(/\D/g, ""), 10);
    const canton = clean(row.canton)?.toUpperCase() ?? null;

    toInsert.push({
      line,
      lead: {
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
      },
    });
  });

  if (toInsert.length > 0) {
    const { error } = await supabase.from("leads").insert(toInsert.map((item) => item.lead));
    if (!error) {
      result.imported = toInsert.length;
    } else {
      // The batch is all-or-nothing, so retry row by row to find the failing lines
      for (const item of toInsert) {
        const { error: rowError } = await supabase.from("leads").insert(item.lead);
        const name = String(item.lead.garage_name);
        if (!rowError) result.imported += 1;
        else if (rowError.code === "23505") {
          result.duplicates.push({ line: item.line, name, reason: "Téléphone déjà présent" });
        } else {
          console.error("Import row failed:", rowError.message);
          result.errors.push({ line: item.line, name, reason: "Enregistrement impossible" });
        }
      }
    }
  }

  revalidatePath("/", "layout");
  return result;
}
