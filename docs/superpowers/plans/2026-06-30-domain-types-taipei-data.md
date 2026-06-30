# Domain Types And Taipei Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define reusable Travelus domain types and validated Taipei MVP sample data for issue #2.

**Architecture:** Keep the domain layer UI-independent under `src/domain`. Type contracts live in `types.ts`, sample data lives in `taipei-sample-data.ts`, and a typecheck-backed contract file proves the data exposes the core Taipei scenario required by the MVP.

**Tech Stack:** Next.js, TypeScript strict mode, `npm run typecheck`, `npm run lint`, `npm run build`.

---

### Task 1: Domain Data Contract Test

**Files:**
- Create: `src/domain/taipei-sample-data.test.ts`

- [ ] **Step 1: Write the failing type contract**

```ts
import {
  taipeiAccommodationAreas,
  taipeiBundleCourses,
  taipeiMapCandidates,
  taipeiPlaces,
  taipeiRouteDraft,
  taipeiTrip,
  taipeiTripPlanSnapshot,
  taipeiUserSelections,
} from "./taipei-sample-data";

import type {
  AccommodationAreaRecommendation,
  BundleCourse,
  MapCandidate,
  Place,
  RouteDraft,
  Trip,
  TripPlanSnapshot,
  UserPlaceSelection,
} from "./types";

type Expect<T extends true> = T;

type PlaceId = (typeof taipeiPlaces)[number]["placeId"];
type CourseId = (typeof taipeiBundleCourses)[number]["courseId"];
type CandidateType = (typeof taipeiMapCandidates)[number]["candidateType"];
type RouteDay = (typeof taipeiRouteDraft)[number]["day"];

type CorePlaceIds =
  | "taipei-101-observatory"
  | "longshan-temple"
  | "shilin-night-market"
  | "yehliu-geopark"
  | "jiufen-old-street";

type _CorePlacesExist = Expect<CorePlaceIds extends PlaceId ? true : false>;
type _DayTripBundleExists = Expect<"yehliu-shifen-jiufen-day" extends CourseId ? true : false>;
type _MapCandidateMixExists = Expect<"interest" | "nearby" | "rainy_day" extends CandidateType ? true : false>;
type _FourDayRouteExists = Expect<1 | 2 | 3 | 4 extends RouteDay ? true : false>;

const trip: Trip = taipeiTrip;
const places: readonly Place[] = taipeiPlaces;
const selections: readonly UserPlaceSelection[] = taipeiUserSelections;
const courses: readonly BundleCourse[] = taipeiBundleCourses;
const accommodationAreas: readonly AccommodationAreaRecommendation[] = taipeiAccommodationAreas;
const routeDraft: readonly RouteDraft[] = taipeiRouteDraft;
const mapCandidates: readonly MapCandidate[] = taipeiMapCandidates;
const snapshot: TripPlanSnapshot = taipeiTripPlanSnapshot;

void {
  trip,
  places,
  selections,
  courses,
  accommodationAreas,
  routeDraft,
  mapCandidates,
  snapshot,
};
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run typecheck`

Expected: FAIL because `./taipei-sample-data` and `./types` do not exist yet.

### Task 2: Domain Types

**Files:**
- Create: `src/domain/types.ts`

- [ ] **Step 1: Implement the minimal reusable types**

Define `Trip`, `Place`, `UserPlaceSelection`, `BundleCourse`, `RouteDraft`, `MapCandidate`, `TripPlanSnapshot`, and supporting unions for travel style, time block, difficulty, weather sensitivity, source, and accommodation recommendations.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: FAIL because `taipei-sample-data.ts` still does not exist.

### Task 3: Taipei Sample Data

**Files:**
- Create: `src/domain/taipei-sample-data.ts`
- Create: `src/domain/index.ts`

- [ ] **Step 1: Implement sample data**

Add a 3-night, 4-day Taipei trip, at least 10 recommendation places, 3 user selections, 3 bundle courses, 3 accommodation areas, a 4-day route draft, mixed map candidates, and a versioned snapshot.

- [ ] **Step 2: Export the domain module**

Export all types and Taipei data from `src/domain/index.ts`.

- [ ] **Step 3: Verify**

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all commands pass. `npm audit --audit-level=moderate` remains a known scaffold follow-up and is not part of issue #2.
