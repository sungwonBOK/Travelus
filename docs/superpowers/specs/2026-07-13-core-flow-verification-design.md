# Core Flow Verification Design

Date: 2026-07-13
Status: Approved direction, pending written-spec review

## Context

Travelus already implements the Taipei recommendation, selection, route, map,
and versioned snapshot behaviors that make up the MVP's primary flow. The
current domain suite verifies those pieces separately, but it does not provide
one automated check that connects them in user order or a single command that
runs the complete local quality gate.

Issue #9 requires an automated smoke test for the complete flow, output that
identifies the broken stage, and verification that includes type checking and
the production build. GitHub Actions are not configured, so the local command
is the authoritative MVP quality gate for this slice.

## Chosen Approach

Create a focused `src/domain/core-flow.test.ts` file. It will execute one parent
scenario with seven named, sequential subtests:

1. start the default Taipei trip;
2. classify multiple places as Keep;
3. classify multiple places as Maybe;
4. hide one place;
5. generate the route workspace;
6. verify map candidates and pins;
7. save, load, and restore a versioned snapshot.

Each subtest name will include its stage number and behavior. Node's test output
will therefore identify the broken stage without adding a custom reporter.
The scenario will use the real explorer, workspace, storage, and snapshot
boundaries with a deterministic in-memory storage adapter.

Update `test:domain` to run both the existing service tests and the new core
flow test explicitly. Add `verify:mvp` as the aggregate command:

```text
test:domain -> typecheck -> lint -> build
```

No production module or dependency will change.

## Alternatives Considered

### Add the scenario to `services.test.ts`

This produces the smallest file diff, but the existing test file already
covers many independent behaviors. A separate smoke-test file makes ownership
and failures easier to find while still using the same built-in test runner.

### Add a browser end-to-end framework

Browser automation would exercise rendered UI, but it requires extra tooling,
adds environmental fragility, and exceeds this issue's domain verification
scope. The existing manual UI smoke evidence remains separate from this
deterministic regression gate.

### Add a custom verification program

A standalone script could print custom step messages, but it would duplicate
the test runner's assertion and reporting responsibilities. Named `node:test`
subtests provide the required diagnostics with less code.

## Scenario State And Data Flow

The parent test owns a single explorer state and advances it through the same
public functions used by the application:

```text
createRecommendationExplorerState
  -> applyRecommendationAction (Keep, Maybe, Hide)
  -> createTripWorkspaceView (route and map projections)
  -> createTripPlanSnapshot
  -> createTripPlanStorage.save/load
  -> restoreRecommendationExplorerState
```

The assertions will prove that:

- the default trip is Taipei, four days, and has recommendations;
- at least two Keep selections become `must_go`;
- at least two Maybe selections become `interested`;
- the hidden selection becomes `excluded` and disappears from recommendations;
- Keep selections appear in the generated route while the hidden place does not;
- Maybe selections produce map candidates, and map pins have finite coordinates;
- the loaded snapshot uses schema version 1 and the restored state preserves all
  Keep, Maybe, and Hide classifications.

The test uses fixed place IDs and a fixed `savedAt` timestamp, so output remains
deterministic.

## Failure And Error Behavior

The test will not catch assertion errors or replace them with generic messages.
Each numbered subtest will surface its own assertion diff and stage label. The
storage round trip must fail if saving, parsing, schema validation, or restoration
stops preserving the scenario state.

The aggregate `verify:mvp` command uses shell short-circuiting. It stops on the
first failing command, preserving the responsible command's native diagnostics.

## TDD And Verification

This issue adds regression coverage for existing production behavior rather
than new runtime behavior. The RED evidence is the missing `verify:mvp` command
and the fact that the current `test:domain` runner cannot execute the new test
file. After adding the test first, runner and script wiring will be the minimum
implementation needed to make the requested automated entry points work. No
artificial production change or intentionally false domain assertion will be
introduced solely to manufacture a failure.

Focused verification will run the new compiled smoke test and then
`npm run test:domain`. Completion requires fresh successful runs of:

```text
npm run test:domain
npm run typecheck
npm run lint
npm run build
```

The final review will also run `git diff --check`, inspect the complete diff,
and confirm that `package.json` contains no dependency changes.

## Non-goals

- No production dependency or test framework.
- No production behavior or public interface change.
- No browser automation or native-app migration.
- No README work from issue #10.
- No GitHub Actions workflow in this slice.
