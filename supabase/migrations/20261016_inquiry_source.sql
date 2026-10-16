-- Where the client came from: UTM tags from the link they arrived by, the
-- referring site (host only) and the first page they saw. Empty object when unknown.
alter table public.inquiries add column if not exists source jsonb not null default '{}'::jsonb;
