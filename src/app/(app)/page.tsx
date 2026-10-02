import LeadCard from "@/components/LeadCard";
import RegionSelect from "@/components/RegionSelect";
import { addDays, toDateISO, todayISO } from "@/lib/dates";
import { getRegions } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";

const UPCOMING_DAYS = 3;
const NEW_LEADS_LIMIT = 10;

function LeadList({ leads, today }: { leads: Lead[]; today: string }) {
  return (
    <ul className="mt-2 grid gap-2 md:grid-cols-2">
      {leads.map((lead) => (
        <li key={lead.id}>
          <LeadCard lead={lead} today={today} />
        </li>
      ))}
    </ul>
  );
}

export default async function TodayPage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const region = typeof searchParams.region === "string" ? searchParams.region : "";

  const today = todayISO();
  const supabase = await createClient();

  let newQuery = supabase
    .from("leads")
    .select("*")
    .eq("status", "to_contact")
    .is("next_action_at", null)
    .eq("do_not_contact", false);
  if (region) newQuery = newQuery.eq("region", region);

  const [{ data: dueRows, error }, { data: newRows }, regions] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .not("next_action_at", "is", null)
      .lte("next_action_at", `${addDays(today, UPCOMING_DAYS)}T23:59:59Z`)
      .not("status", "in", "(paying,lost,not_qualified)")
      .eq("do_not_contact", false)
      .order("next_action_at")
      .order("garage_name"),
    newQuery.order("created_at").limit(NEW_LEADS_LIMIT),
    getRegions(supabase),
  ]);

  const due = (dueRows ?? []) as Lead[];
  const overdue = due.filter((lead) => toDateISO(lead.next_action_at)! < today);
  const todayLeads = due.filter((lead) => toDateISO(lead.next_action_at) === today);
  const upcoming = due.filter((lead) => toDateISO(lead.next_action_at)! > today);
  const newLeads = (newRows ?? []) as Lead[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aujourd&apos;hui</h1>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            {todayLeads.length} {todayLeads.length > 1 ? "actions" : "action"} aujourd&apos;hui
          </span>
          {overdue.length > 0 && (
            <span className="ml-2 font-semibold text-red-700">· {overdue.length} en retard</span>
          )}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Impossible de charger les actions.
        </p>
      )}

      {overdue.length > 0 && (
        <section className="rounded-xl border-l-4 border-red-500 pl-3">
          <h2 className="text-base font-bold text-red-700">En retard ({overdue.length})</h2>
          <LeadList leads={overdue} today={today} />
        </section>
      )}

      <section>
        <h2 className="text-base font-bold">Aujourd&apos;hui ({todayLeads.length})</h2>
        {todayLeads.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucune action prévue aujourd&apos;hui.</p>
        ) : (
          <LeadList leads={todayLeads} today={today} />
        )}
      </section>

      <details className="group">
        <summary className="cursor-pointer list-none text-base font-bold">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">›</span>
          Prochains jours ({upcoming.length})
        </summary>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Rien de prévu dans les {UPCOMING_DAYS} prochains jours.
          </p>
        ) : (
          <LeadList leads={upcoming} today={today} />
        )}
      </details>

      <section>
        <h2 className="text-base font-bold">Nouveaux à contacter</h2>
        <div className="mt-2">
          <RegionSelect regions={regions} value={region} remember />
        </div>
        {newLeads.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Aucun nouveau lead à contacter{region ? " dans cette région" : ""}.
          </p>
        ) : (
          <LeadList leads={newLeads} today={today} />
        )}
      </section>
    </div>
  );
}
