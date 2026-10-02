"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { CANTONS, STATUS_LABELS, STATUSES } from "@/lib/labels";
import type { LeadFilterValues } from "@/lib/leadQuery";

const selectClass =
  "block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-2.5 text-base text-slate-900";

export default function LeadFilters({
  values,
  regions,
}: {
  values: LeadFilterValues;
  regions: string[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function apply() {
    if (!formRef.current) return;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(formRef.current)) {
      if (typeof value === "string" && value.trim() && !(key === "sort" && value === "next")) {
        params.set(key, value.trim());
      }
    }
    const query = params.toString();
    router.replace(query ? `/leads?${query}` : "/leads", { scroll: false });
  }

  function applyLater() {
    clearTimeout(timer.current);
    timer.current = setTimeout(apply, 350);
  }

  return (
    <form
      ref={formRef}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current);
        apply();
      }}
      className="space-y-2"
    >
      <input
        type="search"
        name="q"
        defaultValue={values.q}
        onChange={applyLater}
        placeholder="Rechercher : garage, contact, ville, téléphone"
        aria-label="Rechercher"
        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-900"
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <select name="region" defaultValue={values.region} onChange={apply} aria-label="Région" className={selectClass}>
          <option value="">Toutes les régions</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>

        <select name="canton" defaultValue={values.canton} onChange={apply} aria-label="Canton" className={selectClass}>
          <option value="">Tous les cantons</option>
          {CANTONS.map((canton) => (
            <option key={canton} value={canton}>
              {canton}
            </option>
          ))}
        </select>

        <select name="status" defaultValue={values.status} onChange={apply} aria-label="Statut" className={selectClass}>
          <option value="">Tous les statuts</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <select name="sort" defaultValue={values.sort} onChange={apply} aria-label="Tri" className={selectClass}>
          <option value="next">Tri : prochaine action</option>
          <option value="name">Tri : nom du garage</option>
          <option value="cars">Tri : voitures en ligne</option>
          <option value="last">Tri : dernier contact</option>
        </select>
      </div>

      <label className="flex items-center gap-2 py-1 text-sm text-slate-700">
        <input
          type="checkbox"
          name="qualified"
          value="1"
          defaultChecked={values.qualified}
          onChange={apply}
          className="h-5 w-5 rounded border-slate-300"
        />
        Qualifiés uniquement (20–150 voitures, hors concessions)
      </label>
    </form>
  );
}
