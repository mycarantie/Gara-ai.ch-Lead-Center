-- Status of a lead in the sales pipeline
create type lead_status as enum (
  'to_contact',     -- À contacter
  'messaged',       -- Contacté
  'replied',        -- A répondu
  'demo_booked',    -- Démo prévue
  'demo_done',      -- Démo faite
  'trial',          -- En essai
  'paying',         -- Client payant
  'lost',           -- Perdu
  'not_qualified'   -- Non qualifié
);

create type lost_reason as enum (
  'no_reply', 'not_interested', 'has_system', 'too_small',
  'franchise', 'too_expensive', 'other'
);

create type activity_type as enum (
  'whatsapp_sent', 'whatsapp_received', 'call_answered', 'call_no_answer',
  'email_sent', 'email_received', 'demo', 'note', 'status_change'
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Identity
  garage_name text not null,
  contact_name text,
  phone text,                 -- stored normalized: +41791234567
  email text,
  website text,
  autoscout_url text,

  -- Location
  address text,
  city text,
  canton text,                -- VD, VS, GE, FR, BE, NE, JU...
  region text,                -- free text campaign, e.g. 'Riviera – Vevey'

  -- Qualification
  cars_online int,
  is_franchise boolean not null default false,
  current_system text,        -- what they use today (paper, Excel, other software...)
  do_not_contact boolean not null default false,  -- e.g. asterisk (*) in phone directory

  -- Pipeline
  status lead_status not null default 'to_contact',
  lost_reason lost_reason,
  followup_count int not null default 0,   -- follow-ups sent without reply
  last_contact_at timestamptz,
  next_action text,
  next_action_at timestamptz,

  -- Customer
  trial_started_at date,
  plan text,                  -- 'plus' | 'pro' | null
  monthly_value_chf numeric,  -- 50, 150, or yearly/12

  notes text
);

create index on leads (owner_id, next_action_at);
create index on leads (owner_id, status);
create index on leads (owner_id, region);
create unique index leads_owner_phone_uniq on leads (owner_id, phone) where phone is not null;

create table activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  lead_id uuid not null references leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  type activity_type not null,
  summary text                -- what was said / what happened
);

create index on activities (lead_id, created_at desc);

create table templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  body text not null,         -- supports placeholders: {contact} {garage} {ville} {voitures} {prenom}
  sort_order int not null default 0
);

-- Row Level Security: each row visible only to its owner
alter table leads enable row level security;
alter table activities enable row level security;
alter table templates enable row level security;

create policy "own leads" on leads for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own activities" on activities for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own templates" on templates for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Keep updated_at fresh
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger leads_updated_at before update on leads
  for each row execute function set_updated_at();
