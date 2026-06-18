# CivicBridgeAI Backend

Backend API for **CivicBridgeAI**, an AI-assisted civic support platform that analyzes a user's crisis situation, estimates risk, generates priorities, creates an actionable recovery roadmap, simulates possible decisions, and recommends civic support resources.

The server is built with **Node.js**, **Express**, **Firebase Admin**, **Supabase**, and **Google Gemini**.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Supabase Setup](#supabase-setup)
- [Installation](#installation)
- [Running the Server](#running-the-server)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [AI Workflow](#ai-workflow)
- [Database Tables](#database-tables)
- [Error Format](#error-format)
- [Development Notes](#development-notes)

## Features

- Firebase ID token authentication.
- Automatic user synchronization into Supabase.
- Crisis situation analysis using Gemini.
- Risk assessment persistence.
- AI-generated priority recommendations with persistence.
- AI-generated recovery roadmap tasks with persistence.
- Decision consequence simulation for saved assessments.
- AI-powered resource matching from the `resources` table.
- Ownership checks for assessment-scoped roadmap, priority, and simulation requests.
- Request validators for assessment creation and simulation requests.
- Layered architecture with routes, controllers, services, repositories, prompts, validators, and config modules.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Auth:** Firebase Admin SDK
- **Database:** Supabase
- **AI Provider:** Google Generative AI SDK
- **Model:** `gemini-2.5-flash`
- **Dev Server:** Nodemon

## Project Structure

```txt
server/
|-- src/
|   |-- app.js
|   |-- server.js
|   |-- config/
|   |   |-- firebase.js
|   |   |-- gemini.js
|   |   `-- supabase.js
|   |-- controllers/
|   |   |-- assessment.controller.js
|   |   |-- priority.controller.js
|   |   |-- resource.controller.js
|   |   |-- roadmap.controller.js
|   |   `-- simulation.controller.js
|   |-- middleware/
|   |   `-- auth.middleware.js
|   |-- prompts/
|   |   |-- priority.prompt.js
|   |   |-- resource-matching.prompt.js
|   |   |-- roadmap.prompt.js
|   |   |-- simulation.prompt.js
|   |   `-- situation-analysis.prompt.js
|   |-- repositories/
|   |   |-- assessment.repository.js
|   |   |-- priority.repository.js
|   |   |-- resource.repository.js
|   |   |-- risk.repository.js
|   |   |-- roadmap.repository.js
|   |   |-- simulation.repository.js
|   |   `-- user.repository.js
|   |-- routes/
|   |   |-- assessment.routes.js
|   |   |-- priority.routes.js
|   |   |-- resource.routes.js
|   |   |-- roadmap.routes.js
|   |   |-- simulation.routes.js
|   |   |-- test.routes.js
|   |   `-- user.routes.js
|   |-- services/
|   |   |-- ai/
|   |   |   |-- consequence-simulator.service.js
|   |   |   |-- priority-engine.service.js
|   |   |   |-- resource-matching.service.js
|   |   |   |-- roadmap-generator.service.js
|   |   |   `-- situation-analysis.service.js
|   |   |-- assessment.service.js
|   |   |-- ownership.service.js
|   |   |-- priority.service.js
|   |   |-- risk.service.js
|   |   |-- roadmap.service.js
|   |   |-- simulation.service.js
|   |   `-- user.service.js
|   `-- validators/
|       |-- assessment.validator.js
|       `-- simulation.validator.js
|-- .env
|-- package.json
|-- package-lock.json
`-- serviceAccountKey.json
```

## Prerequisites

Before running the backend, make sure you have:

- Node.js installed.
- A Firebase project with Authentication enabled.
- A Firebase service account key.
- A Supabase project.
- A Google Gemini API key.

## Environment Variables

Create a `.env` file inside the `server/` directory.

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### Variable Details

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Port used by the Express server. Defaults to `5000`. |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key used by the backend. Keep this secret. |
| `GEMINI_API_KEY` | Yes | API key for Google Gemini requests. |

> Do not expose `.env`, `SUPABASE_SERVICE_ROLE_KEY`, or `serviceAccountKey.json` in frontend code or public repositories.

## Firebase Setup

The backend uses Firebase Admin to verify client ID tokens.

1. Open Firebase Console.
2. Go to **Project Settings**.
3. Open **Service Accounts**.
4. Generate a new private key.
5. Save the downloaded JSON file as:

```txt
server/serviceAccountKey.json
```

The Firebase config is loaded from `src/config/firebase.js`.

## Supabase Setup

The backend uses Supabase as the persistence layer. The current repositories expect these tables:

- `users`
- `assessments`
- `risk_assessments`
- `priorities`
- `roadmaps`
- `simulations`
- `resources`

The server connects to Supabase through `src/config/supabase.js` using the service role key.

## Installation

From the `server/` directory, install dependencies:

```bash
npm install
```

## Running the Server

### Development

```bash
npm run dev
```

This starts the server with Nodemon.

### Production

```bash
npm start
```

By default, the server runs on:

```txt
http://localhost:5000
```

## Authentication

Protected endpoints require a Firebase ID token in the `Authorization` header:

```http
Authorization: Bearer <firebase_id_token>
```

The auth middleware:

1. Reads the bearer token from the request header.
2. Verifies it with Firebase Admin.
3. Syncs the Firebase user into the Supabase `users` table.
4. Attaches the decoded Firebase user to `req.user`.
5. Attaches the database user record to `req.dbUser`.

If authentication fails, the server returns `401 Unauthorized`.

## API Endpoints

Base URL:

```txt
http://localhost:5000/api
```

All routes below are mounted in `src/app.js`.

### Get Current User

Returns the authenticated Firebase user and the synced Supabase user.

```http
GET /api/users/me
```

### Create Assessment

Analyzes a user's situation, stores the assessment, creates a risk record, generates priorities, saves priorities, and creates roadmap tasks.

```http
POST /api/assessments
```

#### Request Body

```json
{
  "situation": "I lost my job, rent is due next week, and I do not have health insurance."
}
```

`situation` must contain at least 10 characters.

#### Success Response

```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "assessment-id",
      "user_id": "user-id",
      "situation_text": "I lost my job...",
      "stability_score": 42
    },
    "analysis": {
      "stabilityScore": 42,
      "housingRisk": "HIGH",
      "incomeRisk": "HIGH",
      "healthcareRisk": "MEDIUM",
      "overallRisk": "HIGH",
      "summary": "The user is facing immediate income and housing instability."
    },
    "priorities": {
      "priorities": [
        {
          "order": 1,
          "title": "Secure emergency housing support",
          "reasoning": "Rent is due soon and housing risk is high.",
          "confidence": 95
        }
      ]
    },
    "roadmap": {
      "roadmap": [
        {
          "timeline": "TODAY",
          "task": "Contact local emergency rental assistance programs."
        }
      ]
    }
  }
}
```

### Get Roadmap by Assessment

Returns saved roadmap tasks for a specific assessment. The assessment must belong to the authenticated user.

```http
GET /api/roadmaps/:assessmentId
```

#### Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": "roadmap-task-id",
      "assessment_id": "assessment-id",
      "timeline": "TODAY",
      "task": "Apply for emergency housing support"
    }
  ]
}
```

### Get Priorities by Assessment

Returns saved priority recommendations for a specific assessment. The assessment must belong to the authenticated user.

```http
GET /api/priorities/:assessmentId
```

#### Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": "priority-id",
      "assessment_id": "assessment-id",
      "priority_order": 1,
      "title": "Secure emergency housing support",
      "reasoning": "Rent is due soon and housing risk is high.",
      "confidence_score": 95
    }
  ]
}
```

### Create Decision Simulation

Simulates the likely impact of a proposed decision for a saved assessment. The assessment must belong to the authenticated user.

```http
POST /api/simulations
```

#### Request Body

```json
{
  "assessmentId": "assessment-id",
  "decision": "Use my remaining savings to pay rent before applying for assistance."
}
```

Both `assessmentId` and `decision` are required.

#### Success Response

```json
{
  "success": true,
  "data": {
    "simulation": {
      "housingImpact": "Expected housing effect",
      "incomeImpact": "Expected income effect",
      "healthImpact": "Expected health effect",
      "summary": "Overall consequence summary",
      "recommendedAction": "Suggested next action"
    },
    "savedSimulation": {
      "id": "simulation-id",
      "assessment_id": "assessment-id",
      "decision": "Use my remaining savings to pay rent before applying for assistance."
    }
  }
}
```

### Recommend Resources

Uses the user's situation, analysis, and all rows from the `resources` table to generate matched support resources.

```http
POST /api/resources/recommend
```

#### Request Body

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

#### Success Response

```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "name": "Emergency Rental Assistance",
        "reason": "Matches the user's immediate housing risk.",
        "priority": "HIGH"
      }
    ]
  }
}
```

### Test Protected Route

`src/routes/test.routes.js` defines this route, but it is not currently mounted in `src/app.js`.

```http
GET /protected
```

## AI Workflow

When a client creates an assessment, the backend runs this pipeline:

1. `assessment.controller.js` receives the authenticated request.
2. `assessment.validator.js` validates the submitted `situation`.
3. `assessment.service.js` sends the situation to Gemini for analysis.
4. `situation-analysis.service.js` uses `situation-analysis.prompt.js`.
5. The assessment is saved to the `assessments` table.
6. Risk data is saved to the `risk_assessments` table.
7. `priority-engine.service.js` generates the top priorities.
8. `priority.service.js` saves priorities to the `priorities` table.
9. `roadmap-generator.service.js` generates roadmap tasks.
10. Roadmap tasks are saved to the `roadmaps` table.
11. The full assessment result is returned to the client.

### Additional AI Flows

- `consequence-simulator.service.js` uses `simulation.prompt.js` to simulate decisions and stores results in `simulations`.
- `resource-matching.service.js` uses `resource-matching.prompt.js` to match available resources to the user's situation and analysis.
- AI services strip Markdown code fences before parsing JSON responses.

### Expected AI JSON Formats

#### Situation Analysis

```json
{
  "stabilityScore": 50,
  "housingRisk": "LOW|MEDIUM|HIGH",
  "incomeRisk": "LOW|MEDIUM|HIGH",
  "healthcareRisk": "LOW|MEDIUM|HIGH",
  "overallRisk": "LOW|MEDIUM|HIGH",
  "summary": "brief summary"
}
```

#### Priorities

```json
{
  "priorities": [
    {
      "order": 1,
      "title": "Priority title",
      "reasoning": "Why this matters",
      "confidence": 95
    }
  ]
}
```

#### Roadmap

```json
{
  "roadmap": [
    {
      "timeline": "TODAY",
      "task": "Apply for emergency housing support"
    }
  ]
}
```

#### Decision Simulation

```json
{
  "housingImpact": "Expected housing effect",
  "incomeImpact": "Expected income effect",
  "healthImpact": "Expected health effect",
  "summary": "Overall consequence summary",
  "recommendedAction": "Suggested next action"
}
```

#### Resource Matching

```json
{
  "resources": [
    {
      "name": "Resource name",
      "reason": "Why this resource is relevant",
      "priority": "LOW|MEDIUM|HIGH"
    }
  ]
}
```

## Database Tables

The exact schema may vary, but the current code expects at least the following columns.

### `users`

| Column | Purpose |
| --- | --- |
| `id` | Primary user ID used by Supabase. |
| `firebase_uid` | Firebase Authentication UID. |
| `email` | User email from Firebase. |
| `name` | User display name, if available. |

### `assessments`

| Column | Purpose |
| --- | --- |
| `id` | Primary assessment ID. |
| `user_id` | References the Supabase user. |
| `situation_text` | Original situation submitted by the user. |
| `stability_score` | Numeric stability score returned by Gemini. |

### `risk_assessments`

| Column | Purpose |
| --- | --- |
| `id` | Primary risk assessment ID. |
| `assessment_id` | References the assessment. |
| `housing_risk` | Housing risk level. |
| `income_risk` | Income risk level. |
| `healthcare_risk` | Healthcare risk level. |
| `overall_risk` | Overall crisis risk level. |

### `priorities`

| Column | Purpose |
| --- | --- |
| `id` | Primary priority ID. |
| `assessment_id` | References the assessment. |
| `priority_order` | Priority order. |
| `title` | Priority title. |
| `reasoning` | Explanation for the priority. |
| `confidence_score` | AI confidence score. |

### `roadmaps`

| Column | Purpose |
| --- | --- |
| `id` | Primary roadmap task ID. |
| `assessment_id` | References the assessment. |
| `timeline` | Suggested timeline, such as `TODAY` or `THIS_WEEK`. |
| `task` | Actionable task text. |

### `simulations`

| Column | Purpose |
| --- | --- |
| `id` | Primary simulation ID. |
| `assessment_id` | References the assessment. |
| `decision` | User's proposed decision. |
| `housing_impact` | Simulated housing impact. |
| `income_impact` | Simulated income impact. |
| `health_impact` | Simulated health impact. |
| `summary` | Overall simulation summary. |
| `recommended_action` | Suggested next action. |

### `resources`

| Column | Purpose |
| --- | --- |
| `id` | Primary resource ID. |
| `name` | Resource name. |
| `description` | Resource details used by resource matching. |
| `category` | Resource category, if available. |
| `eligibility` | Eligibility notes, if available. |
| `contact` | Contact or access information, if available. |

## Error Format

Most errors follow this response shape:

```json
{
  "success": false,
  "message": "Error message"
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `201` | Assessment created successfully. |
| `200` | Request completed successfully. |
| `400` | Validation error, such as missing or too-short request fields. |
| `401` | Missing, invalid, or expired Firebase token. |
| `500` | Server, database, ownership, or AI provider error. |

## Development Notes

- `src/app.js` registers user, assessment, roadmap, simulation, priority, and resource routes.
- `src/server.js` loads environment variables and starts the HTTP server.
- `src/middleware/auth.middleware.js` protects routes and syncs users.
- `src/services/ownership.service.js` checks assessment ownership before returning assessment-scoped data.
- `src/config/gemini.js` configures the Gemini model.
- `src/routes/test.routes.js` exists but is not currently mounted in `src/app.js`.
- `src/routes/resource.routes.js` imports `assessment.validator.js`, but the resource route does not currently use it.
- There is currently no automated test script configured in `package.json`.

## Useful Commands

```bash
npm install
npm run dev
npm start
```

## Security Checklist

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Keep `serviceAccountKey.json` out of Git.
- Validate user input before expanding public usage.
- Add rate limiting before production deployment.
- Add stricter CORS configuration for production domains.
- Keep ownership checks on all assessment-scoped reads and writes.
