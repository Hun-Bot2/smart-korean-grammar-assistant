# Tasks: Smart Korean Grammar Assistant

**Input**: Design documents from `/specs/main/` (plan.md, spec.md, data-model.md, contracts/)

## Summary

- Generated tasks: 26
- Tasks per story:
  - Setup/Foundational: 10
  - User Story 1 (US1 - Inline Grammar Checks): 5
  - User Story 2 (US2 - Quick Fixes & Hover): 4
  - User Story 3 (US3 - Configurable Engine & Privacy): 4
  - Polish & Release: 3
- Suggested MVP: Complete User Story 1 (US1) plus foundational tasks (Phase 1+2).

## Phase 1: Setup (project initialization)

- NOTE: These tasks initialize the repo and developer tooling. File paths are absolute to the repo root.

- [ ] T001 Initialize project skeleton (package.json, tsconfig.json, src/, tests/) - /Users/jeonghun/smart-korean-grammar-assistant
- [ ] T002 [P] Install dev dependencies and lockfile (run locally or CI) - /Users/jeonghun/smart-korean-grammar-assistant/package.json
- [ ] T003 Configure linting and formatting (.eslintrc.json, .prettierrc) - /Users/jeonghun/smart-korean-grammar-assistant

## Phase 2: Foundational (blocking prerequisites)

- These must complete before user stories work reliably.

- [ ] T004 Implement VS Code extension manifest and contributes (package.json) - /Users/jeonghun/smart-korean-grammar-assistant/package.json
- [ ] T005 [P] Implement extension activation skeleton (register diagnostics, commands) - /Users/jeonghun/smart-korean-grammar-assistant/src/extension.ts
- [ ] T006 Implement DiagnosticsManager API and collection wiring - /Users/jeonghun/smart-korean-grammar-assistant/src/diagnostics.ts
- [ ] T007 Implement Bareun client adapter (HTTP post, parse issues) - /Users/jeonghun/smart-korean-grammar-assistant/src/bareunClient.ts
- [ ] T008 Implement CodeAction provider skeleton for Quick Fixes - /Users/jeonghun/smart-korean-grammar-assistant/src/codeActions.ts
- [ ] T009 Implement settings and configuration docs (update README + data-model) - /Users/jeonghun/smart-korean-grammar-assistant/README.md
- [ ] T010 Create CI workflow to run `npm ci` and `npm run compile` (.github/workflows/ci.yml) - /Users/jeonghun/smart-korean-grammar-assistant/.github/workflows/ci.yml

## Phase 3: User Story 1 - Inline Grammar Checks (Priority: P1) 🎯 MVP

Goal: Analyze Markdown and surface inline diagnostics for grammar, spelling, and spacing.

Independent Test: Open a Markdown file, introduce double-space and trailing-space; diagnostics appear with correct ranges within time budget.

- [ ] T011 [US1] Write unit tests for DiagnosticsManager (tests/unit/diagnostics.test.ts) - /Users/jeonghun/smart-korean-grammar-assistant/tests/unit/diagnostics.test.ts
- [ ] T012 [US1] Implement local heuristics and analysis pipeline (exclude code blocks) - /Users/jeonghun/smart-korean-grammar-assistant/src/diagnostics.ts
- [ ] T013 [US1] Implement Markdown filter utility to exclude code fences and inline code - /Users/jeonghun/smart-korean-grammar-assistant/src/util/markdownFilter.ts
- [ ] T014 [US1] Wire diagnostics to activation and on-change events (hot analysis + debounce) - /Users/jeonghun/smart-korean-grammar-assistant/src/extension.ts
- [ ] T015 [US1] Integration test (Extension Development Host) validating diagnostics appear - /Users/jeonghun/smart-korean-grammar-assistant/tests/integration/us1.spec.ts

## Phase 4: User Story 2 - Quick Fixes and Hover (Priority: P2)

Goal: Provide Quick Fixes for suggestions and hover messages explaining diagnostics.

Independent Test: Diagnostics with `suggestion` show Quick Fix; applying it replaces text. Hover shows message.

- [ ] T016 [US2] Implement CodeAction provider to apply `suggestion` replacements - /Users/jeonghun/smart-korean-grammar-assistant/src/codeActions.ts
- [ ] T017 [US2] Unit tests for CodeAction provider (tests/unit/codeActions.test.ts) - /Users/jeonghun/smart-korean-grammar-assistant/tests/unit/codeActions.test.ts
- [ ] T018 [US2] Implement HoverProvider to show diagnostic details and rationale - /Users/jeonghun/smart-korean-grammar-assistant/src/hoverProvider.ts
- [ ] T019 [US2] UI: Add unobtrusive status bar indicator for analysis state - /Users/jeonghun/smart-korean-grammar-assistant/src/status.ts

## Phase 5: User Story 3 - Configurable Engine & Privacy (Priority: P2)

Goal: Allow configuration of Bareun endpoint/API key and support Local-Only Mode.

Independent Test: With `skga.bareun.endpoint` empty, extension uses local heuristics. With endpoint set, extension POSTs and consumes issues.

- [ ] T020 [P] [US3] Add/validate configuration properties in `package.json` contributes (skga.bareun.endpoint, skga.bareun.apiKey, skga.enabled) - /Users/jeonghun/smart-korean-grammar-assistant/package.json
- [ ] T021 [US3] Implement endpoint switch and fallback logic in the analysis pipeline - /Users/jeonghun/smart-korean-grammar-assistant/src/diagnostics.ts
- [ ] T022 [US3] Unit tests for Bareun client with mocked responses (tests/unit/bareunClient.test.ts) - /Users/jeonghun/smart-korean-grammar-assistant/tests/unit/bareunClient.test.ts
- [ ] T023 [US3] Documentation update for privacy and configuration (README.md and specs/main/data-model.md) - /Users/jeonghun/smart-korean-grammar-assistant/README.md

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T024 Polish docs and quickstart (improve examples, add troubleshooting) - /Users/jeonghun/smart-korean-grammar-assistant/README.md
- [ ] T025 Performance benchmarking script and sample data (tools/benchmark/run.js and data/) - /Users/jeonghun/smart-korean-grammar-assistant/tools/benchmark/run.js
- [ ] T026 Prepare release packaging and update release notes (package.json scripts, CHANGELOG.md) - /Users/jeonghun/smart-korean-grammar-assistant

## Dependencies & Execution Order

- Foundational phase (T004..T010) MUST complete before user story phases (T011+).
- US1 (T011..T015) is the MVP and recommended first deliverable.

### Dependency Graph (high-level)

- T001 → T002,T003 → T004..T010 → T011..T015 (US1) → T016..T019 (US2) → T020..T023 (US3) → T024..T026

### Parallel Opportunities

- Tasks marked `[P]` can run in parallel: T002, T005, T020 are examples.
- Unit tests (per module) can be developed in parallel (T011/T017/T022).

## Parallel Example Commands

Run all unit test tasks development in parallel conceptually (developer action):

```bash
# Work on unit tests for diagnostics, code actions, and bareun client in parallel branches
git checkout -b 001-us1-diagnostics-tests
git checkout -b 002-us2-codeactions-tests
git checkout -b 003-us3-bareun-tests
```

## Implementation Strategy

- MVP First: Complete Setup (Phase 1) + Foundational (Phase 2) + User Story 1 (Phase 3). Ship an internal preview.
- Incremental Delivery: After MVP, add US2 and US3 in separate increments, each with tests and small release.

---

## Validation

- All tasks follow the checklist format with sequential Task IDs and clear file paths.
