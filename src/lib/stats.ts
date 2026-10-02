import { addDays, todayISO } from "./dates";
import type { Activity, ActivityType, Lead, LeadStatus, LostReason } from "./types";

export type StatLead = Pick<Lead, "id" | "status" | "region" | "lost_reason" | "monthly_value_chf">;
export type StatActivity = Pick<Activity, "lead_id" | "type" | "created_at">;

export interface StageCounts {
  leads: number;
  messaged: number;
  replied: number;
  demos: number;
  paying: number;
}

export interface Stats {
  // Leads by their current status; the two demo statuses are merged
  funnel: { label: string; count: number }[];
  // Leads that got at least this far, whatever their status today
  reached: StageCounts;
  conversions: { label: string; part: number; whole: number }[];
  week: { messages: number; calls: number; replies: number; demos: number };
  lostReasons: { reason: LostReason; count: number }[];
  mrr: number;
}

// How far along the funnel each status is; lost and not_qualified say nothing about it
const STAGE: Record<LeadStatus, number> = {
  to_contact: 0,
  messaged: 1,
  replied: 2,
  demo_booked: 3,
  demo_done: 3,
  trial: 4,
  paying: 5,
  lost: -1,
  not_qualified: -1,
};

const REPLY_ACTIVITIES: ActivityType[] = ["whatsapp_received", "call_answered", "email_received"];
const OUTREACH_ACTIVITIES: ActivityType[] = ["whatsapp_sent", "email_sent", "call_no_answer"];

function groupActivities(activities: StatActivity[]): Map<string, Set<ActivityType>> {
  const byLead = new Map<string, Set<ActivityType>>();
  for (const activity of activities) {
    const types = byLead.get(activity.lead_id) ?? new Set<ActivityType>();
    types.add(activity.type);
    byLead.set(activity.lead_id, types);
  }
  return byLead;
}

// A lost lead keeps the stages its journal proves it reached.
function countStages(leads: StatLead[], byLead: Map<string, Set<ActivityType>>): StageCounts {
  const counts: StageCounts = { leads: leads.length, messaged: 0, replied: 0, demos: 0, paying: 0 };
  for (const lead of leads) {
    const types = byLead.get(lead.id) ?? new Set<ActivityType>();
    const stage = STAGE[lead.status];
    const demo = stage >= 3 || types.has("demo");
    const replied = demo || stage >= 2 || REPLY_ACTIVITIES.some((type) => types.has(type));
    const messaged = replied || stage >= 1 || OUTREACH_ACTIVITIES.some((type) => types.has(type));
    if (messaged) counts.messaged += 1;
    if (replied) counts.replied += 1;
    if (demo) counts.demos += 1;
    if (lead.status === "paying") counts.paying += 1;
  }
  return counts;
}

export function mondayOf(dateISO: string): string {
  const day = new Date(`${dateISO}T12:00:00Z`).getUTCDay();
  return addDays(dateISO, -((day + 6) % 7));
}

export function computeStats(leads: StatLead[], activities: StatActivity[], today: string): Stats {
  const ids = new Set(leads.map((lead) => lead.id));
  const relevant = activities.filter((activity) => ids.has(activity.lead_id));
  const byStatus = (status: LeadStatus) => leads.filter((lead) => lead.status === status).length;
  const reached = countStages(leads, groupActivities(relevant));

  const monday = mondayOf(today);
  const thisWeek = relevant.filter((activity) => todayISO(new Date(activity.created_at)) >= monday);
  const weekCount = (...types: ActivityType[]) =>
    thisWeek.filter((activity) => types.includes(activity.type)).length;

  const reasons = new Map<LostReason, number>();
  for (const lead of leads) {
    if (lead.status !== "lost") continue;
    const reason = lead.lost_reason ?? "other";
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  }

  return {
    funnel: [
      { label: "À contacter", count: byStatus("to_contact") },
      { label: "Contacté", count: byStatus("messaged") },
      { label: "A répondu", count: byStatus("replied") },
      { label: "Démo", count: byStatus("demo_booked") + byStatus("demo_done") },
      { label: "En essai", count: byStatus("trial") },
      { label: "Client", count: byStatus("paying") },
    ],
    reached,
    conversions: [
      { label: "Réponses / contactés", part: reached.replied, whole: reached.messaged },
      { label: "Démos / réponses", part: reached.demos, whole: reached.replied },
      { label: "Clients / démos", part: reached.paying, whole: reached.demos },
    ],
    week: {
      messages: weekCount("whatsapp_sent", "email_sent"),
      calls: weekCount("call_answered", "call_no_answer"),
      replies: weekCount("whatsapp_received", "email_received"),
      demos: weekCount("demo"),
    },
    lostReasons: [...reasons.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    mrr: leads
      .filter((lead) => lead.status === "paying")
      .reduce((sum, lead) => sum + (lead.monthly_value_chf ?? 0), 0),
  };
}

export function statsByRegion(
  leads: StatLead[],
  activities: StatActivity[],
): ({ region: string } & StageCounts)[] {
  const byLead = groupActivities(activities);
  const groups = new Map<string, StatLead[]>();
  for (const lead of leads) {
    const region = lead.region ?? "Sans région";
    groups.set(region, [...(groups.get(region) ?? []), lead]);
  }
  return [...groups.entries()]
    .map(([region, group]) => ({ region, ...countStages(group, byLead) }))
    .sort((a, b) => a.region.localeCompare(b.region, "fr"));
}
