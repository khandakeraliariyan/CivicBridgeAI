# CivicBridgeAI Setup Guide

## 1. Prerequisites

- Windows with PowerShell or Command Prompt
- Node.js 20 or newer
- npm 10 or newer
- A Firebase project with Email/Password and Google auth enabled
- A Supabase project
- A Gemini API key

## 2. Repository Structure

```txt
CivicBridgeAI/
|-- server/   # Express backend
|-- client/   # Next.js frontend
`-- docs/     # Contracts, architecture, regression notes
```

## 3. Backend Environment Setup

Create the backend environment file:

```bat
cd server
copy .env.example .env
```

Fill in:

- `PORT`
- `CLIENT_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

Default local origin:

```env
CLIENT_ORIGIN=http://localhost:3000
```

## 4. Frontend Environment Setup

Create the frontend local environment file:

```bat
cd client
copy .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Default local API base:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## 5. Firebase Admin Setup

The backend expects a local Firebase Admin credential file at:

```txt
server/serviceAccountKey.json
```

Create it from your real Firebase service account download. Do not commit it.

Important:

- Keep `server/serviceAccountKey.json` local only
- Never place it in `client/`
- Never print or share its contents

## 6. Firebase Client Setup

Get the Firebase Web SDK values from:

Firebase Console -> Project settings -> General -> Your apps -> Web app

The frontend initializes Firebase in:

```txt
client/lib/firebase.ts
```

## 7. Authentication Flow

The system supports:

- Email/password auth
- Google sign-in

Flow:

1. The frontend signs in with Firebase Client SDK
2. The frontend retrieves the Firebase ID token
3. The frontend sends `Authorization: Bearer <firebase-id-token>`
4. The backend verifies the token with Firebase Admin
5. The backend synchronizes the user into Supabase

## 8. Supabase Database Setup

The repository now includes:

- base schema files in `server/supabase/`
- additive migrations in `server/supabase/migrations/`

Core tables expected by the app:

- `users`
- `assessments`
- `risk_assessments`
- `priorities`
- `roadmaps`
- `simulations`
- `resources`

Feature-expansion migrations add:

- `cases`
- `timeline_events`
- `resource_interactions`
- additional roadmap progress columns
- assessment reassessment columns
- case privacy/archive columns

## 9. Manual Migration Execution Order

Do not run these blindly against production. Back up your database first.

Apply in this order:

1. `server/supabase/migrations/001_create_cases_and_link_assessments.sql`
2. `server/supabase/migrations/002_add_roadmap_progress.sql`
3. `server/supabase/migrations/003_create_timeline_events.sql`
4. `server/supabase/migrations/004_add_reassessment_fields.sql`
5. `server/supabase/migrations/005_create_resource_interactions.sql`
6. `server/supabase/migrations/006_add_case_privacy_and_archive_fields.sql`

Rollback companions exist beside each file and should only be used with care because they may remove feature data created after rollout.

## 10. Feature Availability

Implemented product features are enabled by default in code.

Actual readiness still depends on:

1. base schema being applied
2. additive migrations being applied in order
3. Firebase, Supabase, and Gemini being configured correctly

## 11. Install Dependencies

Backend:

```bat
cd server
npm.cmd install
```

Frontend:

```bat
cd client
npm.cmd install
```

## 12. Run The Applications

Backend:

```bat
cd D:\Other Projects\CivicBridgeAI\server
npm.cmd run dev
```

Frontend:

```bat
cd D:\Other Projects\CivicBridgeAI\client
npm.cmd run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- API: `http://localhost:5000/api`

## 13. Verification Commands

Backend:

```bat
cd server
npm.cmd test
```

Frontend:

```bat
cd client
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

## 14. Key Protected Routes

Current protected app routes include:

- `/dashboard`
- `/assessments/new`
- `/cases`
- `/cases/[caseId]`
- `/roadmap`
- `/resources`
- `/progress`
- `/settings`

## 15. New API Surface

New backend routes added during the phased implementation include:

- `GET /api/cases`
- `GET /api/cases/:caseId`
- `PATCH /api/cases/:caseId`
- `GET /api/cases/:caseId/timeline`
- `POST /api/cases/:caseId/timeline-notes`
- `GET /api/cases/:caseId/reassessments`
- `POST /api/cases/:caseId/reassessments`
- `GET /api/cases/:caseId/simulations`
- `GET /api/cases/:caseId/resource-interactions`
- `POST /api/cases/:caseId/resource-interactions`
- `POST /api/cases/:caseId/resources/:resourceId/eligibility`
- `POST /api/cases/:caseId/resources/:resourceId/application-assistance`
- `PATCH /api/resource-interactions/:interactionId`
- `PATCH /api/roadmaps/:roadmapId`
- `GET /api/dashboard/summary`
- `POST /api/assessments/safety-screening`

## 16. Common Setup Problems

`Unauthorized`

- Confirm the frontend and backend are using the same Firebase project
- Confirm Firebase Auth providers are enabled
- Confirm the request includes `Authorization: Bearer <firebase-id-token>`

`Could not find the table 'public.users' in the schema cache`

- The base schema has not been applied to Supabase yet

Case, timeline, roadmap-progress, or resource-interaction routes fail

- Required migrations may not be applied yet

`CORS` errors in the browser

- Confirm `CLIENT_ORIGIN` matches the frontend origin

Assessment submission fails after auth succeeds

- Confirm Supabase schema and migrations are applied
- Confirm Gemini and Firebase Admin are configured

## 17. Security Notes

- Never commit `server/.env`
- Never commit `client/.env.local`
- Never commit `server/serviceAccountKey.json`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` to the frontend
- Never store Firebase tokens manually in localStorage

## 18. Related Project Docs

- `docs/architecture.md`
- `docs/current-api-contracts.md`
- `docs/regression-checklist.md`
- `server/supabase/schema.sql`
- `server/supabase/seed.sql`
- `server/supabase/migrations/`
