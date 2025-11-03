# Research: Smart Korean Grammar Assistant

## Overview

Purpose: Resolve design decisions and clarify technical unknowns for implementing a clean-room VS Code extension in TypeScript that provides Korean grammar/spelling/spacing checks for Markdown.

## Decisions

1. Decision: Language and runtime

   - Choice: TypeScript (target ES2020+/Node 18+) for the extension host.
   - Rationale: Native integration with VS Code extension tooling, strong typing, ecosystem familiarity among extension developers.
   - Alternatives considered: Implementing an external LSP process (provides isolation and scalability), or writing in another language. LSP deferred to future if performance/scale demands it.

2. Decision: Analysis architecture

   - Choice: Start with an in-process extension-host adapter that POSTs to a configurable Bareun endpoint or uses local heuristics when endpoint not provided.
   - Rationale: Faster iteration, simpler distribution, and easier onboarding. Keeps codebase compact and follows clean-room constraints.
   - Alternatives considered: Full LSP server (better for heavy workloads and multi-file indexing). If benchmarks show the need for offloading, we will create a migration ticket.

3. Decision: Network behavior and privacy

   - Choice: Require explicit `skga.bareun.endpoint` setting to enable cloud calls; empty value => local-only heuristics.
   - Rationale: Ensures privacy by default and aligns with constitution principle IV.

4. Decision: Testing strategy

   - Choice: Unit tests for parsing and diagnostics, integration test using `vscode-test` in CI for basic end-to-end validation.
   - Rationale: Ensures correctness of diagnostics and quick fixes while keeping tests fast.

## Resolved Unknowns

- CI Node: Recommend pinning Node 18 or 20 in CI (useful for reproducible builds). Marked as implementation detail for CI config.
- Large documents: Use debounce and maximum size limitation (e.g., 50k chars) for cloud submissions; local heuristics run unbounded but with efficient scanning.
