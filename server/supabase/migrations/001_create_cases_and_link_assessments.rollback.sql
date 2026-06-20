-- WARNING:
-- Rolling this back will delete all case rows and unlink assessments from cases.
-- Do not run if any production feature data depends on `cases` or `assessments.case_id`.

begin;

drop trigger if exists set_cases_updated_at on public.cases;

alter table if exists public.assessments
  drop constraint if exists assessments_case_id_fkey;

alter table if exists public.cases
  drop constraint if exists cases_current_assessment_id_fkey;

drop index if exists idx_cases_user_updated_at;
drop index if exists idx_cases_user_status;
drop index if exists idx_cases_user_id;
drop index if exists idx_assessments_case_id;

alter table if exists public.assessments
  drop column if exists case_id,
  drop column if exists assessment_kind,
  drop column if exists change_note;

drop table if exists public.cases;

commit;
