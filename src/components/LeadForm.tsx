"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { FormResult } from "@/app/(app)/leads/actions";
import { toDateISO } from "@/lib/dates";
import {
  CANTONS,
  LOST_REASON_LABELS,
  LOST_REASONS,
  STATUS_LABELS,
  STATUSES,
} from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import type { Lead, LeadStatus } from "@/lib/types";

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-900";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-slate-900">{title}</legend>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default function LeadForm({
  lead,
  regions,
  action,
  cancelHref,
}: {
  lead?: Lead;
  regions: string[];
  action: (formData: FormData) => Promise<FormResult>;
  cancelHref: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? "to_contact");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Section title="Garage">
        <Field label="Nom du garage *" className="md:col-span-2">
          <input name="garage_name" required defaultValue={lead?.garage_name ?? ""} className={inputClass} />
        </Field>
        <Field label="Contact">
          <input name="contact_name" defaultValue={lead?.contact_name ?? ""} autoComplete="off" className={inputClass} />
        </Field>
        <Field label="Téléphone">
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={formatPhone(lead?.phone)}
            placeholder="079 123 45 67"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={lead?.email ?? ""} autoComplete="off" className={inputClass} />
        </Field>
        <Field label="Site web">
          <input name="website" inputMode="url" defaultValue={lead?.website ?? ""} autoComplete="off" className={inputClass} />
        </Field>
        <Field label="Lien AutoScout24" className="md:col-span-2">
          <input name="autoscout_url" inputMode="url" defaultValue={lead?.autoscout_url ?? ""} autoComplete="off" className={inputClass} />
        </Field>
      </Section>

      <Section title="Lieu">
        <Field label="Adresse" className="md:col-span-2">
          <input name="address" defaultValue={lead?.address ?? ""} autoComplete="off" className={inputClass} />
        </Field>
        <Field label="Ville">
          <input name="city" defaultValue={lead?.city ?? ""} autoComplete="off" className={inputClass} />
        </Field>
        <Field label="Canton">
          <select name="canton" defaultValue={lead?.canton ?? ""} className={inputClass}>
            <option value="">—</option>
            {CANTONS.map((canton) => (
              <option key={canton} value={canton}>
                {canton}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Région (campagne)" className="md:col-span-2">
          <input
            name="region"
            list="region-options"
            defaultValue={lead?.region ?? ""}
            placeholder="Riviera – Vevey"
            autoComplete="off"
            className={inputClass}
          />
          <datalist id="region-options">
            {regions.map((region) => (
              <option key={region} value={region} />
            ))}
          </datalist>
        </Field>
      </Section>

      <Section title="Qualification">
        <Field label="Voitures en ligne">
          <input name="cars_online" type="number" min={0} inputMode="numeric" defaultValue={lead?.cars_online ?? ""} className={inputClass} />
        </Field>
        <Field label="Système actuel">
          <input name="current_system" defaultValue={lead?.current_system ?? ""} placeholder="Papier, Excel, autre logiciel…" autoComplete="off" className={inputClass} />
        </Field>
        <label className="flex items-center gap-2 py-1 text-sm text-slate-700">
          <input type="checkbox" name="is_franchise" defaultChecked={lead?.is_franchise ?? false} className="h-5 w-5 rounded border-slate-300" />
          Concession de marque
        </label>
        <label className="flex items-center gap-2 py-1 text-sm text-slate-700">
          <input type="checkbox" name="do_not_contact" defaultChecked={lead?.do_not_contact ?? false} className="h-5 w-5 rounded border-slate-300" />
          Ne pas contacter (astérisque dans l&apos;annuaire)
        </label>
      </Section>

      <Section title="Suivi">
        <Field label="Statut">
          <select
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as LeadStatus)}
            className={inputClass}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>
        {status === "lost" && (
          <Field label="Raison de la perte">
            <select name="lost_reason" defaultValue={lead?.lost_reason ?? "no_reply"} className={inputClass}>
              {LOST_REASONS.map((value) => (
                <option key={value} value={value}>
                  {LOST_REASON_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Prochaine action">
          <input name="next_action" defaultValue={lead?.next_action ?? ""} autoComplete="off" className={inputClass} />
        </Field>
        <Field label="Date de la prochaine action">
          <input name="next_action_at" type="date" defaultValue={toDateISO(lead?.next_action_at ?? null) ?? ""} className={inputClass} />
        </Field>
      </Section>

      <Section title="Client">
        <Field label="Début de l'essai">
          <input name="trial_started_at" type="date" defaultValue={lead?.trial_started_at ?? ""} className={inputClass} />
        </Field>
        <Field label="Formule">
          <select name="plan" defaultValue={lead?.plan ?? ""} className={inputClass}>
            <option value="">—</option>
            <option value="plus">Plus</option>
            <option value="pro">Pro</option>
          </select>
        </Field>
        <Field label="Valeur mensuelle (CHF)">
          <input name="monthly_value_chf" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={lead?.monthly_value_chf ?? ""} className={inputClass} />
        </Field>
      </Section>

      <Section title="Notes">
        <Field label="Notes" className="md:col-span-2">
          <textarea name="notes" rows={4} defaultValue={lead?.notes ?? ""} className={inputClass} />
        </Field>
      </Section>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Link
          href={cancelHref}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-base font-medium text-slate-800 md:flex-none"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-slate-900 px-4 py-3 text-base font-semibold text-white active:bg-slate-700 disabled:opacity-60 md:flex-none md:px-8"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
