-- Phase 1: prepare reassessment linkage fields.
-- Verification after execution:
-- select assessment_kind, count(*) from public.assessments group by assessment_kind order by assessment_kind;
-- select count(*) from public.assessments where previous_assessment_id is not null;

begin;

alter table public.assessments
  add column if not exists previous_assessment_id uuid null;

update public.assessments
set assessment_kind = 'INITIAL'
where assessment_kind is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'assessments_assessment_kind_check'
  ) then
    alter table public.assessments
      add constraint assessments_assessment_kind_check
      check (assessment_kind in ('INITIAL', 'REASSESSMENT'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'assessments_previous_assessment_id_fkey'
  ) then
    alter table public.assessments
      add constraint assessments_previous_assessment_id_fkey
      foreign key (previous_assessment_id) references public.assessments(id) on delete set null;
  end if;
end $$;

create index if not exists idx_assessments_case_created_at
  on public.assessments(case_id, created_at desc);

create index if not exists idx_assessments_previous_assessment_id
  on public.assessments(previous_assessment_id);

commit;
