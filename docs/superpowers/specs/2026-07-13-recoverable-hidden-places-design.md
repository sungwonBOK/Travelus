# Recoverable Hidden Places Design

Date: 2026-07-13
Status: Approved direction, pending written-spec review

## Context

The recommendation explorer currently removes an `excluded` place from the visible feed as soon as the user presses `Hide`. Excluded places correctly stay out of route generation and map candidates, but the UI gives the user no way to reconsider that decision later.

Travelus is a flexible travel curation board. Hiding should reduce clutter without behaving like permanent deletion.

## Chosen UX

Keep `Hide` on each recommendation card. After a place is hidden:

- Remove it from the main recommendation feed.
- Keep its existing `excluded` domain selection so it remains outside Plan, Map, and Saved.
- Show it in a collapsed `숨긴 장소 N` section below the recommendation feed.
- Let the user expand the section and choose `다시 보기`, `Keep`, or `Maybe` for each hidden place.

`다시 보기` removes the place selection and returns the card to the normal recommendation feed. `Keep` changes it to `must_go`; `Maybe` changes it to `interested`. All three actions persist through the existing `TripPlanSnapshot` localStorage flow.

## Alternatives Considered

### Undo toast only

This handles accidental taps immediately but does not help when the user changes their mind much later.

### Keep hidden cards dimmed in the main feed

This makes recovery obvious but leaves the feed cluttered, undermining the purpose of Hide.

### Top-level hidden filter

This scales to a larger product but is less discoverable and adds filter-state complexity that the MVP does not need.

## Domain Design

Preserve the existing `SelectionType` values and route rules. Do not add a new persistence schema or a fourth selection type.

Extend the recommendation action boundary with a restore action that removes the matching `UserPlaceSelection`. Derive the hidden-place list from `excluded` selections plus the existing Taipei place data; do not duplicate hidden places in state.

This keeps one source of truth:

- no selection: visible, undecided recommendation
- `must_go`: Keep
- `interested`: Maybe
- `excluded`: hidden drawer, excluded from route and map

## UI Design

Use a native disclosure control or an equivalently accessible collapsed section below the main recommendation cards.

The collapsed label is `숨긴 장소 N`. When expanded, each compact place row shows the place name, area, and three actions:

- `다시 보기`
- `Keep`
- `Maybe`

The section is absent when no places are hidden. Restoring a place immediately removes it from the hidden section and returns it to the correctly ranked recommendation feed.

## Error And Persistence Behavior

No new error channel is required. The feature reuses existing deterministic selection updates and the current snapshot persistence boundary.

A restored snapshot containing `excluded` selections must recreate the hidden section after refresh. Invalid snapshots continue to fall back to the default explorer state under the existing loader validation.

## Testing

Add focused domain tests that prove:

- Hide removes a place from the main recommendations and exposes it as hidden.
- `다시 보기` removes the excluded selection and returns the place to recommendations.
- Keep and Maybe promote a hidden place without creating duplicate selections.
- Snapshot round-trip preserves hidden places and restores their recovery actions.

Keep UI wiring thin and verify it with typecheck, lint, build, and a manual mobile smoke check.

## Non-goals

- No new dependency.
- No database or account persistence.
- No route-rule changes for excluded places.
- No undo toast, bulk restore, hidden-place search, or extra filter state in this slice.
- No native-app migration as part of this change.
