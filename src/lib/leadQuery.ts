import type { SupabaseClient } from "@supabase/supabase-js";
import { CANTONS, STATUSES } from "./labels";

export interface LeadFilterValues {
  q: string;
  region: string;
  canton: string;
  status: string;
  qualified: boolean;
  sort: string;
}

type SearchParams = Record<string, string | string[] | undefined>;

export function parseLeadFilters(searchParams: SearchParams): LeadFilterValues {
  const param = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value.trim() : "";
  };

  return {
    q: param("q"),
    region: param("region"),
    canton: CANTONS.includes(param("canton")) ? param("canton") : "",
    status: (STATUSES as string[]).includes(param("status")) ? param("status") : "",
    qualified: param("qualified") === "1",
    sort: ["name", "cars", "last"].includes(param("sort")) ? param("sort") : "next",
  };
}

export function leadFiltersToQueryString(values: LeadFilterValues): string {
  const params = new URLSearchParams();
  if (values.q) params.set("q", values.q);
  if (values.region) params.set("region", values.region);
  if (values.canton) params.set("canton", values.canton);
  if (values.status) params.set("status", values.status);
  if (values.qualified) params.set("qualified", "1");
  if (values.sort !== "next") params.set("sort", values.sort);
  return params.toString();
}

// Shared by the leads list and the CSV export so both show the same rows.
export function buildLeadQuery(supabase: SupabaseClient, values: LeadFilterValues) {
  let query = supabase.from("leads").select("*", { count: "exact" });

  // Quoted values keep commas, dots and parentheses from breaking the PostgREST filter syntax
  const q = values.q.replace(/["\\%*]/g, " ").trim();
  if (q) {
    const filters = ["garage_name", "contact_name", "city"].map(
      (column) => `${column}.ilike."%${q}%"`,
    );
    const digits = q.replace(/\D/g, "").replace(/^0+/, "");
    if (digits.length >= 3) filters.push(`phone.ilike."%${digits}%"`);
    query = query.or(filters.join(","));
  }
  if (values.region) query = query.eq("region", values.region);
  if (values.canton) query = query.eq("canton", values.canton);
  if (values.status) query = query.eq("status", values.status);
  if (values.qualified) {
    query = query.gte("cars_online", 20).lte("cars_online", 150).eq("is_franchise", false);
  }

  if (values.sort === "name") {
    query = query.order("garage_name");
  } else if (values.sort === "cars") {
    query = query.order("cars_online", { ascending: false, nullsFirst: false });
  } else if (values.sort === "last") {
    query = query.order("last_contact_at", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("next_action_at", { ascending: true, nullsFirst: false });
  }
  if (values.sort !== "name") query = query.order("garage_name");

  return query;
}
