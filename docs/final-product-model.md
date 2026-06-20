# Final Product Model

## Goal

Civic Bridge AI should operate as a case-centered crisis guidance system, not as a loose collection of assessment screens.

The final product should help a person:

1. start a case
2. explain their situation
3. receive an initial assessment and action plan
4. work through tasks and resources over time
5. record meaningful updates
6. reassess when circumstances change
7. compare progress across snapshots
8. resolve or archive the case when stability improves

Everything in the system should support that single lifecycle.

## Core Product Principle

The long-lived object is the `case`.

Everything else exists inside or around the case:

- assessment = a snapshot
- reassessment = a later snapshot of the same case
- roadmap = a structured action plan tied to a snapshot
- resource interaction = a tracked support action for a case
- timeline event = a historical activity record
- simulation = a decision-planning artifact tied to a snapshot
- progress = a derived summary across snapshots, tasks, and resource activity

## Final User Mental Model

The user should think:

- "I have one or more cases"
- "Each case has a current condition"
- "That condition can change over time"
- "My action plan, support resources, notes, and progress belong to the case"

The user should not need to think:

- "Which assessment page created this object?"
- "Why is the roadmap separate from the case?"
- "Why does the score not match the work I already did?"

## Final Domain Model

```text
User
-> many Cases

Case
-> one current assessment
-> many assessments
-> many roadmap items
-> many resource interactions
-> many timeline events

Assessment
-> one risk analysis
-> many priorities
-> many simulations
-> optional previous assessment reference
```

### Case statuses

- `ACTIVE`
- `URGENT`
- `STABLE`
- `RESOLVED`
- `ARCHIVED`

### Assessment kinds

- `INITIAL`
- `REASSESSMENT`

