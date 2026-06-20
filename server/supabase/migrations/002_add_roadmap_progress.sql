-- Phase 1: prepare interactive roadmap progress fields.
-- Verification after execution:
-- select status, count(*) from public.roadmaps group by status order by status;
-- select count(*) from public.roadmaps where status is null;

begin;

alter table public.roadmaps
  add column if not exists status text null,
  add column if not exists due_at timestamptz null,
  add column if not exists started_at timestamptz null,
  add column if not exists completed_at timestamptz null,
  add column if not exists user_note text null,
  add column if not exists outcome text null,
  add column if not exists sort_order integer null,
  add column if not exists is_user_created boolean not null default false;

update public.roadmaps
set status = 'NOT_STARTED'
where status is null;

with ranked as (
  select
    id,
    row_number() over (
      partition by assessment_id
      order by created_at asc nulls last, id asc
    ) as next_sort_order
  from public.roadmaps
)
update public.roadmaps r
set sort_order = ranked.next_sort_order
from ranked
where r.id = ranked.id
  and r.sort_order is null;

alter table public.roadmaps
  alter column status set default 'NOT_STARTED',
  alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'roadmaps_status_check'
  ) then
    alter table public.roadmaps
      add constraint roadmaps_status_check
      check (status in ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'));
  end if;
end $$;

create index if not exists idx_roadmaps_assessment_status
  on public.roadmaps(assessment_id, status);

create index if not exists idx_roadmaps_assessment_due_at
  on public.roadmaps(assessment_id, due_at);

create index if not exists idx_roadmaps_assessment_sort_order
  on public.roadmaps(assessment_id, sort_order);

commit;
