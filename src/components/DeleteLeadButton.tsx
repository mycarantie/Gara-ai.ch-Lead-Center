"use client";

import { useState, useTransition } from "react";
import { deleteLead } from "@/app/(app)/leads/actions";

export default function DeleteLeadButton({ leadId, name }: { leadId: string; name: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(`Supprimer « ${name} » et tout son journal ? Cette action est définitive.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteLead(leadId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="w-full rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 active:bg-red-50 disabled:opacity-60 md:w-auto"
      >
        {pending ? "Suppression…" : "Supprimer ce lead"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
