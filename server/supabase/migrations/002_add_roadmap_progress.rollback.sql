-- WARNING:
-- Rolling this back removes roadmap status, due dates, notes, outcomes, and sort order.
-- Any new user progress data stored in those fields will be lost.

begin;

drop index if exists idx_roadmaps_assessment_sort_order;
drop index if exists idx_roadmaps_assessment_due_at;
drop index if exists idx_roadmaps_assessment_status;

alter table if exists public.roadmaps
  drop constraint if exists roadmaps_status_check;

alter table if exists public.roadmaps
  drop column if exists status,
  drop column if exists due_at,
  drop column if exists started_at,
  drop column if exists completed_at,
  drop column if exists user_note,
  drop column if exists outcome,
  drop column if exists sort_order,
  drop column if exists is_user_created;

commit;
