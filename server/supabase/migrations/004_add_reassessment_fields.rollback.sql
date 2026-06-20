-- WARNING:
-- Rolling this back removes reassessment linkage metadata.

begin;

drop index if exists idx_assessments_previous_assessment_id;
drop index if exists idx_assessments_case_created_at;

alter table if exists public.assessments
  drop constraint if exists assessments_previous_assessment_id_fkey;

alter table if exists public.assessments
  drop constraint if exists assessments_assessment_kind_check;

alter table if exists public.assessments
  drop column if exists previous_assessment_id;

commit;
