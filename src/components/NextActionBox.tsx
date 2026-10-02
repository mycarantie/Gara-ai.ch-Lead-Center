"use client";

import { useState, useTransition } from "react";
import { setNextAction } from "@/app/(app)/leads/actions";

const inputClass =
  "block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-900";

export default function NextActionBox({
  leadId,
  action,
  date,
  overdue,
}: {
  leadId: string;
  action: string;
  date: string;
  overdue: boolean;
}) {
  const [text, setText] = useState(action);
  const [day, setDay] = useState(date);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = text !== action || day !== date;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await setNextAction(leadId, formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-xl border bg-white p-4 ${overdue ? "border-red-300" : "border-slate-200"}`}
    >
      <h2 className="text-sm font-semibold text-slate-900">
        Prochaine action
        {overdue && <span className="ml-2 font-medium text-red-700">En retard</span>}
      </h2>
      <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <input
          name="next_action"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Aucune action prévue"
          aria-label="Prochaine action"
          autoComplete="off"
          className={inputClass}
        />
        <input
          name="next_action_at"
          type="date"
          value={day}
          onChange={(event) => setDay(event.target.value)}
          aria-label="Date de la prochaine action"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={!dirty || pending}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white active:bg-slate-700 disabled:opacity-40"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
