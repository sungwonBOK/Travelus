# Travelus MVP Design

Date: 2026-06-30
Status: Approved for planning

## 1. Product Direction

Travelus is a mobile-first web app for beginner free travelers who want help choosing places and building a flexible route without feeling locked into a strict timetable.

The first MVP validates the core product experience:

- Show what is worth doing in a destination.
- Let the user classify recommendations as must-go, interested, or excluded.
- Generate a loose route by day and time block.
- Keep extra candidates on a map-like surface for flexible decisions during the trip.
- Save the plan locally without account friction.

The product should feel like a travel curation board, not a rigid itinerary planner.

## 2. Confirmed MVP Scope

### Scenario

The MVP uses a sample scenario:

- Destination: Taipei
- Trip length: 3 nights, 4 days
- Target user: beginner free traveler
- Platform: mobile-first responsive web/PWA-style experience

Taipei is the first demo city because it supports the important MVP cases: city sightseeing, night markets, sunset timing, nearby day trips, accommodation area recommendations, and bundled routes such as Yehliu/Shifen/Jiufen.

### Included

- Quick trip start flow
- Taipei recommendation feed
- Recommendation card actions: keep, maybe, hide
- Picked-place review
- Bundle course recommendations
- Accommodation area recommendation
- Loose route generation
- Daily route view
- Mock map panel with route pins and candidate pins
- Local plan save
- Data and service boundaries prepared for future APIs

### Excluded

- Real-time replanning
- Multi-user collaboration
- Login and account system
- Database persistence
- Real map API integration
- Real Places/Routes API integration
- AI-generated recommendations
- Booking, affiliate checkout, or payment flows

## 3. Chosen Approach

The selected approach is an extensible domain demo.

The app will use Next.js, TypeScript, and Tailwind CSS. Initial data will be sample JSON bundled with the app, and user state will be stored in browser state/localStorage. The code should still define domain types and service boundaries from the beginning so future integrations can replace the mock implementation without rewriting the UI.

Rejected alternatives:

- Click-only demo: faster, but creates throwaway code and weakens future API migration.
- Full-stack from day one: structurally stronger, but too much scope before validating the core Travelus UX.

## 4. UX Structure

The selected flow is:

1. Guided start
2. Recommendation exploration
3. Editable trip workspace

The first screen asks for only the necessary trip setup:

- Destination
- Trip length
- Companion count
- Travel style

After setup, the app moves into a workspace with three primary areas:

- Plan: loose route by day and time block
- Map: route pins plus extra candidates
- Saved: must-go and interested places

This keeps onboarding simple while preserving the feeling that the user can change the plan at any time.

## 5. Main Screens

### Start

Purpose: make planning feel low-friction.

Content:

- Brand and core message: "자유여행은 그대로, 계획 부담만 줄여요."
- Destination input defaulting to Taipei for the MVP
- Trip duration set to 3 nights, 4 days for the demo scenario
- Companion count
- Travel style chips
- Primary action: start recommendations

### Recommendations

Purpose: help users discover useful Taipei options before they know what to search for.

Card actions:

- Keep: route generation priority
- Maybe: saved as map candidate
- Hide: removed from recommendations and route generation

Card content:

- Name
- Category
- Image or visual placeholder
- Recommended time block
- Estimated stay time
- Difficulty
- Recommendation reason
- Source/confidence metadata if available in sample data

### Bundle Courses

Purpose: handle complex or high-friction travel segments as optional packaged route units without making the app feel like a package-tour seller.

Example bundle courses:

- Yehliu, Shifen, Jiufen day course
- Tamsui sunset half-day course
- Taipei night market food route

Bundle course fields:

- Duration
- Difficulty
- Transport complexity
- Free-travel suitability
- Tour recommendation score
- Recommended day/time placement

### Accommodation

Purpose: recommend a good stay area based on selected places.

For MVP, this is sample-data driven rather than API driven.

Example areas:

- Ximending / Taipei Main Station
- Zhongshan
- Daan / Dongmen

Evaluation criteria:

- Average access to selected places
- Airport/station access
- Night return convenience
- Beginner suitability
- Fit with selected travel style

### Route

Purpose: show a loose route, not a strict timetable.

Time blocks:

- Morning
- Lunch
- Afternoon
- Sunset
- Evening

Each day shows:

- Main route theme
- Time block items
- Difficulty
- Estimated movement burden
- Why this flow is recommended
- Free-time suggestions

### Mock Map

Purpose: validate the map candidate UX without depending on a real map API.

The mock map panel should display:

- Main route pins
- Interested candidates
- Nearby candidates
- Rainy-day alternatives

The data model still includes coordinates so a real map component can replace the mock panel later.

## 6. Domain Model

The MVP should define these core types.

### Trip

Represents the user's travel setup.

Important fields:

- tripId
- destination
- startDate
- endDate
- durationDays
- companionCount
- travelStyles
- accommodationStatus
- selectedAccommodationArea

### Place

Represents a recommendation candidate.

Important fields:

- placeId
- name
- category
- area
- coordinates
- openingHours
- recommendedTimeTags
- averageStayMinutes
- difficulty
- beginnerScore
- weatherSensitivity
- timeSensitivity
- priceLevel
- source
- confidenceScore

### UserPlaceSelection

Represents how the user classified a place.

Selection types:

- must_go
- interested
- excluded

Important fields:

