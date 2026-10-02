import type { NextRequest } from "next/server";
import Papa from "papaparse";
import { safeCell } from "@/lib/csv";
import { toDateISO, todayISO } from "@/lib/dates";
import { buildLeadQuery, parseLeadFilters } from "@/lib/leadQuery";
import { fetchAll } from "@/lib/leads";
import { formatPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";

// Header names match the lead fields so an exported file can be re-imported as is.
const COLUMNS: (keyof Lead)[] = [
  "garage_name",
  "contact_name",
  "phone",
  "email",
  "city",
  "canton",
  "region",
  "cars_online",
  "is_franchise",
  "autoscout_url",
  "website",
  "address",
  "current_system",
  "do_not_contact",
  "status",
  "lost_reason",
  "followup_count",
  "last_contact_at",
  "next_action",
  "next_action_at",
  "trial_started_at",
  "plan",
  "monthly_value_chf",
  "notes",
];

function cell(lead: Lead, column: keyof Lead): string {
  const value = lead[column];
  if (value === null || value === undefined) return "";
  if (column === "phone") return formatPhone(lead.phone);
  if (column === "next_action_at" || column === "last_contact_at") {
    return toDateISO(String(value)) ?? "";
  }
  return typeof value === "string" ? safeCell(value) : String(value);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth) return new Response("Non autorisé", { status: 401 });

  const values = parseLeadFilters(Object.fromEntries(request.nextUrl.searchParams));
  const leads = await fetchAll<Lead>((from, to) =>
    buildLeadQuery(supabase, values).order("id").range(from, to),
  );

  const csv = Papa.unparse({
    fields: COLUMNS,
    data: leads.map((lead) => COLUMNS.map((column) => cell(lead, column))),
  });

  // The BOM makes Excel read the accents as UTF-8
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${todayISO()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
