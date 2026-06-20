-- WARNING:
-- Rolling this back removes privacy/archive metadata captured after rollout.

begin;

drop index if exists idx_cases_archived_at;

alter table if exists public.cases
  drop column if exists archive_note,
  drop column if exists ai_consent_at,
  drop column if exists privacy_notice_version;

commit;
