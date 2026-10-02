"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TEMPLATES } from "@/lib/templates";

export type TemplateResult = { error: string } | undefined;

function parseTemplate(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
  };
}

function failed(context: string, message: string): TemplateResult {
  console.error(`${context}:`, message);
  return { error: "Enregistrement impossible. Réessayez." };
}

async function nextSortOrder(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("templates")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

export async function createTemplate(formData: FormData): Promise<TemplateResult> {
  const template = parseTemplate(formData);
  if (!template.name || !template.body) return { error: "Le nom et le message sont obligatoires." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .insert({ ...template, sort_order: await nextSortOrder(supabase) });
  if (error) return failed("Template create failed", error.message);

  revalidatePath("/", "layout");
}

export async function updateTemplate(id: string, formData: FormData): Promise<TemplateResult> {
  const template = parseTemplate(formData);
  if (!template.name || !template.body) return { error: "Le nom et le message sont obligatoires." };

  const supabase = await createClient();
  const { error } = await supabase.from("templates").update(template).eq("id", id);
  if (error) return failed("Template update failed", error.message);

  revalidatePath("/", "layout");
}

export async function deleteTemplate(id: string): Promise<TemplateResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) return failed("Template delete failed", error.message);

  revalidatePath("/", "layout");
}

export async function moveTemplate(id: string, direction: "up" | "down"): Promise<TemplateResult> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("templates")
    .select("id, sort_order")
    .order("sort_order")
    .order("name");
  const rows = data ?? [];

  const from = rows.findIndex((row) => row.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= rows.length) return;
  [rows[from], rows[to]] = [rows[to], rows[from]];

  // Renumber everything so the order stays unambiguous even if sort_order values collided
  for (const [index, row] of rows.entries()) {
    if (row.sort_order === index) continue;
    const { error } = await supabase.from("templates").update({ sort_order: index }).eq("id", row.id);
    if (error) return failed("Template move failed", error.message);
  }

  revalidatePath("/", "layout");
}

export async function loadDefaultTemplates(): Promise<TemplateResult> {
  const supabase = await createClient();
  const { data } = await supabase.from("templates").select("name");
  const existing = new Set((data ?? []).map((row) => row.name as string));

  const missing = DEFAULT_TEMPLATES.filter((template) => !existing.has(template.name));
  if (missing.length === 0) return { error: "Les modèles par défaut sont déjà présents." };

  const start = await nextSortOrder(supabase);
  const { error } = await supabase
    .from("templates")
    .insert(missing.map((template, index) => ({ ...template, sort_order: start + index })));
  if (error) return failed("Default templates failed", error.message);

  revalidatePath("/", "layout");
}
