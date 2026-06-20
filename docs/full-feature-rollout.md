# Full Feature Rollout

## Backup First

1. Create a fresh Supabase database backup or snapshot before applying any migration.
2. Export the current schema and keep a copy outside this repository.
3. Confirm no one is actively writing production data during migration work.

## Base Readiness Queries

Run these read-only checks before any migration:

```sql
select to_regclass('public.users') as users_table;
select to_regclass('public.assessments') as assessments_table;
select to_regclass('public.roadmaps') as roadmaps_table;
select to_regclass('public.resources') as resources_table;
select count(*) as resource_count from public.resources;
```

## Migration Order

Run each file separately, verify it, and only then continue.

1. `001_create_cases_and_link_assessments.sql`
2. `002_add_roadmap_progress.sql`
3. `003_create_timeline_events.sql`
4. `004_add_reassessment_fields.sql`
5. `005_create_resource_interactions.sql`
6. `006_add_case_privacy_and_archive_fields.sql`

Do not rerun the original `schema.sql`.

## Verification After Each Migration

After `001`:

```sql
select to_regclass('public.cases') as cases_table;
select column_name from information_schema.columns where table_schema = 'public' and table_name = 'assessments' and column_name = 'case_id';
```

After `002`:

```sql
select column_name from information_schema.columns where table_schema = 'public' and table_name = 'roadmaps' and column_name in ('status', 'due_at', 'started_at', 'completed_at', 'user_note', 'outcome');
```

After `003`:

```sql
select to_regclass('public.timeline_events') as timeline_events_table;
```

After `004`:

```sql
select column_name from information_schema.columns where table_schema = 'public' and table_name = 'assessments' and column_name in ('assessment_kind', 'previous_assessment_id', 'change_note');
```

After `005`:

```sql
select to_regclass('public.resource_interactions') as resource_interactions_table;
```

After `006`:

```sql
select column_name from information_schema.columns where table_schema = 'public' and table_name = 'cases' and column_name in ('archived_at', 'resolved_at');
```

## Resource Table Check

Use this read-only query before deciding whether `seed.sql` is needed:

```sql
select count(*) as resource_count from public.resources;
```

Only consider `seed.sql` if the count is zero and you have reviewed duplicate behavior first. Do not rerun `seed.sql` blindly.

## Local Environment

Backend:

```env
CLIENT_ORIGIN=http://localhost:3000
```

Frontend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

Implemented features are enabled by default in code. Database migrations still
decide whether migration-backed capabilities are actually ready.

## Restart Commands

```bat
cd server
npm.cmd run dev
```

```bat
cd client
npm.cmd run dev
```

## Manual Test Checklist

1. Sign in and confirm `/dashboard` loads.
2. Create assessment A and verify `/cases` shows a new case.
3. Create assessment B and verify the dashboard switches to case B.
4. Reopen case A and confirm dashboard, roadmap, resources, and progress switch back to case A.
5. Reopen case B and confirm the same for case B.
6. Update a roadmap task to `IN_PROGRESS`, refresh, and confirm persistence.
7. Add a timeline note and confirm it appears in case detail.
8. Run a reassessment and confirm progress shows previous score, current score, and delta.
9. Save a resource interaction and confirm it appears on the resources page after refresh.
10. Run a simulation and confirm it appears in progress and case detail history.
11. Open settings and confirm consent, cache, and sign-out controls are meaningful.

## Rollback Warnings

1. Do not use rollback scripts casually after real feature data exists.
2. Case history, task progress, timeline, reassessment, and resource interaction rollbacks can destroy live relational data.
3. Review data-loss impact before reversing any applied migration.
