"use client";

import { useRef, useState, useTransition } from "react";
import { setPassword } from "@/app/(app)/reglages/actions";

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-900";

export default function PasswordSettings({ email }: { email: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setPassword(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      {/* Hidden username field so the phone's password manager saves the pair correctly */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <label className="block text-sm font-medium text-slate-700">
        Nouveau mot de passe
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Confirmer le mot de passe
        <input
          name="confirmation"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      <p className="text-sm text-slate-500 md:col-span-2">
        Au moins 8 caractères. Il servira à vous connecter avec votre e-mail, sans lien à recevoir.
      </p>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 md:col-span-2">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 md:col-span-2">
          Mot de passe enregistré.
        </p>
      )}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white active:bg-slate-700 disabled:opacity-60 md:w-auto"
        >
          {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
        </button>
      </div>
    </form>
  );
}
