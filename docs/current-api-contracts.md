# Current API Contracts

This document records the confirmed current API contracts in the `auntor` branch before larger migration work.

## `GET /api/users/me`

- Authentication: required via Firebase bearer token
- Request body: none
- Validation: auth middleware only
- Success:
  ```json
  {
    "success": true,
    "firebaseUser": {
      "uid": "firebase-uid"
    },
    "databaseUser": {
      "id": "uuid",
      "firebase_uid": "firebase-uid",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
  ```
- Errors:
  - `401 { success: false, message: "No token provided" }`
  - `401 { success: false, message: "Unauthorized" }`
  - `500 { success: false, message }`
- Backend files:
  - [server/src/routes/user.routes.js](../server/src/routes/user.routes.js)
  - [server/src/middleware/auth.middleware.js](../server/src/middleware/auth.middleware.js)
  - [server/src/services/user.service.js](../server/src/services/user.service.js)
  - [server/src/repositories/user.repository.js](../server/src/repositories/user.repository.js)
- Frontend consumers:
  - [client/services/user-service.ts](../client/services/user-service.ts)
  - [client/providers/auth-provider.tsx](../client/providers/auth-provider.tsx)
- Database tables:
  - `users`

## `POST /api/assessments`

- Authentication: required
- Request body:
  ```json
  {
    "situation": "I lost my job and rent is due next week."
  }
  ```
- Validation:
  - `situation` required
  - trimmed length must be at least 10
- Success:
  - status `201`
  ```json
  {
    "success": true,
    "data": {
      "assessment": {
        "id": "uuid",
        "user_id": "uuid",
        "situation_text": "string",
        "stability_score": 42
      },
      "analysis": {
        "stabilityScore": 42,
        "housingRisk": "HIGH",
        "incomeRisk": "HIGH",
        "healthcareRisk": "MEDIUM",
        "overallRisk": "HIGH",
        "summary": "brief summary"
      },
      "priorities": {
        "priorities": []
      },
      "roadmap": {
        "roadmap": []
      }
    }
  }
  ```
- Errors:
  - `400 { success: false, message: "Situation must contain at least 10 characters" }`
  - `401` auth errors
  - `500 { success: false, message }`
- Backend files:
  - [server/src/routes/assessment.routes.js](../server/src/routes/assessment.routes.js)
  - [server/src/controllers/assessment.controller.js](../server/src/controllers/assessment.controller.js)
  - [server/src/services/assessment.service.js](../server/src/services/assessment.service.js)
  - [server/src/services/ai/situation-analysis.service.js](../server/src/services/ai/situation-analysis.service.js)
  - [server/src/services/ai/priority-engine.service.js](../server/src/services/ai/priority-engine.service.js)
  - [server/src/services/roadmap.service.js](../server/src/services/roadmap.service.js)
  - [server/src/services/risk.service.js](../server/src/services/risk.service.js)
  - repositories under `assessment`, `risk`, `priority`, `roadmap`
- Frontend consumers:
  - [client/services/assessment-service.ts](../client/services/assessment-service.ts)
  - [client/components/assessment/assessment-form.tsx](../client/components/assessment/assessment-form.tsx)
- Database tables:
  - `assessments`
  - `risk_assessments`
  - `priorities`
  - `roadmaps`

## `GET /api/priorities/:assessmentId`

- Authentication: required
- Request body: none
- Validation:
  - `assessmentId` from path
  - ownership enforced
- Success:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "assessment_id": "uuid",
        "priority_order": 1,
        "title": "Secure housing",
        "reasoning": "why it matters",
        "confidence_score": 95
      }
    ]
  }
  ```
- Errors:
  - `401` auth errors
  - currently controller collapses ownership `403`/`404` to `500`
- Backend files:
  - [server/src/routes/priority.routes.js](../server/src/routes/priority.routes.js)
  - [server/src/controllers/priority.controller.js](../server/src/controllers/priority.controller.js)
  - [server/src/services/ownership.service.js](../server/src/services/ownership.service.js)
  - [server/src/repositories/priority.repository.js](../server/src/repositories/priority.repository.js)
- Frontend consumers:
  - [client/services/priority-service.ts](../client/services/priority-service.ts)
  - [client/components/assessment/assessment-form.tsx](../client/components/assessment/assessment-form.tsx)
  - [client/app/(protected)/dashboard/page.tsx](../client/app/(protected)/dashboard/page.tsx)
- Database tables:
  - `assessments`
  - `priorities`

## `GET /api/roadmaps/:assessmentId`

- Authentication: required
- Request body: none
- Validation:
  - `assessmentId` from path
  - ownership enforced
- Success:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "assessment_id": "uuid",
        "timeline": "TODAY",
        "task": "Call rental assistance"
      }
    ]
  }
  ```
