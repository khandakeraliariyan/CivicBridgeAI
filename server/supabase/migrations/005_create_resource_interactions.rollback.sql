-- WARNING:
-- Rolling this back removes all persisted resource interaction tracking data.

begin;

drop trigger if exists set_resource_interactions_updated_at on public.resource_interactions;

alter table if exists public.timeline_events
  drop constraint if exists timeline_events_resource_interaction_id_fkey;

drop index if exists idx_resource_interactions_case_follow_up;
drop index if exists idx_resource_interactions_case_status;

drop table if exists public.resource_interactions;

commit;
