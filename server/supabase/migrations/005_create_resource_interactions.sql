-- Phase 1: create persistent case-resource interaction tracking.
-- Verification after execution:
-- select count(*) from public.resource_interactions;
-- \d public.resource_interactions

begin;

create table if not exists public.resource_interactions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  status text not null default 'SAVED',
  contacted_at timestamptz null,
  follow_up_at timestamptz null,
  response_note text null,
  application_reference text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_interactions_status_check
    check (status in ('SAVED', 'CONTACTED', 'WAITING_FOR_RESPONSE', 'COMPLETED', 'REJECTED')),
  constraint resource_interactions_case_resource_key
    unique (case_id, resource_id)
);

create index if not exists idx_resource_interactions_case_status
  on public.resource_interactions(case_id, status);

create index if not exists idx_resource_interactions_case_follow_up
  on public.resource_interactions(case_id, follow_up_at);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'timeline_events_resource_interaction_id_fkey'
  ) then
    alter table public.timeline_events
      add constraint timeline_events_resource_interaction_id_fkey
      foreign key (resource_interaction_id) references public.resource_interactions(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_resource_interactions_updated_at'
  ) then
    create trigger set_resource_interactions_updated_at
    before update on public.resource_interactions
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

commit;