- selectionId
- tripId
- placeId
- selectionType
- priority
- userNote

### BundleCourse

Represents a multi-place route unit.

Important fields:

- courseId
- destination
- title
- type
- durationMinutes
- difficulty
- beginnerScore
- transportComplexity
- freeTravelScore
- tourRecommendationScore
- includedPlaceIds
- recommendedTimeBlock
- recommendedDayPosition
- affiliateAvailable

### RouteDraft

Represents generated route items.

Important fields:

- routeId
- tripId
- day
- timeBlock
- itemType
- placeId
- courseId
- recommendedReason
- travelTimeToNextMinutes
- difficultyScore
- isLocked

### MapCandidate

Represents a non-primary candidate shown on the mock map.

Candidate types:

- interest
- nearby
- rainy_day
- rest
- cafe
- food
- shopping

Important fields:

- candidateId
- tripId
- placeId
- candidateType
- relatedRouteDay
- distanceFromRoute
- estimatedDetourMinutes
- recommendationReason
- weatherCondition

### TripPlanSnapshot

Represents a saveable/exportable state object.

It should include:

- Trip setup
- User selections
- Selected bundle courses
- Accommodation choice
- Route draft
- Map candidates
- Save metadata

The first implementation stores this snapshot in localStorage. Later, the same shape can be sent to an API.

## 7. Service Boundaries

The app should separate UI from domain logic with lightweight services.

### recommendationService

Responsibilities:

- Load Taipei sample recommendations.
- Filter by destination and travel style.
- Remove excluded places.
- Sort cards using static score fields.

### selectionService

Responsibilities:

- Apply keep/maybe/hide actions.
- Change selection type.
- Preserve selection priority.

### bundleCourseService

Responsibilities:

- Load sample bundle courses.
- Recommend bundle courses based on selected places and trip style.
- Mark selected bundle courses for route generation.

### accommodationService

Responsibilities:

- Recommend Taipei stay areas from sample data.
- Score areas based on selected places and scenario metadata.

### routeService

Responsibilities:

- Generate loose route drafts from selections and selected bundle courses.
- Assign items to day and time block.
- Compute basic difficulty and movement burden.
- Keep route generation deterministic for testing.

### mapService

Responsibilities:

- Convert route and selections into mock map pins.
- Separate main route, interested, nearby, and rainy-day candidates.
- Preserve coordinates for future real map integration.

### storageService

Responsibilities:

- Save and load TripPlanSnapshot from localStorage.
- Version saved snapshots.
- Provide a future replacement point for server persistence.

## 8. Route Generation Rules

The first route algorithm should be deterministic and simple.

Rules:

- `must_go` places are route-generation priorities.
- `interested` places stay as map candidates unless manually promoted.
- `excluded` places are removed from recommendations and routes.
- Places with recommended time tags should prefer matching blocks.
- Bundle courses may occupy a full day or half day.
- Each day should avoid excessive visit count.
- Difficulty should consider visit count, walking burden, transport complexity, late return, and bundle course difficulty.
- Route output should always be editable by the user.

The initial algorithm is not expected to produce globally optimal routes. It only needs to generate plausible, low-pressure travel flows for the Taipei demo.

## 9. Persistence

Initial persistence:

- localStorage only
- no login
- no database

The localStorage value should be a versioned TripPlanSnapshot.

This keeps the MVP fast while avoiding a dead-end data shape.

## 10. Testing And Validation

Initial validation should focus on the domain logic and the user flow.

Recommended checks:

- TypeScript typecheck
- Lint/build check
- Unit tests for routeService and selectionService
- Smoke test for the core flow:
  1. Start Taipei trip
  2. Keep several places
  3. Mark some as interested
  4. Exclude one place
  5. Generate route
  6. Confirm map candidates appear
  7. Save and reload snapshot

## 11. Risks

### It may feel too much like an itinerary planner.

Mitigation:

- Avoid minute-by-minute schedules.
- Use "center route", "suggested flow", and "free time" language.
- Keep interested candidates visible outside the fixed route.

### Mock map may underrepresent real map complexity.

Mitigation:

- Keep coordinates in the data model.
- Isolate map rendering behind mapService and a map component boundary.

### Rule-based routing may feel simplistic.

Mitigation:

- Limit the first scenario to Taipei 3 nights, 4 days.
- Keep the route algorithm transparent and deterministic.
- Treat AI recommendation as a later replacement, not a prerequisite.

### Feature count may make the MVP feel heavy.

Mitigation:

- Keep the UI sequence guided.
- Hide advanced details behind secondary panels.
- Prioritize the recommendation, selection, loose route, and map candidate loop.

## 12. Next Step

After this design is accepted, create an implementation plan. The implementation plan should cover project scaffolding, sample data creation, domain types, services, screens, localStorage, and verification.

## 13. Initial GitHub Issue Backlog

Use GitHub issues to track the MVP in implementation-sized slices.

Recommended initial issues:

1. Scaffold Next.js, TypeScript, and Tailwind project
2. Define Travelus domain types and sample Taipei data
3. Implement recommendation, selection, and storage services
4. Implement rule-based loose route generation
5. Build guided start and recommendation exploration screens
6. Build editable trip workspace: Plan, Map, Saved
7. Build mock map panel with route and candidate pins
8. Add localStorage TripPlanSnapshot persistence
9. Add verification checks and core-flow smoke test
10. Prepare implementation README with run and validation steps
