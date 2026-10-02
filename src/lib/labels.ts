import type { ActivityType, LeadStatus, LostReason } from "./types";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  to_contact: "À contacter",
  messaged: "Contacté",
  replied: "A répondu",
  demo_booked: "Démo prévue",
  demo_done: "Démo faite",
  trial: "En essai",
  paying: "Client",
  lost: "Perdu",
  not_qualified: "Non qualifié",
};

// Pipeline order, also used for dropdowns
export const STATUSES = Object.keys(STATUS_LABELS) as LeadStatus[];

export const STATUS_BADGE_CLASSES: Record<LeadStatus, string> = {
  to_contact: "bg-slate-100 text-slate-700",
  messaged: "bg-sky-100 text-sky-800",
  replied: "bg-violet-100 text-violet-800",
  demo_booked: "bg-amber-100 text-amber-800",
  demo_done: "bg-orange-100 text-orange-800",
  trial: "bg-teal-100 text-teal-800",
  paying: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-800",
  not_qualified: "bg-slate-200 text-slate-600",
};

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  no_reply: "Pas de réponse",
  not_interested: "Pas intéressé",
  has_system: "A déjà un système",
  too_small: "Trop petit",
  franchise: "Concession de marque",
  too_expensive: "Trop cher",
  other: "Autre",
};

export const LOST_REASONS = Object.keys(LOST_REASON_LABELS) as LostReason[];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  whatsapp_sent: "WhatsApp envoyé",
  whatsapp_received: "WhatsApp reçu",
  call_answered: "Appel (répondu)",
  call_no_answer: "Appel (pas de réponse)",
  email_sent: "Email envoyé",
  email_received: "Email reçu",
  demo: "Démo",
  note: "Note",
  status_change: "Changement de statut",
};

// Order of the tap buttons in the Log modal; status_change is logged automatically
export const LOGGABLE_ACTIVITIES: ActivityType[] = [
  "whatsapp_sent",
  "whatsapp_received",
  "call_answered",
  "call_no_answer",
  "demo",
  "note",
  "email_sent",
  "email_received",
];

// Monthly CHF value prefilled when a lead becomes a paying customer
export const PLAN_PRICES: Record<string, string> = { plus: "50", pro: "150" };

export const CANTONS = [
  "VD", "VS", "GE", "FR", "NE", "JU", "BE",
  "AG", "AI", "AR", "BL", "BS", "GL", "GR", "LU", "NW", "OW",
  "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "ZG", "ZH",
];
