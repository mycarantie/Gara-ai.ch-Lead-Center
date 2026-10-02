"use server";

import { revalidatePath } from "next/cache";
import { IMPORT_FIELDS, type ImportResult, type ImportRow } from "@/lib/csv";
import { type ExistingLead, FILLABLE, planImport } from "@/lib/importPlan";
import { fetchAll } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";

const MAX_ROWS_PER_CALL = 500;
const UPDATE_CONCURRENCY = 8;

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  IMPORT_FIELDS.map((field) => [field.key, field.label.toLowerCase()]),
);

// `firstLine` is the CSV line number of rows[0], used in the report (the header is line 1).
export async function importLeads(
  rows: ImportRow[],
  region: string,
  firstLine: number,
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, updated: [], duplicates: [], errors: [] };
  if (!Array.isArray(rows) || rows.length > MAX_ROWS_PER_CALL) {
    result.errors.push({ line: firstLine, name: "", reason: "Fichier trop volumineux." });
    return result;
  }

  const supabase = await createClient();
  const existing = await fetchAll<ExistingLead>((from, to) =>
    supabase
      .from("leads")
      .select(`id, garage_name, phone, ${FILLABLE.join(", ")}`)
      .order("id")
      .range(from, to),
  );

  const plan = planImport(rows, existing, region, firstLine);
  result.duplicates.push(...plan.duplicates);
  result.errors.push(...plan.errors);

  for (let start = 0; start < plan.toUpdate.length; start += UPDATE_CONCURRENCY) {
    await Promise.all(
      plan.toUpdate.slice(start, start + UPDATE_CONCURRENCY).map(async (item) => {
        const { error } = await supabase.from("leads").update(item.patch).eq("id", item.id);
        if (error) {
          console.error("Import update failed:", error.message);
          result.errors.push({ line: item.line, name: item.name, reason: "Mise à jour impossible" });
        } else {
          const fields = Object.keys(item.patch).map((field) => FIELD_LABELS[field] ?? field);
          result.updated.push({ line: item.line, name: item.name, reason: fields.join(", ") });
        }
      }),
    );
  }
  result.updated.sort((a, b) => a.line - b.line);

  if (plan.toInsert.length > 0) {
    const { error } = await supabase.from("leads").insert(plan.toInsert.map((item) => item.lead));
    if (!error) {
      result.imported = plan.toInsert.length;
    } else {
      // The batch is all-or-nothing, so retry row by row to find the failing lines
      for (const item of plan.toInsert) {
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
