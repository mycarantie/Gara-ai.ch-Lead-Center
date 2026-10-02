export type LeadStatus =
  | "to_contact"
  | "messaged"
  | "replied"
  | "demo_booked"
  | "demo_done"
  | "trial"
  | "paying"
  | "lost"
  | "not_qualified";

export type LostReason =
  | "no_reply"
  | "not_interested"
  | "has_system"
  | "too_small"
  | "franchise"
  | "too_expensive"
  | "other";

export type ActivityType =
  | "whatsapp_sent"
  | "whatsapp_received"
  | "call_answered"
  | "call_no_answer"
  | "email_sent"
  | "email_received"
  | "demo"
  | "note"
  | "status_change";

export interface Lead {
  id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;

  garage_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  autoscout_url: string | null;

  address: string | null;
  city: string | null;
  canton: string | null;
  region: string | null;

  cars_online: number | null;
  is_franchise: boolean;
  current_system: string | null;
  do_not_contact: boolean;

  status: LeadStatus;
  lost_reason: LostReason | null;
  followup_count: number;
  last_contact_at: string | null;
  next_action: string | null;
  next_action_at: string | null;

  trial_started_at: string | null;
  plan: string | null;
  monthly_value_chf: number | null;

  notes: string | null;
}

// The lead fields the Log modal needs; kept small because it is sent to the browser per card
export type LogLead = Pick<
  Lead,
  | "id"
  | "garage_name"
  | "status"
  | "lost_reason"
  | "followup_count"
  | "next_action"
  | "next_action_at"
>;

// Log modal fields plus what the WhatsApp link and message templates need
export type WhatsAppLead = LogLead &
  Pick<Lead, "contact_name" | "city" | "cars_online"> & { phone: string };

export interface Activity {
  id: string;
  owner_id: string;
  lead_id: string;
  created_at: string;
  type: ActivityType;
  summary: string | null;
}

export interface Template {
  id: string;
  owner_id: string;
  name: string;
  body: string;
  sort_order: number;
}
