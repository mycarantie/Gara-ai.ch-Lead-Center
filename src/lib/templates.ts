import type { Lead } from "./types";

type TemplateLead = Pick<Lead, "contact_name" | "garage_name" | "city" | "cars_online">;

export const PLACEHOLDERS = [
  "{contact}",
  "{garage}",
  "{ville}",
  "{voitures}",
  "{prenom}",
  "{signature}",
];

export function fillTemplate(
  body: string,
  lead: TemplateLead,
  prenom: string,
  signature = "",
): string {
  let text = body;

  if (lead.cars_online === null) {
    text = text.replaceAll("{voitures} véhicules", "une quarantaine de véhicules");
  }
  if (!lead.city?.trim()) {
    text = text.replace(/\s*à \{ville\}/g, "");
  }

  const values: Record<string, string> = {
    contact: lead.contact_name?.trim() ?? "",
    garage: lead.garage_name.trim(),
    ville: lead.city?.trim() ?? "",
    voitures: lead.cars_online === null ? "" : String(lead.cars_online),
    prenom: prenom.trim(),
    // TODO: the plan stores a signature but names no placeholder for it; {signature} is the simplest use
    signature: signature.trim(),
  };

  for (const [key, value] of Object.entries(values)) {
    // An empty value also swallows the space before it: "Bonjour {contact}," -> "Bonjour,"
    text = value
      ? text.replaceAll(`{${key}}`, value)
      : text.replace(new RegExp(`\\s*\\{${key}\\}`, "g"), "");
  }

  return text.trim();
}

export const DEFAULT_TEMPLATES: { name: string; body: string }[] = [
  {
    name: "Premier message",
    body: "Bonjour {contact}, je suis {prenom} de GARA AI. Nous avons développé pour les garages un outil qui fait les contrats de vente, factures QR et formulaires d'immatriculation en 2 minutes, avec signature à distance du client. J'ai vu que vous avez {voitures} véhicules en ligne à {ville}, je pense que ça pourrait vous faire gagner du temps. Je peux vous envoyer une vidéo d'une minute ?",
  },
  {
    name: "Envoi de la vidéo",
    body: "Merci ! Voici la vidéo : [lien]. Vous pouvez aussi essayer gratuitement, 25 contrats inclus, sans carte bancaire : https://app.gara-ai.ch/signup — si vous voulez, je vous le montre en 15 minutes par appel vidéo.",
  },
  {
    name: "Relance",
    body: "Bonjour {contact}, je me permets de revenir vers vous concernant GARA AI pour {garage}. Est-ce que ça vous intéresserait de voir comment ça marche en 15 minutes ?",
  },
  {
    name: "Confirmation de démo",
    body: "Parfait, c'est noté pour notre appel. Je vous envoie le lien juste avant. À bientôt ! {prenom}",
  },
  {
    name: "Point essai",
    body: "Bonjour {contact}, comment se passe l'essai de GARA AI ? Si vous avez la moindre question ou besoin d'aide pour le premier contrat, je suis disponible.",
  },
];
