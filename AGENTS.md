# AGENTS.md

## Mission

Deliver the smallest complete and safe change that solves the task without degrading existing behavior, architecture, or maintainability.

## Before Changing Code

* Inspect the nearest relevant code, tests, configuration, and documentation. Follow existing project patterns unless they are the cause of the problem.
* Verify repository facts instead of guessing. Make assumptions explicit only when they affect the result.
* For ambiguous, cross-cutting, or multi-file work, write a brief plan before editing. Follow `PLANS.md` or equivalent project guidance when present.

## Implementation Rules

* Keep changes scoped. Avoid unrelated refactors, broad renames, speculative features, and large formatting-only diffs.
* Prefer simple, explicit code over cleverness or premature abstraction. Extract shared code only when duplication, ownership, or boundaries justify it.
* Respect existing module boundaries and dependency direction. Avoid circular dependencies, hidden global state, and business logic in UI, transport, or persistence layers.
* Reuse centralized types, schemas, validation, constants, and configuration. Do not duplicate business rules.
* Preserve public behavior and interfaces unless a breaking change is explicitly required; document migrations when needed.
* Do not add a production dependency when the standard library or an existing dependency is sufficient. Justify any new dependency.
* Validate untrusted input at boundaries. Do not silently swallow errors; provide actionable context without exposing sensitive data.
* Avoid repeated I/O, N+1 access, unbounded work, blocking hot paths, and accidental changes to transaction, concurrency, cancellation, or idempotency behavior.
* Do not leave dead code, commented-out implementations, debug output, or unfinished placeholders.

## Verification

* Add or update tests for bug fixes and behavior changes, including meaningful boundary and failure cases.
* Keep tests deterministic. Do not weaken, skip, or delete tests merely to make them pass.
* Use the project's canonical formatter, linter, type checker, test runner, build system, and generators.
* Run focused checks first, then broader relevant checks. Review repository status and the final diff for unintended changes.
* If a check cannot run, state exactly what was not verified and why.

## Maintaining This File

* Keep this file short and generic. Add rules only for repeated failures or durable project constraints.
* Put stack-specific commands, architecture details, and directory-specific rules in the nearest nested `AGENTS.md` or dedicated project documentation.
