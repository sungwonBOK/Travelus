# Country-First Travel Discovery Design

Date: 2026-08-07
Status: Approved for implementation planning

## Product Goal

Travelus helps a traveler plan a multi-region trip within one country. The
traveler starts by browsing or searching the whole country, then saves the
places, broad travel areas, experiences, and bookable offers they want. The
app groups those choices by practical travel region, suggests nearby additions
and lodging areas, and proposes a loose itinerary.

The itinerary is always a user-controlled proposal. A traveler can change its
dates, order, regions, lodging, or items; Travelus keeps explicitly fixed work
and offers a preview of any recalculation instead of overwriting the plan.

## Scope

### Included

- A country-first discovery entry point rather than a fixed Taipei-only trip.
- Search and recommendations across places, broad areas/themes, experiences,
  events, and bookable offers.
- Provider adapters that normalize external results into Travelus-owned types.
- Selection-driven region grouping, nearby suggestions, lodging-area
  suggestions, and a loose multi-region itinerary proposal.
- User locks, manual additions, and preview-before-apply replanning.
- Evidence metadata: provider, provider record ID, source URL, and fetched-at
  timestamp on externally supplied facts.

### Excluded from the first slice

- In-app booking, payment, or reservation management; offers link out to the
  provider.
- A second live place provider or automatic cross-provider record merging.
- Authentication, shared editing, database-backed long-term sync, and native
  client work.
- Scraping Google, Naver, Klook, or other websites. Integrations use an
  approved API, feed, or affiliate mechanism only.

## Data Boundaries

```text
Country
  └─ TravelRegion
       └─ Discoverable item
            ├─ Place             (restaurant, museum, landmark)
            ├─ TravelArea        (valley, night market, neighborhood, park)
            ├─ ExperienceOrEvent (rafting, festival, guided tour)
            └─ BookableOffer     (provider-specific product)

Each external fact carries SourceEvidence.
```

`TravelArea` is deliberately not a `Place`: it can have a bounding area or
anchor point, contain multiple places, and be seasonal or theme-based. A
`BookableOffer` references an experience or area but independently owns its
price, availability, provider URL, and last checked time.

`SourceEvidence` records the provider name, external ID, canonical source URL,
fetched-at time, and the fields received. It lets the UI state where a fact
came from and prevents the application from presenting stale or unknown data
as verified.

## Provider Roles

The application owns a small provider interface; UI, recommendation, and
itinerary models never receive raw third-party payloads.

- Global place provider: search ordinary places and geographic POIs, returning
  coordinates, hours, ratings, review counts, categories, and details.
- Official tourism provider: add country-specific areas, attractions, courses,
  and time-bound events where available.
- Offer provider: add bookable activities and packages through an approved
  affiliate/API/feed integration.

The first live implementation uses one global place adapter. Official tourism
and offer adapters are independent optional capabilities: a country can still
return useful place results while one of those providers is unavailable.

Before enabling live data, product operations must select the pilot country
and supply authorized provider credentials. Provider credentials remain
server-side; tests use deterministic fixtures instead of live requests.

## User Flow

```text
Choose country + dates + travel styles
  → browse/search country-wide results
  → Keep / Maybe / Hide items
  → group chosen items by region and travel feasibility
  → show nearby additions and lodging-area candidates
  → generate a loose itinerary proposal
  → user edits or locks items
  → preview a constrained replan before applying it
```

A result card explains both recommendation fit and source evidence. Offers are
visibly distinct from destinations and link to the external booking provider.

## Replanning Rules

An itinerary item can be `flexible` or `locked`. Manual additions and explicit
date/time/region/lodging decisions start locked unless the traveler marks them
flexible.

- Local edit: re-evaluate only nearby flexible items.
- Replan remaining: preserve all locked items and recompute only flexible
  items and gaps.
- New draft: produce a comparison proposal without mutating the current plan.
- Applying a proposal is explicit. No provider refresh or recommendation run
  changes the saved itinerary automatically.

## Failure and Freshness Rules

- A provider failure leaves the current plan and prior user selections intact.
- Missing results are displayed as unavailable, never fabricated.
- Time-sensitive event and offer data is marked for recheck after its freshness
  window; it does not silently change a saved plan.
- Conflicting facts retain their separate evidence. The UI identifies the
  provider rather than pretending the values are one verified fact.

## Verification Strategy

Add deterministic tests for:

1. Provider payload normalization into `Place`, `TravelArea`,
   `ExperienceOrEvent`, and `BookableOffer` plus `SourceEvidence`.
2. Country-wide selections grouping into travel regions without requiring the
   traveler to choose regions first.
3. Nearby and lodging recommendations using the resulting selected-region
   groups.
4. Locked and manually added itinerary items surviving local and full replans.
5. A replan preview leaving the current plan unchanged until explicitly
   applied.
6. Partial provider failure and stale data retaining selections and saved
   plans while accurately reporting unavailable/recheckable results.

Run `npm run test:domain`, `npm run typecheck`, `npm run lint`, and `npm run
build` before publishing.

## Acceptance Criteria

- A traveler can start with a country and select candidates from more than one
  region before any regional itinerary is proposed.
- Broad areas such as valleys and night markets remain first-class results.
- Product offers remain separate from destinations and show their source and
  freshness.
- Any automatic itinerary change is presented as a preview and never overrides
  user locks.
- Live integrations are server-side and replaceable without changing feature
  UI or itinerary logic.
