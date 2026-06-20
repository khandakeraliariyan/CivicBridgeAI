-- Phase 1: create timeline event storage.
-- Verification after execution:
-- select count(*) from public.timeline_events;
-- \d public.timeline_events

begin;

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  assessment_id uuid null references public.assessments(id) on delete set null,
  roadmap_id uuid null references public.roadmaps(id) on delete set null,
  resource_interaction_id uuid null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists idx_timeline_events_case_created_at
  on public.timeline_events(case_id, created_at desc);

create index if not exists idx_timeline_events_assessment_created_at
  on public.timeline_events(assessment_id, created_at desc);

commit;
