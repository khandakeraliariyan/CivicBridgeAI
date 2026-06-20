-- Phase 1: prepare archive/privacy-supporting metadata on cases.
-- Verification after execution:
-- \d public.cases
-- select id, archived_at, archive_note, ai_consent_at from public.cases limit 10;

begin;

alter table public.cases
  add column if not exists archive_note text null,
  add column if not exists ai_consent_at timestamptz null,
  add column if not exists privacy_notice_version text null;

create index if not exists idx_cases_archived_at
  on public.cases(archived_at);

commit;
