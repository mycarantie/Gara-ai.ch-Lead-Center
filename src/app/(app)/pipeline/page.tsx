import Link from "next/link";
import RegionSelect from "@/components/RegionSelect";
import StatusSelect from "@/components/StatusSelect";
import { formatDate, toDateISO, todayISO } from "@/lib/dates";
import { STATUS_LABELS, STATUSES } from "@/lib/labels";
import { fetchAll, getRegions } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";

type PipelineLead = Pick<Lead, "id" | "garage_name" | "city" | "status" | "next_action_at">;

const COLUMNS = STATUSES.filter((status) => status !== "not_qualified");

export default async function PipelinePage(props: PageProps<"/pipeline">) {
  const searchParams = await props.searchParams;
  const region = typeof searchParams.region === "string" ? searchParams.region : "";

  const supabase = await createClient();
  const [leads, regions] = await Promise.all([
    fetchAll<PipelineLead>((from, to) => {
      let query = supabase
        .from("leads")
        .select("id, garage_name, city, status, next_action_at")
        .neq("status", "not_qualified");
      if (region) query = query.eq("region", region);
      return query
        .order("next_action_at", { ascending: true, nullsFirst: false })
        .order("garage_name")
        .order("id")
        .range(from, to);
    }),
    getRegions(supabase),
  ]);
  const today = todayISO();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pipeline</h1>
      <RegionSelect regions={regions} value={region} />

      {/* Negative margin lets the columns scroll edge to edge on a phone */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4">
        {COLUMNS.map((status) => {
          const column = leads.filter((lead) => lead.status === status);
          return (
            <section key={status} className="w-64 shrink-0 snap-start rounded-xl bg-slate-100 p-2">
              <h2 className="flex items-center justify-between px-1 py-1 text-sm font-semibold text-slate-900">
                {STATUS_LABELS[status]}
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                  {column.length}
                </span>
              </h2>
              <ul className="mt-1 space-y-2">
                {column.map((lead) => {
                  const nextDate = toDateISO(lead.next_action_at);
                  const overdue = nextDate !== null && nextDate < today;
                  return (
                    <li key={lead.id} className="rounded-lg border border-slate-200 bg-white p-2">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="block break-words text-sm font-semibold text-slate-900 hover:underline"
                      >
                        {lead.garage_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {lead.city}
                        {lead.city && nextDate && " · "}
                        {nextDate && (
                          <span className={overdue ? "font-medium text-red-700" : ""}>
                            {formatDate(nextDate)}
                          </span>
                        )}
                      </p>
                      <div className="mt-2">
                        <StatusSelect key={lead.status} leadId={lead.id} status={lead.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
