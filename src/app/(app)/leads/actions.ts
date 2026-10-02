"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { todayISO, toTimestamp } from "@/lib/dates";
import {
  LOGGABLE_ACTIVITIES,
  LOST_REASON_LABELS,
  LOST_REASONS,
  STATUS_LABELS,
  STATUSES,
} from "@/lib/labels";
import { normalizeUrl } from "@/lib/leads";
import { normalizePhone } from "@/lib/phone";
import { nextForStatus, suggestNext } from "@/lib/rules";
import { createClient } from "@/lib/supabase/server";
import type { ActivityType, Lead, LeadStatus, LostReason } from "@/lib/types";

export type FormResult = { error: string } | undefined;

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function httpUrl(formData: FormData, key: string): string | null {
  return normalizeUrl(text(formData, key));
}

function number(formData: FormData, key: string): number | null {
  const value = text(formData, key);
  if (value === null) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseLead(formData: FormData) {
  const rawStatus = String(formData.get("status") ?? "");
  const status = (STATUSES as string[]).includes(rawStatus)
    ? (rawStatus as LeadStatus)
    : "to_contact";

  const rawReason = String(formData.get("lost_reason") ?? "");
  const lostReason =
    status === "lost" && (LOST_REASONS as string[]).includes(rawReason)
      ? (rawReason as LostReason)
      : null;

  const cars = number(formData, "cars_online");
  const plan = text(formData, "plan");

  return {
    garage_name: text(formData, "garage_name") ?? "",
    contact_name: text(formData, "contact_name"),
    phone: normalizePhone(text(formData, "phone")),
    email: text(formData, "email"),
    website: httpUrl(formData, "website"),
    autoscout_url: httpUrl(formData, "autoscout_url"),
    address: text(formData, "address"),
    city: text(formData, "city"),
    canton: text(formData, "canton"),
    region: text(formData, "region"),
    cars_online: cars === null ? null : Math.round(cars),
    is_franchise: formData.get("is_franchise") === "on",
    current_system: text(formData, "current_system"),
    do_not_contact: formData.get("do_not_contact") === "on",
    status,
    lost_reason: lostReason,
    next_action: text(formData, "next_action"),
    next_action_at: toTimestamp(text(formData, "next_action_at")),
    trial_started_at: text(formData, "trial_started_at"),
    plan: plan === "plus" || plan === "pro" ? plan : null,
    monthly_value_chf: number(formData, "monthly_value_chf"),
    notes: text(formData, "notes"),
  };
}

function saveError(error: { code?: string; message: string }): FormResult {
  if (error.code === "23505") {
    return { error: "Un lead avec ce numéro de téléphone existe déjà." };
  }
  console.error("Lead save failed:", error.message);
  return { error: "Enregistrement impossible. Réessayez." };
}

export async function createLead(formData: FormData): Promise<FormResult> {
  const lead = parseLead(formData);
  if (!lead.garage_name) return { error: "Le nom du garage est obligatoire." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").insert(lead).select("id").single();
  if (error) return saveError(error);

  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

export async function updateLead(id: string, formData: FormData): Promise<FormResult> {
  const lead = parseLead(formData);
  if (!lead.garage_name) return { error: "Le nom du garage est obligatoire." };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("leads")
    .select("status")
    .eq("id", id)
    .single();
  if (!current) return { error: "Lead introuvable." };

  const { error } = await supabase.from("leads").update(lead).eq("id", id);
  if (error) return saveError(error);

  const previous = current.status as LeadStatus;
  if (previous !== lead.status) {
    await supabase.from("activities").insert({
      lead_id: id,
      type: "status_change",
      summary: `${STATUS_LABELS[previous]} → ${STATUS_LABELS[lead.status]}`,
    });
  }

  revalidatePath("/", "layout");
  redirect(`/leads/${id}`);
}

export async function setNextAction(id: string, formData: FormData): Promise<FormResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      next_action: text(formData, "next_action"),
      next_action_at: toTimestamp(text(formData, "next_action_at")),
    })
    .eq("id", id);
  if (error) return saveError(error);

  revalidatePath("/", "layout");
}

