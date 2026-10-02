"use client";

import { useState, useTransition } from "react";
import { changeStatus } from "@/app/(app)/leads/actions";
import {
  LOST_REASON_LABELS,
  LOST_REASONS,
  PLAN_PRICES,
  STATUS_LABELS,
  STATUSES,
} from "@/lib/labels";
import type { LeadStatus } from "@/lib/types";

const fieldClass =
  "block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900";

// Give this component key={status} so it resets when the lead changes on the server.
export default function StatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [value, setValue] = useState<LeadStatus>(status);
  const [plan, setPlan] = useState("plus");
  const [price, setPrice] = useState(PLAN_PRICES.plus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const needsDetails = value !== status && (value === "lost" || value === "paying");

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await changeStatus(leadId, formData);
      if (result?.error) {
        setError(result.error);
        setValue(status);
      }
    });
  }

  function onSelect(next: LeadStatus) {
    setValue(next);
    setError(null);
    if (next === status || next === "lost" || next === "paying") return;
    const formData = new FormData();
    formData.set("status", next);
    submit(formData);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(new FormData(event.currentTarget));
      }}
      className="space-y-2"
    >
      <select
        name="status"
        value={value}
        disabled={pending}
        onChange={(event) => onSelect(event.target.value as LeadStatus)}
        aria-label="Statut"
        className={fieldClass}
      >
        {STATUSES.map((option) => (
          <option key={option} value={option}>
            {STATUS_LABELS[option]}
          </option>
        ))}
      </select>

      {needsDetails && value === "lost" && (
        <label className="block text-sm font-medium text-slate-700">
          Raison de la perte
          <select name="lost_reason" defaultValue="no_reply" className={`mt-1 ${fieldClass}`}>
            {LOST_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {LOST_REASON_LABELS[reason]}
              </option>
            ))}
          </select>
        </label>
      )}

      {needsDetails && value === "paying" && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-medium text-slate-700">
            Formule
            <select
              name="plan"
              value={plan}
              onChange={(event) => {
                setPlan(event.target.value);
                setPrice(PLAN_PRICES[event.target.value] ?? "");
              }}
              className={`mt-1 ${fieldClass}`}
            >
              <option value="plus">Plus</option>
              <option value="pro">Pro</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            CHF / mois
            <input
              name="monthly_value_chf"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={`mt-1 ${fieldClass}`}
            />
          </label>
        </div>
      )}

      {needsDetails && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setValue(status)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white active:bg-slate-700 disabled:opacity-60"
          >
            Confirmer
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
