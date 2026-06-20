# Architecture

## High-level runtime flow

```text
Next.js App Router UI
-> Firebase Client Authentication
-> Firebase ID token
-> Express API
-> Supabase
-> Gemini
```

## Frontend

- Root layout: [client/app/layout.tsx](../client/app/layout.tsx)
- Public routes:
  - `/`
  - `/login`
  - `/register`
- Protected layout: [client/app/(protected)/layout.tsx](../client/app/(protected)/layout.tsx)
- Protected routes:
  - `/dashboard`
  - `/assessments/new`
  - `/cases`
  - `/cases/[caseId]`
  - `/roadmap`
  - `/resources`
  - `/progress`
  - `/settings`

### Frontend state and providers

- Firebase initialization: [client/lib/firebase.ts](../client/lib/firebase.ts)
- Auth provider: [client/providers/auth-provider.tsx](../client/providers/auth-provider.tsx)
- Assessment workspace cache:
  - [client/providers/assessment-workspace-provider.tsx](../client/providers/assessment-workspace-provider.tsx)
  - localStorage key: `civicbridge.latest-assessment-workspace`
- API client: [client/lib/api-client.ts](../client/lib/api-client.ts)
- Feature flags: [client/lib/features.ts](../client/lib/features.ts)

## Backend

- Server entry: [server/src/server.js](../server/src/server.js)
- App composition: [server/src/app.js](../server/src/app.js)
- Auth middleware: [server/src/middleware/auth.middleware.js](../server/src/middleware/auth.middleware.js)
- Ownership checks: [server/src/services/ownership.service.js](../server/src/services/ownership.service.js)
- Feature flags: [server/src/config/features.js](../server/src/config/features.js)
- CORS config: [server/src/middleware/cors.middleware.js](../server/src/middleware/cors.middleware.js)
- Rate limiting: [server/src/middleware/rate-limit.middleware.js](../server/src/middleware/rate-limit.middleware.js)

### Main backend modules

- Assessments:
  - routes: [server/src/routes/assessment.routes.js](../server/src/routes/assessment.routes.js)
  - controller: [server/src/controllers/assessment.controller.js](../server/src/controllers/assessment.controller.js)
  - service: [server/src/services/assessment.service.js](../server/src/services/assessment.service.js)
- Cases:
  - routes: [server/src/routes/case.routes.js](../server/src/routes/case.routes.js)
  - controller: [server/src/controllers/case.controller.js](../server/src/controllers/case.controller.js)
  - service: [server/src/services/case.service.js](../server/src/services/case.service.js)
- Dashboard:
  - routes: [server/src/routes/dashboard.routes.js](../server/src/routes/dashboard.routes.js)
  - controller: [server/src/controllers/dashboard.controller.js](../server/src/controllers/dashboard.controller.js)
  - service: [server/src/services/dashboard.service.js](../server/src/services/dashboard.service.js)
- Resource interactions:
  - routes: [server/src/routes/resource-interaction.routes.js](../server/src/routes/resource-interaction.routes.js)
  - controller: [server/src/controllers/resource-interaction.controller.js](../server/src/controllers/resource-interaction.controller.js)
  - service: [server/src/services/resource-interaction.service.js](../server/src/services/resource-interaction.service.js)
- Timeline:
  - service: [server/src/services/timeline.service.js](../server/src/services/timeline.service.js)
  - repository: [server/src/repositories/timeline.repository.js](../server/src/repositories/timeline.repository.js)

## Assessment and case pipeline

```text
client/components/assessment/assessment-form.tsx
-> optional POST /api/assessments/safety-screening
-> POST /api/assessments
-> auth middleware verifies Firebase token
-> auth middleware syncs user to `users`
-> assessment.validator.js validates the request
-> assessment.service.js
-> AI executor validates and normalizes Gemini outputs
-> insert `assessments`
-> create `cases` row for initial assessments
-> insert `risk_assessments`
-> insert `priorities`
-> insert `roadmaps`
-> update case metadata
-> write timeline events when enabled
-> return backward-compatible assessment response
-> frontend hydrates workspace and caches it locally
```

## Case reopen pipeline

```text
client/app/(protected)/cases/[caseId]/page.tsx
-> GET /api/cases/:caseId
-> ownership validation
-> case.service.js composes latest case workspace
-> frontend hydrates the assessment workspace provider
-> existing dashboard, roadmap, progress, and resources screens reuse the restored data
```

## Database model

Base tables:

- `users`
- `assessments`
- `risk_assessments`
- `priorities`
- `roadmaps`
- `simulations`
- `resources`

Feature-expansion tables and columns:

- `cases`
- `timeline_events`
- `resource_interactions`
- roadmap progress columns
- reassessment columns on `assessments`
- archive/privacy columns on `cases`

## Current product model

The application now supports both:

- backend-backed case history, task progress, dashboard summaries, reassessment, timeline, simulation history, and tracked resources
- local latest-workspace persistence as a safe cache and fallback layer