export async function changeStatus(id: string, formData: FormData): Promise<FormResult> {
  const rawStatus = String(formData.get("status") ?? "");
  if (!(STATUSES as string[]).includes(rawStatus)) return { error: "Statut inconnu." };
  const status = rawStatus as LeadStatus;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("leads")
    .select("status, trial_started_at")
    .eq("id", id)
    .single();
  if (!current) return { error: "Lead introuvable." };

  const previous = current.status as LeadStatus;
  if (previous === status) return;

  const rawReason = String(formData.get("lost_reason") ?? "");
  const lostReason =
    status === "lost" && (LOST_REASONS as string[]).includes(rawReason)
      ? (rawReason as LostReason)
      : null;
  if (status === "lost" && !lostReason) return { error: "Choisissez une raison." };

  const today = todayISO();
  const update: Record<string, unknown> = { status, lost_reason: lostReason };

  const next = nextForStatus(status, today);
  if (next) {
    update.next_action = next.nextAction || null;
    update.next_action_at = toTimestamp(next.nextActionDate);
  }
  if (status === "trial" && !current.trial_started_at) update.trial_started_at = today;
  if (status === "paying") {
    const plan = text(formData, "plan");
    update.plan = plan === "plus" || plan === "pro" ? plan : null;
    update.monthly_value_chf = number(formData, "monthly_value_chf");
  }

  const { error } = await supabase.from("leads").update(update).eq("id", id);
  if (error) return saveError(error);

  const reason = lostReason ? ` (${LOST_REASON_LABELS[lostReason]})` : "";
  await supabase.from("activities").insert({
    lead_id: id,
    type: "status_change",
    summary: `${STATUS_LABELS[previous]} → ${STATUS_LABELS[status]}${reason}`,
  });

  revalidatePath("/", "layout");
}

export async function logActivity(id: string, formData: FormData): Promise<FormResult> {
  const rawType = String(formData.get("type") ?? "");
  if (!(LOGGABLE_ACTIVITIES as string[]).includes(rawType)) {
    return { error: "Choisissez un type d'activité." };
  }
  const type = rawType as ActivityType;

  const rawStatus = String(formData.get("status") ?? "");
  if (!(STATUSES as string[]).includes(rawStatus)) return { error: "Statut inconnu." };
  const status = rawStatus as LeadStatus;

  const rawReason = String(formData.get("lost_reason") ?? "");
  const lostReason =
    status === "lost" && (LOST_REASONS as string[]).includes(rawReason)
      ? (rawReason as LostReason)
      : null;
  if (status === "lost" && !lostReason) return { error: "Choisissez une raison." };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("leads")
    .select("status, lost_reason, followup_count, next_action, next_action_at, trial_started_at")
    .eq("id", id)
    .single();
  if (!current) return { error: "Lead introuvable." };

  const previous = current.status as LeadStatus;
  const today = todayISO();
  const suggestion = suggestNext(
    current as Pick<
      Lead,
      "status" | "lost_reason" | "followup_count" | "next_action" | "next_action_at"
    >,
    type,
    today,
  );

  const { error: activityError } = await supabase
    .from("activities")
    .insert({ lead_id: id, type, summary: text(formData, "summary") });
  if (activityError) return saveError(activityError);

  const update: Record<string, unknown> = {
    status,
    lost_reason: lostReason,
    followup_count: suggestion.followupCount,
    last_contact_at: new Date().toISOString(),
    next_action: text(formData, "next_action"),
    next_action_at: toTimestamp(text(formData, "next_action_at")),
  };
  if (status === "trial" && !current.trial_started_at) update.trial_started_at = today;
  if (status === "paying" && previous !== "paying") {
    const plan = text(formData, "plan");
    update.plan = plan === "plus" || plan === "pro" ? plan : null;
    update.monthly_value_chf = number(formData, "monthly_value_chf");
  }

  const { error } = await supabase.from("leads").update(update).eq("id", id);
  if (error) return saveError(error);

  if (previous !== status) {
    const reason = lostReason ? ` (${LOST_REASON_LABELS[lostReason]})` : "";
    await supabase.from("activities").insert({
      lead_id: id,
      type: "status_change",
      summary: `${STATUS_LABELS[previous]} → ${STATUS_LABELS[status]}${reason}`,
    });
  }

  revalidatePath("/", "layout");
}

export async function deleteLead(id: string): Promise<FormResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) {
    console.error("Lead delete failed:", error.message);
    return { error: "Suppression impossible. Réessayez." };
  }

  revalidatePath("/", "layout");
  redirect("/leads");
}
