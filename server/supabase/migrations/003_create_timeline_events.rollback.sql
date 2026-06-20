-- WARNING:
-- Rolling this back removes all stored timeline history.

begin;

drop table if exists public.timeline_events;

commit;
