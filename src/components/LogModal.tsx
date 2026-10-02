"use client";

import { useState, useTransition } from "react";
import { logActivity } from "@/app/(app)/leads/actions";
import { addDays, todayISO, toDateISO } from "@/lib/dates";
import {
  ACTIVITY_LABELS,
  LOGGABLE_ACTIVITIES,
  LOST_REASON_LABELS,
  LOST_REASONS,
  PLAN_PRICES,
  STATUS_LABELS,
  STATUSES,
} from "@/lib/labels";
import { nextForStatus, suggestNext } from "@/lib/rules";
import type { ActivityType, LeadStatus, LogLead, LostReason } from "@/lib/types";
import Sheet from "./Sheet";

const DATE_CHIPS = [
  { label: "Demain", days: 1 },
  { label: "+3 j", days: 3 },
  { label: "+7 j", days: 7 },
  { label: "+14 j", days: 14 },
];

const fieldClass =
  "block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-900";
const labelClass = "block text-sm font-semibold text-slate-900";

export default function LogModal({
  lead,
  initialType,
  onClose,
}: {
  lead: LogLead;
  initialType?: ActivityType;
  onClose: () => void;
}) {
  const [today] = useState(() => todayISO());
  const [initial] = useState(() =>
    initialType ? suggestNext(lead, initialType, today) : null,
  );

  const [type, setType] = useState<ActivityType | null>(initialType ?? null);
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<LeadStatus>(initial?.status ?? lead.status);
  const [lostReason, setLostReason] = useState<LostReason>(
    initial?.lostReason ?? lead.lost_reason ?? "no_reply",
  );
  const [nextAction, setNextAction] = useState(initial ? initial.nextAction : (lead.next_action ?? ""));
  const [nextDate, setNextDate] = useState(
    initial ? (initial.nextActionDate ?? "") : (toDateISO(lead.next_action_at) ?? ""),
  );
  const [hint, setHint] = useState<string | null>(initial?.hint ?? null);
  const [plan, setPlan] = useState("plus");
  const [price, setPrice] = useState(PLAN_PRICES.plus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pickType(next: ActivityType) {
    const suggestion = suggestNext(lead, next, today);
    setType(next);
    setStatus(suggestion.status);
    if (suggestion.lostReason) setLostReason(suggestion.lostReason);
    setNextAction(suggestion.nextAction);
    setNextDate(suggestion.nextActionDate ?? "");
    setHint(suggestion.hint);
    setError(null);
  }

  function pickStatus(next: LeadStatus) {
    setStatus(next);
    const defaults = nextForStatus(next, today);
    if (defaults) {
      setNextAction(defaults.nextAction);
      setNextDate(defaults.nextActionDate ?? "");
    }
  }

  function save() {
    if (!type) {
      setError("Choisissez un type d'activité.");
      return;
    }
    const formData = new FormData();
    formData.set("type", type);
    formData.set("summary", summary);
    formData.set("status", status);
    formData.set("lost_reason", lostReason);
    formData.set("next_action", nextAction);
    formData.set("next_action_at", nextDate);
    formData.set("plan", plan);
    formData.set("monthly_value_chf", price);

    setError(null);
    startTransition(async () => {
      const result = await logActivity(lead.id, formData);
      if (result?.error) setError(result.error);
      else onClose();
    });
  }

  const becomesPaying = status === "paying" && lead.status !== "paying";

  return (
    <Sheet
      title="Noter ce qui s'est passé"
      subtitle={lead.garage_name}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={save}
          disabled={pending || !type}
          className="w-full rounded-lg bg-slate-900 px-4 py-3 text-base font-semibold text-white active:bg-slate-700 disabled:opacity-40"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      }
    >
        <div className="space-y-5">
          <div>
            <p className={labelClass}>Type</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {LOGGABLE_ACTIVITIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={type === option}
                  onClick={() => pickType(option)}
                  className={`min-h-12 rounded-lg border px-2 py-2.5 text-sm font-medium ${
                    type === option
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-800 active:bg-slate-100"
                  }`}
                >
                  {ACTIVITY_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <label className={labelClass}>
            Ce qui s&apos;est passé
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={3}
              placeholder="Facultatif"
              className={`mt-2 font-normal ${fieldClass}`}
            />
          </label>

          {hint && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {hint}
            </p>
          )}

          <div>
            <label className={labelClass}>
              Nouveau statut
              <select
                value={status}
                onChange={(event) => pickStatus(event.target.value as LeadStatus)}
                className={`mt-2 font-normal ${fieldClass}`}
              >
                {STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {STATUS_LABELS[option]}
                    {option === lead.status ? " (actuel)" : ""}
                  </option>
                ))}
              </select>
            </label>

            {status === "lost" && (
              <label className="mt-2 block text-sm font-medium text-slate-700">
                Raison de la perte
                <select
                  value={lostReason}
                  onChange={(event) => setLostReason(event.target.value as LostReason)}
                  className={`mt-1 font-normal ${fieldClass}`}
                >
                  {LOST_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {LOST_REASON_LABELS[reason]}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {becomesPaying && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block text-sm font-medium text-slate-700">
                  Formule
                  <select
                    value={plan}
                    onChange={(event) => {
                      setPlan(event.target.value);
                      setPrice(PLAN_PRICES[event.target.value] ?? "");
                    }}
                    className={`mt-1 font-normal ${fieldClass}`}
                  >
                    <option value="plus">Plus</option>
                    <option value="pro">Pro</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  CHF / mois
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className={`mt-1 font-normal ${fieldClass}`}
                  />
                </label>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Prochaine action
              <input
                value={nextAction}
                onChange={(event) => setNextAction(event.target.value)}
                placeholder="Aucune"
                autoComplete="off"
                className={`mt-2 font-normal ${fieldClass}`}
              />
            </label>

            <div className="mt-2 flex flex-wrap gap-2">
              {DATE_CHIPS.map((chip) => {
                const date = addDays(today, chip.days);
                return (
                  <button
                    key={chip.days}
                    type="button"
                    aria-pressed={nextDate === date}
                    onClick={() => setNextDate(date)}
                    className={`rounded-full border px-3 py-2 text-sm font-medium ${
                      nextDate === date
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-800 active:bg-slate-100"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={nextDate === ""}
                onClick={() => setNextDate("")}
                className={`rounded-full border px-3 py-2 text-sm font-medium ${
                  nextDate === ""
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-800 active:bg-slate-100"
                }`}
              >
                Aucune
              </button>
            </div>

            <input
              type="date"
              value={nextDate}
              onChange={(event) => setNextDate(event.target.value)}
              aria-label="Date de la prochaine action"
              className={`mt-2 ${fieldClass}`}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
        </div>
    </Sheet>
  );
}
