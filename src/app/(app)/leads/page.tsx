import Link from "next/link";
import LeadCard, { carsLabel } from "@/components/LeadCard";
import LeadFilters from "@/components/LeadFilters";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, toDateISO, todayISO } from "@/lib/dates";
import { buildLeadQuery, leadFiltersToQueryString, parseLeadFilters } from "@/lib/leadQuery";
import { getRegions } from "@/lib/leads";
import { formatPhone } from "@/lib/phone";
import { isQualified } from "@/lib/rules";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";

// TODO: add pagination if the list grows beyond this
const MAX_ROWS = 300;

const secondaryButton =
  "flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-800 active:bg-slate-100 md:flex-none";

export default async function LeadsPage(props: PageProps<"/leads">) {
  const values = parseLeadFilters(await props.searchParams);
  const exportQuery = leadFiltersToQueryString(values);

  const supabase = await createClient();
  const [{ data, count, error }, regions] = await Promise.all([
    buildLeadQuery(supabase, values).limit(MAX_ROWS),
    getRegions(supabase),
  ]);
  const leads = (data ?? []) as Lead[];
  const total = count ?? leads.length;
  const today = todayISO();

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Link
          href="/leads/new"
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white active:bg-slate-700"
        >
          + Ajouter
        </Link>
      </div>

      <div className="mt-3 flex gap-2">
        <Link href="/import" className={secondaryButton}>
          Importer CSV
        </Link>
        {/* A plain link: the export route answers with a file download */}
        <a href={`/leads/export${exportQuery ? `?${exportQuery}` : ""}`} className={secondaryButton}>
          Exporter CSV
        </a>
      </div>

      <div className="mt-4">
        <LeadFilters values={values} regions={regions} />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Impossible de charger les leads.
        </p>
      )}

      <p className="mt-3 text-sm text-slate-500">
        {total} {total > 1 ? "leads" : "lead"}
        {total > leads.length && ` — ${leads.length} affichés, affinez la recherche`}
      </p>

      {leads.length === 0 && !error && (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          Aucun lead. Ajoutez un garage ou modifiez les filtres.
        </p>
      )}

      <ul className="mt-3 space-y-2 md:hidden">
        {leads.map((lead) => (
          <li key={lead.id}>
            <LeadCard lead={lead} today={today} />
          </li>
        ))}
      </ul>

      {leads.length > 0 && (
        <div className="mt-3 hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Garage</th>
                <th className="px-3 py-2 font-medium">Ville</th>
                <th className="px-3 py-2 font-medium">Région</th>
                <th className="px-3 py-2 font-medium">Téléphone</th>
                <th className="px-3 py-2 text-right font-medium">Voitures</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium">Prochaine action</th>
                <th className="px-3 py-2 font-medium">Dernier contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => {
                const nextDate = toDateISO(lead.next_action_at);
                const overdue = nextDate !== null && nextDate < today;
                return (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link href={`/leads/${lead.id}`} className="font-semibold text-slate-900 hover:underline">
                        {lead.garage_name}
                      </Link>
                      {lead.contact_name && (
                        <div className="text-xs text-slate-500">{lead.contact_name}</div>
                      )}
                    </td>
                    <td className="px-3 py-2">{lead.city}</td>
                    <td className="px-3 py-2">{lead.region}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatPhone(lead.phone)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {lead.cars_online}
                      {isQualified(lead) && <span className="ml-1 text-emerald-700" title="Qualifié">✓</span>}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className={`px-3 py-2 ${overdue ? "font-medium text-red-700" : ""}`}>
                      {[lead.next_action, formatDate(nextDate)].filter(Boolean).join(" · ")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {formatDate(toDateISO(lead.last_contact_at))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
