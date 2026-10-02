import RegionSelect from "@/components/RegionSelect";
import { todayISO } from "@/lib/dates";
import { LOST_REASON_LABELS } from "@/lib/labels";
import { fetchAll, getRegions } from "@/lib/leads";
import { computeStats, type StatActivity, type StatLead, statsByRegion } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

const sectionClass = "rounded-xl border border-slate-200 bg-white p-4";
const headingClass = "text-sm font-semibold text-slate-900";

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 shrink-0 text-slate-700">{label}</span>
      <div className="h-5 min-w-0 flex-1 rounded bg-slate-100">
        <div
          className="h-5 rounded bg-slate-800"
          style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-semibold tabular-nums text-slate-900">
        {count}
      </span>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-2xl font-bold tabular-nums text-slate-900">{value}</div>
      <div className="mt-0.5 text-xs text-slate-600">{label}</div>
    </div>
  );
}

export default async function StatsPage(props: PageProps<"/stats">) {
  const searchParams = await props.searchParams;
  const region = typeof searchParams.region === "string" ? searchParams.region : "";

  const supabase = await createClient();
  const [allLeads, activities, regions] = await Promise.all([
    fetchAll<StatLead>((from, to) =>
      supabase
        .from("leads")
        .select("id, status, region, lost_reason, monthly_value_chf")
        .order("id")
        .range(from, to),
    ),
    fetchAll<StatActivity>((from, to) =>
      supabase
        .from("activities")
        .select("lead_id, type, created_at")
        .neq("type", "status_change")
        .neq("type", "note")
        .order("id")
        .range(from, to),
    ),
    getRegions(supabase),
  ]);

  const leads = region ? allLeads.filter((lead) => lead.region === region) : allLeads;
  const stats = computeStats(leads, activities, todayISO());
  const regionRows = statsByRegion(allLeads, activities);

  const funnelMax = Math.max(...stats.funnel.map((row) => row.count));
  const lostMax = Math.max(0, ...stats.lostReasons.map((row) => row.count));
  const chf = new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Stats</h1>
      <RegionSelect regions={regions} value={region} />

      <section className={sectionClass}>
        <h2 className={headingClass}>Clients</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Tile label="Clients payants" value={stats.reached.paying} />
          <Tile label="Revenu mensuel (MRR)" value={`CHF ${chf.format(stats.mrr)}`} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Leads par statut</h2>
        <div className="mt-3 space-y-2">
          {stats.funnel.map((row) => (
            <Bar key={row.label} label={row.label} count={row.count} max={funnelMax} />
          ))}
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Taux de conversion</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {stats.conversions.map((row) => (
            <div key={row.label} className="rounded-lg bg-slate-50 p-3">
              <div className="text-2xl font-bold tabular-nums text-slate-900">
                {row.whole > 0 ? `${Math.round((row.part / row.whole) * 100)} %` : "—"}
              </div>
              <div className="mt-0.5 text-xs text-slate-600">{row.label}</div>
              <div className="text-xs tabular-nums text-slate-500">
                {row.part} / {row.whole}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Calculé sur les leads ayant atteint chaque étape, y compris ceux perdus depuis.
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Cette semaine</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Tile label="Messages envoyés" value={stats.week.messages} />
          <Tile label="Appels" value={stats.week.calls} />
          <Tile label="Réponses" value={stats.week.replies} />
          <Tile label="Démos" value={stats.week.demos} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Raisons de perte</h2>
        {stats.lostReasons.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucun lead perdu.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {stats.lostReasons.map((row) => (
              <Bar
                key={row.reason}
                label={LOST_REASON_LABELS[row.reason]}
                count={row.count}
                max={lostMax}
              />
            ))}
          </div>
        )}
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Par région</h2>
        {regionRows.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucun lead.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Région</th>
                  <th className="px-2 py-2 text-right font-medium">Leads</th>
                  <th className="px-2 py-2 text-right font-medium">Contactés</th>
                  <th className="px-2 py-2 text-right font-medium">Réponses</th>
                  <th className="px-2 py-2 text-right font-medium">Démos</th>
                  <th className="py-2 pl-2 text-right font-medium">Clients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {regionRows.map((row) => (
                  <tr key={row.region}>
                    <td className="py-2 pr-3 font-medium text-slate-900">{row.region}</td>
                    <td className="px-2 py-2 text-right">{row.leads}</td>
                    <td className="px-2 py-2 text-right">{row.messaged}</td>
                    <td className="px-2 py-2 text-right">{row.replied}</td>
                    <td className="px-2 py-2 text-right">{row.demos}</td>
                    <td className="py-2 pl-2 text-right">{row.paying}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