- Errors:
  - `401` auth errors
  - currently controller collapses ownership `403`/`404` to `500`
- Backend files:
  - [server/src/routes/roadmap.routes.js](../server/src/routes/roadmap.routes.js)
  - [server/src/controllers/roadmap.controller.js](../server/src/controllers/roadmap.controller.js)
  - [server/src/services/ownership.service.js](../server/src/services/ownership.service.js)
  - [server/src/repositories/roadmap.repository.js](../server/src/repositories/roadmap.repository.js)
- Frontend consumers:
  - [client/services/roadmap-service.ts](../client/services/roadmap-service.ts)
  - [client/components/assessment/assessment-form.tsx](../client/components/assessment/assessment-form.tsx)
  - [client/app/(protected)/roadmap/page.tsx](../client/app/(protected)/roadmap/page.tsx)
  - [client/app/(protected)/dashboard/page.tsx](../client/app/(protected)/dashboard/page.tsx)
- Database tables:
  - `assessments`
  - `roadmaps`

## `POST /api/simulations`

- Authentication: required
- Request body:
  ```json
  {
    "assessmentId": "uuid",
    "decision": "Use savings to pay rent."
  }
  ```
- Validation:
  - `assessmentId` required
  - `decision` required
  - ownership enforced on `assessmentId`
- Success:
  ```json
  {
    "success": true,
    "data": {
      "simulation": {
        "housingImpact": "HIGH",
        "incomeImpact": "MEDIUM",
        "healthImpact": "LOW",
        "summary": "brief summary",
        "recommendedAction": "next step"
      },
      "savedSimulation": {
        "id": "uuid",
        "assessment_id": "uuid",
        "decision": "Use savings to pay rent."
      }
    }
  }
  ```
- Errors:
  - `400` validator errors
  - `401` auth errors
  - currently controller collapses ownership `403`/`404` to `500`
- Backend files:
  - [server/src/routes/simulation.routes.js](../server/src/routes/simulation.routes.js)
  - [server/src/controllers/simulation.controller.js](../server/src/controllers/simulation.controller.js)
  - [server/src/services/simulation.service.js](../server/src/services/simulation.service.js)
  - [server/src/services/ownership.service.js](../server/src/services/ownership.service.js)
  - [server/src/services/ai/consequence-simulator.service.js](../server/src/services/ai/consequence-simulator.service.js)
  - [server/src/repositories/simulation.repository.js](../server/src/repositories/simulation.repository.js)
  - [server/src/repositories/risk.repository.js](../server/src/repositories/risk.repository.js)
- Frontend consumers:
  - [client/services/simulation-service.ts](../client/services/simulation-service.ts)
  - [client/components/assessment/assessment-form.tsx](../client/components/assessment/assessment-form.tsx)
  - [client/app/(protected)/progress/page.tsx](../client/app/(protected)/progress/page.tsx)
- Database tables:
  - `assessments`
  - `risk_assessments`
  - `simulations`

## `POST /api/resources/recommend`

- Authentication: required
- Request body:
  ```json
  {
    "situation": "I lost my job and need rent support.",
    "analysis": {
      "housingRisk": "HIGH",
      "incomeRisk": "HIGH",
      "healthcareRisk": "LOW",
      "overallRisk": "HIGH"
    }
  }
  ```
- Validation:
  - no explicit route validator currently
  - authenticated only
- Success:
  ```json
  {
    "success": true,
    "data": {
      "resources": [
        {
          "name": "Emergency Rental Assistance",
          "reason": "Matches immediate housing risk.",
          "priority": "HIGH"
        }
      ]
    }
  }
  ```
- Errors:
  - `401` auth errors
  - `500 { success: false, message }`
- Backend files:
  - [server/src/routes/resource.routes.js](../server/src/routes/resource.routes.js)
  - [server/src/controllers/resource.controller.js](../server/src/controllers/resource.controller.js)
  - [server/src/services/ai/resource-matching.service.js](../server/src/services/ai/resource-matching.service.js)
  - [server/src/prompts/resource-matching.prompt.js](../server/src/prompts/resource-matching.prompt.js)
  - [server/src/repositories/resource.repository.js](../server/src/repositories/resource.repository.js)
- Frontend consumers:
  - [client/services/resource-service.ts](../client/services/resource-service.ts)
  - [client/components/assessment/assessment-form.tsx](../client/components/assessment/assessment-form.tsx)
  - [client/app/(protected)/resources/page.tsx](../client/app/(protected)/resources/page.tsx)
- Database tables:
  - `resources`

## Confirmed contract caveats

- Ownership service throws `404` and `403`, but current controllers generally convert these to `500`.
- `resource-matching.prompt.js` currently asks the model for `title` and `reason`, while the frontend expects `name`, `reason`, and `priority`.
- Current frontend product state is anchored to a latest-workspace local cache, not persistent history.
