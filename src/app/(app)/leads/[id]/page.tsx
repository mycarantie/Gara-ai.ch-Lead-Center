import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteLeadButton from "@/components/DeleteLeadButton";
import { carsLabel } from "@/components/LeadCard";
import LogButton from "@/components/LogButton";
import NextActionBox from "@/components/NextActionBox";
import StatusBadge from "@/components/StatusBadge";
import StatusSelect from "@/components/StatusSelect";
import Timeline from "@/components/Timeline";
import WhatsAppButton from "@/components/WhatsAppButton";
import { formatDate, formatDateTime, toDateISO, todayISO } from "@/lib/dates";
import { LOST_REASON_LABELS } from "@/lib/labels";
import { toLogLead, toWhatsAppLead } from "@/lib/leads";
import { formatPhone, gmailComposeLink, telLink } from "@/lib/phone";
import { isQualified } from "@/lib/rules";
import { createClient } from "@/lib/supabase/server";
import type { Activity, Lead } from "@/lib/types";

const quickButtonClass =
  "flex-1 rounded-lg border border-slate-300 bg-white px-2 py-3 text-center text-sm font-semibold active:bg-slate-100";

function isHttpUrl(url: string | null): url is string {
  return url !== null && /^https?:\/\//i.test(url);
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  const empty = children === null || children === undefined || children === "" || children === false;
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-right text-slate-900">{empty ? "—" : children}</dd>
    </div>
  );
}

export default async function LeadPage(props: PageProps<"/leads/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data }, { data: activityRows }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("activities")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!data) notFound();

  const lead = data as Lead;
  const activities = (activityRows ?? []) as Activity[];
  const nextDate = toDateISO(lead.next_action_at);
  const overdue = nextDate !== null && nextDate < todayISO();
  const subtitle = [lead.city, lead.canton, carsLabel(lead.cars_online)].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      <div>
        <Link href="/leads" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Leads
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="min-w-0 break-words text-2xl font-bold">{lead.garage_name}</h1>
          <StatusBadge status={lead.status} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {subtitle}
          {isQualified(lead) && (
            <span className="ml-2 whitespace-nowrap font-medium text-emerald-700">✓ qualifié</span>
          )}
        </p>
        {lead.do_not_contact && (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            Ne pas contacter
          </p>
        )}
      </div>

      {(lead.phone || lead.email || isHttpUrl(lead.autoscout_url)) && (
        <div className="flex gap-2">
          {lead.phone && (
            <WhatsAppButton
              lead={toWhatsAppLead({ ...lead, phone: lead.phone })}
              className={`${quickButtonClass} text-emerald-700`}
            >
              WhatsApp
            </WhatsAppButton>
          )}
          {lead.phone && (
            <a href={telLink(lead.phone)} className={`${quickButtonClass} text-slate-800`}>
              Appeler
            </a>
          )}
          {lead.email && (
            <a
              href={gmailComposeLink(lead.email)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${quickButtonClass} text-slate-800`}
            >
              Email
            </a>
          )}
          {isHttpUrl(lead.autoscout_url) && (
            <a
              href={lead.autoscout_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${quickButtonClass} text-slate-800`}
            >
              AutoScout
            </a>
          )}
        </div>
      )}

      <NextActionBox
        key={`${lead.next_action}|${nextDate}`}
        leadId={lead.id}
        action={lead.next_action ?? ""}
        date={nextDate ?? ""}
        overdue={overdue}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Statut</h2>
        <StatusSelect key={lead.status} leadId={lead.id} status={lead.status} />
      </section>

      <LogButton
        lead={toLogLead(lead)}
        className="w-full rounded-xl bg-slate-900 px-4 py-4 text-base font-semibold text-white active:bg-slate-700"
      >
        Noter ce qui s&apos;est passé
      </LogButton>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Journal</h2>
        <Timeline activities={activities} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Infos</h2>
          <Link
            href={`/leads/${lead.id}/edit`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 active:bg-slate-100"
          >
            Modifier
          </Link>
        </div>
        <dl className="mt-2 divide-y divide-slate-100">
          <Info label="Contact">{lead.contact_name}</Info>
          <Info label="Téléphone">{formatPhone(lead.phone)}</Info>
          <Info label="Email">{lead.email}</Info>
          <Info label="Site web">
            {isHttpUrl(lead.website) && (
              <a href={lead.website} target="_blank" rel="noopener noreferrer" className="underline">
                {lead.website.replace(/^https?:\/\//i, "")}
              </a>
            )}
          </Info>
          <Info label="Adresse">{lead.address}</Info>
          <Info label="Ville">{lead.city}</Info>
          <Info label="Canton">{lead.canton}</Info>
          <Info label="Région">{lead.region}</Info>
          <Info label="Voitures en ligne">{lead.cars_online}</Info>
          <Info label="Concession de marque">{lead.is_franchise ? "Oui" : "Non"}</Info>
          <Info label="Système actuel">{lead.current_system}</Info>
          <Info label="Ne pas contacter">{lead.do_not_contact ? "Oui" : "Non"}</Info>
          {lead.status === "lost" && (
            <Info label="Raison de la perte">
              {lead.lost_reason && LOST_REASON_LABELS[lead.lost_reason]}
            </Info>
          )}
          <Info label="Relances sans réponse">{lead.followup_count}</Info>
          <Info label="Dernier contact">
            {lead.last_contact_at && formatDateTime(lead.last_contact_at)}
          </Info>
          <Info label="Début de l'essai">{formatDate(lead.trial_started_at)}</Info>
          <Info label="Formule">{lead.plan === "plus" ? "Plus" : lead.plan === "pro" ? "Pro" : ""}</Info>
          <Info label="Valeur mensuelle">
            {lead.monthly_value_chf !== null && `CHF ${lead.monthly_value_chf}`}
          </Info>
          <Info label="Créé le">{formatDateTime(lead.created_at)}</Info>
        </dl>
        {lead.notes && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <h3 className="text-sm text-slate-500">Notes</h3>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{lead.notes}</p>
          </div>
        )}
      </section>

      <div className="pt-4">
        <DeleteLeadButton leadId={lead.id} name={lead.garage_name} />
      </div>
    </div>
  );
}
