-- The deposit is computed from the project type and paid online (Stripe);
-- the offer/accept steps and the chat are gone from the client's flow.
alter table public.inquiries
  add column if not exists deposit integer not null default 0,
  add column if not exists deposit_paid_at timestamptz,
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent text;

update public.inquiries set status = 'new' where status in ('offer', 'accepted');
alter table public.inquiries drop constraint if exists inquiries_status_check;
alter table public.inquiries
  add constraint inquiries_status_check
  check (status in ('new', 'deposit_paid', 'in_progress', 'done', 'archived'));
