import { addDays, toDateISO } from "./dates";
import type { ActivityType, Lead, LeadStatus, LostReason } from "./types";

export interface Suggestion {
  status: LeadStatus;
  lostReason: LostReason | null;
  followupCount: number;
  nextAction: string; // "" = none
  nextActionDate: string | null; // "YYYY-MM-DD", null = none / to be chosen
  hint: string | null;
}

type RuleLead = Pick<
  Lead,
  "status" | "lost_reason" | "followup_count" | "next_action" | "next_action_at"
>;

const BEFORE_DEMO: LeadStatus[] = ["to_contact", "messaged", "replied"];
const MAX_FOLLOWUPS = 2;

// Pre-fills the Log modal; the user can override everything.
export function suggestNext(
  lead: RuleLead,
  activity: ActivityType,
  today: string,
): Suggestion {
  const keep: Suggestion = {
    status: lead.status,
    lostReason: lead.lost_reason,
    followupCount: lead.followup_count,
    nextAction: lead.next_action ?? "",
    nextActionDate: toDateISO(lead.next_action_at),
    hint: null,
  };

  const noReply = activity === "whatsapp_sent" || activity === "call_no_answer";
  if (lead.status === "messaged" && lead.followup_count >= MAX_FOLLOWUPS && noReply) {
    return {
      ...keep,
      status: "lost",
      lostReason: "no_reply",
      nextAction: "",
      nextActionDate: null,
      hint: "2 relances sans réponse — marquer comme perdu ?",
    };
  }

  if (activity === "whatsapp_sent") {
    if (lead.status === "to_contact") {
      return {
        ...keep,
        status: "messaged",
        nextAction: "Relance",
        nextActionDate: addDays(today, 3),
      };
    }
    if (lead.status === "messaged") {
      return {
        ...keep,
        followupCount: lead.followup_count + 1,
        nextAction: "Relance",
        nextActionDate: addDays(today, 4),
      };
    }
  }

  // TODO: the plan only lists this rule for "messaged"; "to_contact" gets the same callback reminder
  if (
    activity === "call_no_answer" &&
    (lead.status === "messaged" || lead.status === "to_contact")
  ) {
    return { ...keep, nextAction: "Rappeler", nextActionDate: addDays(today, 2) };
  }

  if (
    (activity === "whatsapp_received" || activity === "call_answered") &&
    BEFORE_DEMO.includes(lead.status)
  ) {
    return {
      ...keep,
      status: "replied",
      nextAction: "Proposer une démo",
      nextActionDate: addDays(today, 1),
    };
  }

  if (activity === "demo") {
    if (BEFORE_DEMO.includes(lead.status)) {
      return {
        ...keep,
        status: "demo_booked",
        nextAction: "Démo",
        nextActionDate: null,
        hint: "Choisissez la date de la démo.",
      };
    }
    if (lead.status === "demo_booked") {
      return {
        ...keep,
        status: "demo_done",
        nextAction: "Envoyer lien d'essai",
        nextActionDate: addDays(today, 1),
      };
    }
  }

  // TODO: email activities have no rule in the plan; they keep the current status and next action
  return keep;
}

// Next action when the user picks a status by hand; null = leave the next action as it is.
export function nextForStatus(
  status: LeadStatus,
  today: string,
): { nextAction: string; nextActionDate: string | null } | null {
  if (status === "trial") {
    return { nextAction: "Point essai", nextActionDate: addDays(today, 7) };
  }
  if (status === "paying" || status === "lost" || status === "not_qualified") {
    return { nextAction: "", nextActionDate: null };
  }
  return null;
}

export function isQualified(lead: Pick<Lead, "cars_online" | "is_franchise">): boolean {
  return (
    lead.cars_online !== null &&
    lead.cars_online >= 20 &&
    lead.cars_online <= 150 &&
    !lead.is_franchise
  );
}
