"use client";

import { useState, useTransition } from "react";
import {
  createTemplate,
  deleteTemplate,
  loadDefaultTemplates,
  moveTemplate,
  type TemplateResult,
  updateTemplate,
} from "@/app/(app)/reglages/actions";
import { PLACEHOLDERS } from "@/lib/templates";
import { useTemplates } from "./TemplatesProvider";

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-900";
const smallButton =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 active:bg-slate-100 disabled:opacity-40";

function TemplateForm({
  initial,
  pending,
  onSubmit,
  onCancel,
}: {
  initial: { name: string; body: string };
  pending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
      className="space-y-3"
    >
      <label className="block text-sm font-medium text-slate-700">
        Nom du modèle
        <input name="name" required defaultValue={initial.name} autoComplete="off" className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Message
        <textarea name="body" required rows={7} defaultValue={initial.body} className={inputClass} />
      </label>
      <p className="text-xs text-slate-500">Champs disponibles : {PLACEHOLDERS.join(" ")}</p>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className={`flex-1 ${smallButton}`}>
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white active:bg-slate-700 disabled:opacity-60"
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}

export default function TemplateManager() {
  const templates = useTemplates();
  // "new" = the creation form is open; otherwise the id of the template being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<TemplateResult>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
      else onSuccess?.();
    });
  }

  return (
    <div className="space-y-3">
      {templates.length === 0 && editing !== "new" && (
        <p className="text-sm text-slate-500">
          Aucun modèle. Chargez les modèles par défaut ou créez le vôtre.
        </p>
      )}

      <ul className="space-y-2">
        {templates.map((template, index) => (
          <li key={template.id} className="rounded-lg border border-slate-200 p-3">
            {editing === template.id ? (
              <TemplateForm
                initial={template}
                pending={pending}
                onSubmit={(formData) =>
                  run(() => updateTemplate(template.id, formData), () => setEditing(null))
                }
                onCancel={() => setEditing(null)}
              />
            ) : (
              <>
                <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">
                  {template.body}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-label={`Monter ${template.name}`}
                    disabled={pending || index === 0}
                    onClick={() => run(() => moveTemplate(template.id, "up"))}
                    className={smallButton}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Descendre ${template.name}`}
                    disabled={pending || index === templates.length - 1}
                    onClick={() => run(() => moveTemplate(template.id, "down"))}
                    className={smallButton}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setEditing(template.id);
                    }}
                    className={smallButton}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`Supprimer le modèle « ${template.name} » ?`)) {
                        run(() => deleteTemplate(template.id));
                      }
                    }}
                    className={`${smallButton} text-red-700`}
                  >
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {editing === "new" && (
        <div className="rounded-lg border border-slate-200 p-3">
          <TemplateForm
            initial={{ name: "", body: "" }}
            pending={pending}
            onSubmit={(formData) => run(() => createTemplate(formData), () => setEditing(null))}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {editing === null && (
        <div className="flex flex-col gap-2 md:flex-row">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setEditing("new");
            }}
            className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white active:bg-slate-700"
          >
            + Nouveau modèle
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(loadDefaultTemplates)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 active:bg-slate-100 disabled:opacity-60"
          >
            Charger les modèles par défaut
          </button>
        </div>
      )}
    </div>
  );
}
