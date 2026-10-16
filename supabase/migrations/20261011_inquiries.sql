-- Project inquiries: the brief, the chat with the studio, the offer and online
-- meetings. Everything is read and written only by the server routes in /api
-- with the service-role key; RLS is on with no policies, so the public anon key
-- reaches nothing.

create extension if not exists pgcrypto;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  number serial unique,
  -- Secret part of the client's private link (/zapitvane/<token>).
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  project_type text not null,
  -- Answers to the step-by-step questions.
  answers jsonb not null default '{}'::jsonb,
  -- Structured brief from the AI conversation (or the questionnaire).
  brief jsonb not null default '{}'::jsonb,
  -- The AI conversation, kept for the studio.
  transcript jsonb not null default '[]'::jsonb,
  -- Storage paths of files added before the inquiry was sent.
  files jsonb not null default '[]'::jsonb,
  status text not null default 'new'
    check (status in ('new', 'offer', 'accepted', 'deposit_paid', 'in_progress', 'done', 'archived')),
  -- Set by the studio: { price, deposit, deadline, note, payment }.
  offer jsonb,
  offer_sent_at timestamptz,
  accepted_at timestamptz,
  client_seen_at timestamptz,
  studio_seen_at timestamptz,
  last_message_at timestamptz not null default now()
);

create table if not exists public.inquiry_messages (
  id bigint generated always as identity primary key,
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  sender text not null check (sender in ('client', 'studio', 'system')),
  body text not null default '',
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists inquiry_messages_inquiry_idx
  on public.inquiry_messages (inquiry_id, id);

create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  starts_at timestamptz not null,
  minutes int not null default 30,
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  meet_url text,
  created_at timestamptz not null default now()
);
-- One meeting per slot.
create unique index if not exists bookings_slot_idx
  on public.bookings (starts_at) where status = 'booked';
create index if not exists bookings_inquiry_idx on public.bookings (inquiry_id);

-- One row: when the studio takes online meetings.
create table if not exists public.studio_settings (
  id int primary key default 1 check (id = 1),
  availability jsonb not null default '{
    "timeZone": "Europe/Sofia",
    "weekdays": [1, 2, 3, 4, 5],
    "start": "10:00",
    "end": "18:00",
    "minutes": 30,
    "daysAhead": 14,
    "noticeHours": 12
  }'::jsonb
);
insert into public.studio_settings (id) values (1) on conflict (id) do nothing;

alter table public.inquiries enable row level security;
alter table public.inquiry_messages enable row level security;
alter table public.bookings enable row level security;
alter table public.studio_settings enable row level security;

-- Private bucket for logos, photos and references. Uploads go through signed
-- upload URLs made by the server; reading through short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inquiry-files', 'inquiry-files', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf']
)
on conflict (id) do nothing;
