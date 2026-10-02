import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead, LogLead, WhatsAppLead } from "./types";

export async function getRegions(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.from("leads").select("region").not("region", "is", null);
  const regions = new Set((data ?? []).map((row) => row.region as string));
  return [...regions].sort((a, b) => a.localeCompare(b, "fr"));
}

// Supabase returns at most 1000 rows per request; this reads every page.
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
): Promise<T[]> {
  const size = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error || !data) break;
    rows.push(...(data as T[]));
    if (data.length < size) break;
  }
  return rows;
}

// Only http(s) links are kept, so a stored URL is always safe to use as a link target.
export function normalizeUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return URL.canParse(withScheme) ? withScheme : null;
}

export function toWhatsAppLead(lead: Lead & { phone: string }): WhatsAppLead {
  return {
    ...toLogLead(lead),
    phone: lead.phone,
    contact_name: lead.contact_name,
    city: lead.city,
    cars_online: lead.cars_online,
  };
}

export function toLogLead(lead: Lead): LogLead {
  return {
    id: lead.id,
    garage_name: lead.garage_name,
    status: lead.status,
    lost_reason: lead.lost_reason,
    followup_count: lead.followup_count,
    next_action: lead.next_action,
    next_action_at: lead.next_action_at,
  };
}
