import Link from "next/link";
import { formatDate, toDateISO } from "@/lib/dates";
import { toLogLead, toWhatsAppLead } from "@/lib/leads";
import { formatPhone, telLink } from "@/lib/phone";
import { isQualified } from "@/lib/rules";
import type { Lead } from "@/lib/types";
import LogButton from "./LogButton";
import StatusBadge from "./StatusBadge";
import WhatsAppButton from "./WhatsAppButton";

export function carsLabel(count: number | null): string {
  if (count === null) return "";
  return `${count} ${count > 1 ? "voitures" : "voiture"}`;
}

export default function LeadCard({ lead, today }: { lead: Lead; today: string }) {
  const nextDate = toDateISO(lead.next_action_at);
  const overdue = nextDate !== null && nextDate < today;
  const details = [lead.city, carsLabel(lead.cars_online)].filter(Boolean).join(" · ");
  const phone = lead.do_not_contact ? null : lead.phone;
  const lastContact = toDateISO(lead.last_contact_at);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Link href={`/leads/${lead.id}`} className="block p-3 active:bg-slate-50">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 break-words font-semibold text-slate-900">
            {lead.garage_name}
          </h3>
          <StatusBadge status={lead.status} />
        </div>

        <p className="mt-0.5 text-sm text-slate-600">
          {details}
          {isQualified(lead) && (
            <span className="ml-2 whitespace-nowrap font-medium text-emerald-700">
              ✓ qualifié
            </span>
          )}
          {lead.do_not_contact && (
            <span className="ml-2 whitespace-nowrap font-medium text-red-700">
              Ne pas contacter
            </span>
          )}
        </p>

        {lead.phone && <p className="mt-1 text-sm text-slate-600">{formatPhone(lead.phone)}</p>}
        {lead.email && <p className="break-all text-sm text-slate-600">{lead.email}</p>}

        <p className="mt-1 text-xs text-slate-500">
          {lastContact ? `Dernier contact : ${formatDate(lastContact)}` : "Jamais contacté"}
        </p>

        {(lead.next_action || nextDate) && (
          <p className={`mt-1.5 text-sm ${overdue ? "font-medium text-red-700" : "text-slate-800"}`}>
            {[lead.next_action, formatDate(nextDate)].filter(Boolean).join(" · ")}
          </p>
        )}
      </Link>

      <div className="flex divide-x divide-slate-200 border-t border-slate-200 text-sm font-medium">
        {phone && (
          <WhatsAppButton
            lead={toWhatsAppLead({ ...lead, phone })}
            className="flex-1 py-2.5 text-center text-emerald-700 active:bg-slate-50"
          >
            WhatsApp
          </WhatsAppButton>
        )}
        {phone && (
          <a
            href={telLink(phone)}
            className="flex-1 py-2.5 text-center text-slate-800 active:bg-slate-50"
          >
            Appeler
          </a>
        )}
        <LogButton
          lead={toLogLead(lead)}
          className="flex-1 py-2.5 text-center text-slate-800 active:bg-slate-50"
        >
          Noter
        </LogButton>
      </div>
    </article>
  );
}
