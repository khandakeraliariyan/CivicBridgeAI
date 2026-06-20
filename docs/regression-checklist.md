# Regression Checklist

Use this checklist after every migration or feature slice.

## Authentication

- Register with email/password
- Sign in with email/password
- Sign in with Google
- Sign out
- Confirm unauthenticated protected routes redirect to login
- Confirm authenticated requests include `Authorization: Bearer <token>`
- Confirm `/api/users/me` loads and returns `firebaseUser` plus `databaseUser`
- Confirm user synchronization still inserts or reads the correct `users` row

## Assessment flow

- Submit an assessment with a valid situation
- Confirm optional emergency screening does not block the normal flow unexpectedly
- Confirm `POST /api/assessments` still returns:
  - `assessment`
  - `analysis`
  - `priorities.priorities`
  - `roadmap.roadmap`
- Confirm dashboard displays score and risks
- Confirm priorities render
- Confirm roadmap renders
- Confirm resource recommendations render
- Confirm decision simulation still works

## Case history and dashboard

- Confirm `/cases` loads when case history is enabled
- Confirm opening `/cases/[caseId]` restores the saved workspace
- Confirm `/api/dashboard/summary` loads the current case overview when daily actions are enabled
- Confirm archive and restore behavior works through `PATCH /api/cases/:caseId`

## Roadmap progress

- Confirm roadmap tasks can move between:
  - `NOT_STARTED`
  - `IN_PROGRESS`
  - `COMPLETED`
  - `BLOCKED`
- Confirm optimistic updates roll back cleanly on failure
- Confirm due date, private note, and outcome fields persist

## Timeline and reassessment

- Confirm timeline loads for a selected case when enabled
- Confirm adding a private note writes a new timeline event
- Confirm reassessment creates a new assessment snapshot
- Confirm reassessment comparison shows previous and current values

## Resources and assistance

- Confirm a recommended resource can be saved to the case
- Confirm tracked-resource status updates work
- Confirm simulation history loads per case
- Confirm eligibility guidance returns an advisory disclaimer
- Confirm application assistance returns guidance only and never auto-submits anything

## Ownership and authorization

- Missing bearer token returns `401`
- Invalid token returns `401`
- Non-owned assessment lookup does not leak data
- Missing assessment does not leak data

## Frontend state

- Valid latest workspace restores from localStorage
- Missing workspace shows empty states safely
- Malformed workspace is discarded safely
- Latest workspace updates after a new assessment
- Simulation history appends in the workspace cache

## UI and navigation

- Forced light theme remains intact
- Desktop sidebar renders correctly
- Mobile navigation opens and closes
- `/dashboard`, `/assessments/new`, `/cases`, `/roadmap`, `/resources`, `/progress`, `/settings` still load

## Build and test verification

- Backend tests pass
- Frontend tests pass
- Frontend lint passes
- Frontend typecheck passes
- Frontend production build passes
- No secret files are tracked by Git
- `git diff --stat` contains only intended files
