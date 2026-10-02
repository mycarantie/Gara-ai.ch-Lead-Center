"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { whatsappLink } from "@/lib/phone";
import { getSetting } from "@/lib/settings";
import { fillTemplate } from "@/lib/templates";
import type { WhatsAppLead } from "@/lib/types";
import LogModal from "./LogModal";
import Sheet from "./Sheet";
import { useTemplates } from "./TemplatesProvider";

type Step = "closed" | "picker" | "log";

export default function WhatsAppButton({
  lead,
  className,
  children,
}: {
  lead: WhatsAppLead;
  className?: string;
  children: React.ReactNode;
}) {
  const templates = useTemplates();
  const [step, setStep] = useState<Step>("closed");
  const [profile, setProfile] = useState({ prenom: "", signature: "" });
  const close = useCallback(() => setStep("closed"), []);

  function open() {
    setProfile({ prenom: getSetting("prenom"), signature: getSetting("signature") });
    setStep("picker");
  }

  // Deferred so the link is still on the page while the browser follows it
  function sent() {
    setTimeout(() => setStep("log"), 200);
  }

  const optionClass =
    "block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-left active:bg-slate-100";

  return (
    <>
      <button type="button" onClick={open} className={className}>
        {children}
      </button>

      {step === "picker" && (
        <Sheet title="Choisir un message" subtitle={lead.garage_name} onClose={close}>
          <ul className="space-y-2">
            {templates.map((template) => {
              const text = fillTemplate(template.body, lead, profile.prenom, profile.signature);
              return (
                <li key={template.id}>
                  {/* A real link (not window.open) so the phone hands over to WhatsApp reliably */}
                  <a
                    href={whatsappLink(lead.phone, text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={sent}
                    className={optionClass}
                  >
                    <span className="block text-sm font-semibold text-slate-900">
                      {template.name}
                    </span>
                    <span className="mt-1 line-clamp-3 block text-sm text-slate-600">{text}</span>
                  </a>
                </li>
              );
            })}
            <li>
              <a
                href={whatsappLink(lead.phone)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={sent}
                className={optionClass}
              >
                <span className="block text-sm font-semibold text-slate-900">Sans modèle</span>
                <span className="mt-1 block text-sm text-slate-600">
                  Ouvrir la conversation et écrire le message à la main.
                </span>
              </a>
            </li>
          </ul>

          {templates.length === 0 && (
            <p className="mt-3 text-sm text-slate-600">
              Aucun modèle enregistré.{" "}
              <Link href="/reglages" onClick={close} className="font-medium underline">
                Créer des modèles dans Réglages
              </Link>
            </p>
          )}
          {templates.length > 0 && !profile.prenom && (
            <p className="mt-3 text-sm text-slate-600">
              Votre prénom n&apos;est pas renseigné.{" "}
              <Link href="/reglages" onClick={close} className="font-medium underline">
                L&apos;ajouter dans Réglages
              </Link>
            </p>
          )}
        </Sheet>
      )}

      {step === "log" && <LogModal lead={lead} initialType="whatsapp_sent" onClose={close} />}
    </>
  );
}
