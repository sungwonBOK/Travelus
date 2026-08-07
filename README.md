# Travelus

Travelus is a Taipei-focused MVP travel curation board. A traveler sets up a
trip, curates recommended places, creates a loose itinerary, checks map
candidates, and saves the current plan in browser storage.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a production build,
run `npm run build` and then `npm start`.

Set `GOOGLE_MAPS_API_KEY` in the server environment to enable global place
discovery. This key does not enable booking or replace country-specific tourism
and offer adapters.

## Verify

```bash
npm run test:domain
npm run typecheck
npm run lint
npm run build
```

`npm run verify:mvp` runs those four checks in the same order.

## Project map

```text
src/
  app/          Next.js routes and global styling
  entities/     stable Trip and Place types
  features/     traveler capabilities and their UI
  demo/taipei/  runtime Taipei sample data for the MVP
  testing/      cross-feature domain tests
```

The main feature boundaries are:

- `recommendations`: trip setup, ranking, and Keep/Maybe/Hide actions.
- `itinerary`: route generation and the trip workspace.
- `map`: map-pin projection and the replaceable mock-map UI.
- `trip-plan`: snapshot creation, localStorage adapter, and restoration.
- `discovery`: server-only country search normalized behind provider-neutral
  records and adapters.

The shared Taipei seed is
`src/demo/taipei/sample-data.ts`. The recommendation, itinerary, map, and
trip-plan models are in their corresponding `src/features/*/model` folders.
See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for ownership rules.

## MVP scope

The current MVP uses one Taipei demo dataset and browser-local snapshot
storage. It does not require an external place API and intentionally does not
include accounts, cloud persistence, authentication, a real map provider, or a
native mobile client. Those integrations should be added only when they have a
concrete owner and replacement boundary.

## Discovery foundation boundary

Country planning can group selected discoveries by travel region and propose
nearby results and lodging areas. These are editable suggestions only: they do
not modify a saved route or accommodation choice. Itinerary generation, user
locks, and preview-before-apply replanning remain later work; official tourism
and offer adapters are separate implementation plans.

## Continuing development

Keep business behavior in feature models, stable cross-feature concepts in
`entities`, and runtime demo data out of `testing`. Preserve the `test:domain`
script name when relocating tests, add deterministic coverage for behavior
changes, and run `npm run verify:mvp` before publishing a branch.
