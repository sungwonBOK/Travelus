# Travelus Project Structure

Status: Approved and current

## Purpose

This document records the current folder boundaries. The existing Next.js
screen still lets a traveler set up a Taipei trip, curate places, build a loose
itinerary, view map candidates, and save or restore a snapshot. A separate
server-only discovery route now exposes normalized country-wide candidates
without replacing that curated flow.

The goal is to let each product capability grow without turning `src/app` or
one flat `src/domain` directory into a shared dumping ground.

## Target Structure

```text
src/
  app/                         # Next.js routes, layout, and global CSS only
    api/
      discovery/
        route.ts               # server-only discovery HTTP boundary
    page.tsx
    layout.tsx
    globals.css

  entities/                    # Stable business concepts shared by features
    trip/
      model/
        types.ts
    place/
      model/
        types.ts

  features/                    # Product capabilities owned end-to-end
    recommendations/
      model/                   # ranking, Keep, Maybe, Hide, explorer state
      ui/                      # RecommendationExplorer
    itinerary/
      model/                   # route generation and workspace projection
      ui/                      # TripWorkspace
    map/
      model/                   # map-pin projection
      ui/                      # map panel and visual positioning
    trip-plan/
      model/                   # snapshot creation, storage, and restoration
    discovery/
      model/                   # provider-neutral records, validation, and adapters

  demo/                        # Runtime demo seeds used by the MVP
    taipei/
      sample-data.ts

  testing/                     # Cross-feature tests and test-only helpers
    taipei-sample-data.test.ts
    domain-integration.test.ts
    core-flow.test.ts
    country-discovery.test.ts
```

## Ownership Rules

### `app/`

The App Router owns routes and composition only. A page imports feature UI;
business rules, browser-state orchestration, and reusable visual components do
not stay in this folder.

### `entities/`

Entities contain durable, business-level types such as `Trip`, `Destination`,
and `Place`. They do not import from features, React, Next.js, storage, or map
rendering code.

### `features/`

Each feature owns a recognizable traveler capability:

- `recommendations`: trip setup defaults, ranking, and Keep/Maybe/Hide actions.
- `itinerary`: route generation and the plan workspace view model.
- `map`: map candidates, pins, and the current replaceable mock-map UI.
- `trip-plan`: snapshot persistence and restoration that coordinates the
  recommendation and itinerary models.
- `discovery`: provider-neutral country search records and validation plus
  provider adapters. External payload shapes remain inside this feature.

Feature model code may use entities. The orchestrating `trip-plan` feature may
coordinate other feature models; individual entities must never depend on a
feature.

### `demo/`

The Taipei sample dataset is runtime seed data for the curated MVP flow. It is
shared by several capabilities, so it has an explicit demo boundary instead of
pretending to belong to one feature or to test-only code. Live discovery does
not mutate or replace this seed data.

### `testing/`

Cross-feature tests live here. Future narrow unit tests should be placed beside
the relevant feature model.

## Current-To-Target Mapping

| Current file | Target ownership |
| --- | --- |
| `src/app/recommendation-explorer.tsx` | `src/features/recommendations/ui/` |
| `src/app/trip-workspace.tsx` | `src/features/itinerary/ui/` |
| `src/app/mock-map-panel.tsx` and `mock-map-position.ts` | `src/features/map/ui/` |
| `src/domain/recommendation-explorer.ts` | `src/features/recommendations/model/` |
| recommendation and selection functions in `src/domain/services.ts` | `src/features/recommendations/model/` |
| route functions and `src/domain/trip-workspace.ts` | `src/features/itinerary/model/` |
| `src/domain/map-projection.ts` | `src/features/map/model/` |
| snapshot and storage functions | `src/features/trip-plan/model/` |
| shared trip/place types in `src/domain/types.ts` | `src/entities/trip/model/` and `src/entities/place/model/` |
| `src/domain/taipei-sample-data.ts` | `src/demo/taipei/sample-data.ts` |
| existing cross-feature tests | `src/testing/` |

## Migration Principles

1. Move files by capability, then update imports; do not mix behavior changes
   into the move.
2. Keep the public page behavior, snapshot schema, and npm dependencies intact.
3. Remove the temporary flat `src/domain` entry point once every application and
   test import uses its new owner.
4. Keep the `test:domain` script name during this refactor for compatibility;
   its implementation may point at the relocated test files.
5. Run domain tests, type checking, lint, and production build after each
   coherent migration slice.

## Deliberate Non-Goals

- No empty `shared/`, `repository/`, or `infrastructure/` folder yet.
- No database, authentication, or native-app migration.
- No discovery UI replacement, booking flow, or mutation of the Taipei plan.
- No new dependency or test framework.
- No change to the current mock-map replacement boundary.

These layers can be introduced when a real external service or a second client
needs them; adding them now would create ownership without behavior.