### Roadmap task statuses

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`
- `BLOCKED`

### Resource interaction statuses

- `SAVED`
- `CONTACTED`
- `WAITING_FOR_RESPONSE`
- `COMPLETED`
- `REJECTED`

## Final Product Flows

## 1. Start New Case

Entry points:

- landing page CTA
- dashboard CTA
- cases page CTA

Flow:

1. user starts "New Case"
2. user describes the situation
3. emergency screening runs first
4. initial assessment is created
5. case is created
6. risk analysis is saved
7. priorities are saved
8. roadmap is saved
9. resource recommendations are loaded
10. user lands in the case workspace, not a detached result page

Result:

- new current case selected
- dashboard reflects that case immediately
- `/cases` shows the new case

## 2. Work Existing Case

Inside a case, the user can:

- review the latest summary
- update roadmap tasks
- save or contact resources
- add private notes
- run simulations
- read timeline history

This is execution work, not reassessment.

It should improve the case record, but it should not silently rewrite the official score.

## 3. Reassess Existing Case

Entry point:

- case detail page
- dashboard current case action

Flow:

1. user chooses "Update This Case"
2. user explains what changed
3. reassessment is created as a new snapshot for the same case
4. current assessment pointer moves to the new snapshot
5. previous snapshot is preserved
6. comparison data is generated
7. roadmap can be refreshed for the new condition

Result:

- current score changes only through reassessment
- historical assessment record remains intact

## 4. Resolve or Archive Case

Use `RESOLVED` when the situation is meaningfully stabilized.

Use `ARCHIVED` when the case should no longer remain in the active workspace.

Effects:

- case leaves the default active work queue
- history remains available
- timeline records the status change

## Final UX Model

## Main navigation

Primary app navigation should be:

1. Dashboard
2. Cases
3. Current Case Workspace
4. Resources
5. Progress
6. Settings

`New Assessment` should become `New Case`.

The product should stop centering isolated assessment screens and instead center:

- active case
- case history
- case workspace

## Final screen roles

### Dashboard

Purpose:

- show current selected case
- show risk snapshot
- show urgent tasks
- show blockers
- show last reassessment change
- show immediate actions

Dashboard is not the place to edit everything. It is the control center.

### Cases

Purpose:

- list all cases
- filter active, resolved, archived
- reopen any case
- create a new case

This should be the main history surface, not a hidden advanced screen.

### Case Workspace

Purpose:

- one complete case view

Sections:

- summary
- current score and risk
- comparison from previous reassessment if available
- roadmap
- resources and resource tracking
- timeline
- simulations
- reassessment action

This should be the core working screen of the product.

### Resources

Purpose:

- focus specifically on support options
- show recommendations for the selected case
- show tracked resource actions
- surface follow-up status
- generate eligibility and application guidance

### Progress

Purpose:

- show longitudinal case progress
- compare current and previous snapshots
- show execution metrics
- show simulation history
- show resolution trend

Progress must be derived from real stored state, never fabricated.

### Settings

Purpose:

- show profile
- explain consent
- explain local cache behavior
- show sign-out
- link to case history

Do not fill this page with fake preferences.

## Final Progress Rules

Progress should be split into two layers.

### Execution progress

Derived from:

- completed roadmap tasks
- in-progress tasks
- blocked tasks
- saved/contacted/completed resource interactions
- timeline activity

### Outcome progress

Derived from:

- reassessment score changes
- reassessment risk changes
- case status changes

Important rule:

- completing tasks does not directly recalculate the score
- score changes only through reassessment
- tasks influence future reassessment by changing the user's real-world situation

## Final Backend Contract Direction

The backend should become case-first.

### Keep

- `POST /api/assessments` for initial snapshot creation if needed internally
- `POST /api/assessments/safety-screening`
- timeline, roadmap, simulation, and resource interaction endpoints where useful

### Promote as primary contracts

- `POST /api/cases`
- `GET /api/cases`
- `GET /api/cases/:caseId`
- `PATCH /api/cases/:caseId`
- `POST /api/cases/:caseId/reassessments`
- `GET /api/cases/:caseId/progress`
- `GET /api/cases/:caseId/timeline`
- `POST /api/cases/:caseId/timeline-notes`
- `GET /api/cases/:caseId/resources`
- `POST /api/cases/:caseId/resource-interactions`
- `PATCH /api/resource-interactions/:interactionId`
- `GET /api/cases/:caseId/simulations`

### Final preferred workspace response

`GET /api/cases/:caseId` should be the one-source case workspace response.

It should return:

```json
{
  "case": {},
  "currentAssessment": {},
  "comparison": null,
  "analysis": {},
  "priorities": [],
  "roadmap": [],
  "resources": [],
  "resourceInteractions": [],
  "simulations": [],
  "timeline": [],
  "progressSummary": {}
}
```

That lets the frontend load one case workspace instead of stitching fragments across pages.

## Final Frontend State Direction

The backend must be the source of truth.

The frontend should only persist:

- selected case id
- short-lived workspace cache for resilience
- consent state

It should not behave like local cache is the real history source.

### Frontend state rules

1. selected case id persists locally
2. on load, selected case is revalidated against backend
3. case workspace is hydrated from backend
4. local cache is only fallback, never authority
5. creating a new case selects the new case immediately
6. reopening another case switches the full workspace immediately

## Final Database Direction

The current database structure is close, but the product should treat the schema as supporting a case lifecycle.

Required foundations:

- `users`
- `cases`
- `assessments`
- `risk_assessments`
- `priorities`
- `roadmaps`
- `simulations`
- `resources`
- `resource_interactions`
- `timeline_events`

### Database principles

1. case stores the current assessment pointer
2. assessments remain immutable snapshots
3. timeline should record meaningful state transitions
4. roadmap items should be updateable without mutating historical assessment meaning
5. resource interactions belong to cases, not isolated assessments

## Final Completion Gaps

The major incomplete areas to finish are:

1. rename and reshape UX from assessment-first to case-first
2. unify case workspace into a single primary user screen
3. expose case progress as a real backend-derived summary
4. clean controller error handling so ownership and readiness errors are not collapsed
5. standardize resource response fields across AI output, DB records, and UI types
6. define case resolution and archive behavior clearly in UI
7. reduce placeholder language and internal implementation copy
8. make reassessment and case updates feel like one continuous workflow

## Final Migration Plan

## Phase 1. Product framing

Goal:

- change language from assessment-first to case-first

Work:

- `New Assessment` -> `New Case`
- align screen titles and CTA labels
- remove UI copy that exposes implementation details
- make `Cases` first-class in navigation and onboarding

## Phase 2. Case workspace unification

Goal:

- make one complete case workspace screen

Work:

- move case detail toward the main working experience
- hydrate summary, roadmap, resources, simulations, timeline, and progress from one case response
- reduce duplicate logic across dashboard, roadmap, resources, and progress

## Phase 3. Progress model completion

Goal:

- make progress trustworthy

Work:

- add backend `progressSummary` composition
- include execution metrics and reassessment comparison
- show case trend clearly

## Phase 4. Resource workflow completion

Goal:

- make resources actionable, not informational only

Work:

- unify recommendation display
- support tracked statuses and follow-up cues
- improve resource empty state when DB is empty
- normalize `name` / `title` / contact field handling

## Phase 5. Timeline and audit trail

Goal:

- make timeline the case ledger

Work:

- record assessment creation
- reassessment creation
- roadmap updates
- resource actions
- note additions
- case status changes

## Phase 6. Contract cleanup

Goal:

- remove confusing API seams

Work:

- promote case-first routes
- keep older assessment endpoints only where they still serve an internal purpose
- standardize success and error envelopes

## Phase 7. Resolution and archive model

Goal:

- finish the case lifecycle

Work:

- resolve case action
- archive case action
- filtered case views
- active queue behavior

## Phase 8. Production hardening

Goal:

- move from working prototype to stable product

Work:

- controller error cleanup
- data-contract tests
- UI regression tests
- prompt-output normalization tests
- operational docs

## Definition Of Complete

The product should be considered complete when:

1. every user action belongs clearly to a case lifecycle
2. the user can manage multiple cases without confusion
3. reassessment is the only official score-changing path
4. dashboard always reflects the selected case
5. progress is based on stored state, not placeholders
6. resources are actionable and trackable
7. timeline explains what happened over time
8. resolved and archived cases behave predictably
9. local cache never overrides backend truth
10. no screen feels like a disconnected demo artifact

## Recommended Next Implementation Step

The next real migration should be:

1. rename and reshape `New Assessment` into `New Case`
2. make `/cases/[caseId]` the primary case workspace
3. make dashboard a summary of the selected case, not a separate assessment view
4. add backend-composed `progressSummary` to the case workspace payload
5. then reduce duplicate logic across roadmap, resources, progress, and timeline pages
