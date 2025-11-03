# Implementation Plan: Smart Korean Grammar Assistant

**Branch**: `main` | **Date**: 2025-11-03 | **Spec**: `/Users/jeonghun/smart-korean-grammar-assistant/specs/main/spec.md`
**Input**: Feature specification from `/specs/main/spec.md`

## Summary

Deliver a clean-room TypeScript VS Code extension that analyzes Markdown documents and surfaces Korean grammar, spelling, and spacing diagnostics inline with quick fixes. The initial deliverable will implement a Bareun adapter (configurable endpoint), local heuristics fallback, diagnostics, and code actions for Markdown files.

## Technical Context

**Language/Version**: TypeScript (>=4.9, recommend 5.x)
**Node**: Developer toolchain Node.js 18+ assumed (NEEDS CLARIFICATION: CI/node version to pin)
**Primary Dependencies**: `vscode` extension API, `typescript`, minimal HTTP client (built-in https or fetch polyfill), test harness (`vscode-test`/`mocha`).
**Storage**: None (configuration only via VS Code settings)
**Testing**: Unit tests for core modules (Bareun client mock, diagnostics), simple integration test using the Extension Development Host (`vscode-test`).
**Target Platform**: Desktop VS Code on macOS, Windows, Linux
**Project Type**: VS Code extension (single package)
**Performance Goals**: Keep end-to-end analysis under 1.2s (cloud) or 0.8s (local) for ~2k chars; never block the main thread.
**Constraints**: Must support Local-Only Mode for privacy; initial implementation must avoid large third-party dependencies (clean-room policy).
**Scale/Scope**: Initial release targets single-user edit workflows; larger scale (workspace-wide indexing) out of scope for MVP.

## Constitution Check

Gates derived from `.specify/memory/constitution.md`:

- Focused Utility: PASS — feature directly improves writing/correction flow.
- Markdown-First: PASS — analyzer will prioritize Markdown and exclude code blocks by default.
- Reliable Performance: PASS (design-time) — performance goals set; must be validated by benchmarks before release.
- Privacy & Transparency: PASS — supports Local-Only Mode and explicit endpoint configuration.
- Extensibility & Replaceability: PASS — adapter-based engine layer planned.

GATE RESULT: PASS (no blocking violations). Any implementation that breaks privacy or performance gates must be justified and documented.

## Project Structure

src/
├── extension.ts          # VS Code activation
├── diagnostics.ts       # Diagnostics manager
├── bareunClient.ts      # Adapter for Bareun endpoint
├── codeActions.ts       # Quick fixes
└── util/

tests/
├── unit/
└── integration/

## Phase 0: Outline & Research

Research tasks (resolve any NEEDS CLARIFICATION):

- Research CI Node.js version recommendation and pin (Task: choose Node 18/20 for CI)
- Research best practices for sending large document text to remote analyzers (Task: chunking, streaming, size limits)
- Research VS Code performance patterns: diagnostics debounce, non-blocking analysis, and WebWorker / LSP migration path.

## Phase 1: Design & Contracts

Prerequisites: research.md complete

Deliverables:

- `data-model.md` — configuration keys and any persisted state (none expected)
- `/contracts/bareun-openapi.json` — simple API contract for the expected analyze endpoint
- `quickstart.md` — developer quickstart

## Phase 2: Implementation (short plan)

1. Setup project skeleton (package.json, tsconfig, scripts)
2. Implement diagnostics manager with local heuristics and adapter hook
3. Implement Bareun client (HTTP POST parser)
4. Register code action provider for quick fixes
5. Implement unit tests + basic integration test (EDH)
6. Benchmark and optimize for latency; add status bar privacy indicator

## Complexity Tracking

No constitution violations identified requiring escalation. If performance targets cannot be met without an LSP, plan to add migration ticket and mark as MINOR version change.
