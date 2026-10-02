"use client";

import { useEffect, useState } from "react";
import { getSetting, setSetting } from "@/lib/settings";

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-slate-900";

export default function ProfileSettings() {
  const [prenom, setPrenom] = useState("");
  const [signature, setSignature] = useState("");

  // localStorage only exists in the browser, so the saved values load after the first render
  useEffect(() => {
    setPrenom(getSetting("prenom"));
    setSignature(getSetting("signature"));
  }, []);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="block text-sm font-medium text-slate-700">
        Mon prénom
        <input
          value={prenom}
          onChange={(event) => {
            setPrenom(event.target.value);
            setSetting("prenom", event.target.value);
          }}
          autoComplete="given-name"
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Signature
        <input
          value={signature}
          onChange={(event) => {
            setSignature(event.target.value);
            setSetting("signature", event.target.value);
          }}
          placeholder="Prénom Nom, Drivo SA"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <p className="text-sm text-slate-500 md:col-span-2">
        Enregistré automatiquement sur cet appareil. Utilisés dans les modèles via {"{prenom}"} et{" "}
        {"{signature}"}.
      </p>
    </div>
  );
}
