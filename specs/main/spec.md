# Feature Specification: Smart Korean Grammar Assistant

**Feature Branch**: `main`
**Created**: 2025-11-03
**Status**: Draft
**Input**: User description: "Clean-room VS Code extension in TypeScript to provide accurate, low-latency Korean grammar and spelling checks for Markdown content without leaving VS Code."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inline Grammar Checks (Priority: P1)

As a Korean writer editing a Markdown blog post, I want the editor to underline grammar, spelling, and spacing issues directly in the document so that I can fix them without switching to an external tool.

**Why this priority**: Core user value — eliminates context switching and maintains writing flow.

**Independent Test**: Open a Markdown file, introduce a double-space and a trailing-space; verify diagnostics appear with correct ranges and messages.

**Acceptance Scenarios**:
1. **Given** a Markdown document with a spelling/spacing error, **When** the document is open or updated, **Then** the editor shows an inline diagnostic under the affected range within 1.2s (cloud) or 0.8s (local) for documents ~2k chars.
2. **Given** a code block or inline code, **When** diagnostics run, **Then** no diagnostics are raised inside code block ranges by default.

---

### User Story 2 - Quick Fixes and Suggestions (Priority: P2)

As a user, I want quick fixes available for diagnostics that include a suggested replacement so I can apply corrections with one action.

**Why this priority**: Improves speed of corrections and reduces friction.

**Independent Test**: When a diagnostic includes a suggestion, a Quick Fix is offered; applying it replaces the range with the suggestion.

---

### User Story 3 - Configurable Engine & Privacy (Priority: P2)

As a privacy-conscious user, I want to configure a Bareun cloud endpoint or run in Local-Only Mode so that I control whether text leaves my machine.

**Why this priority**: Privacy is a core product principle (constitution).

**Independent Test**: With `skga.bareun.endpoint` empty, the extension uses local heuristics; with it set, the extension POSTs the document text to the endpoint and displays returned issues.

---

### Edge Cases

- Very large documents (>100k chars) — analyzer should avoid blocking and may sample or limit scope.
- Offline or unreachable endpoint — extension must fall back to local heuristics and surface a non-intrusive status indication.
- Documents with many rapid edits — debounce analysis to avoid overload.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST analyze Markdown documents and surface diagnostics for grammar, spelling, and spacing.
- **FR-002**: The extension MUST exclude code blocks, inline code, and fenced content from analysis by default.
- **FR-003**: The extension MUST provide Quick Fix code actions when a diagnostic includes a suggested replacement.
- **FR-004**: The extension MUST allow configuration of `skga.bareun.endpoint` and `skga.bareun.apiKey`.
- **FR-005**: The extension MUST support Local-Only Mode (no network calls) when `skga.bareun.endpoint` is empty or explicitly set to `local`.
- **FR-006**: The extension MUST fail gracefully and avoid blocking the editor UI thread.

### Key Entities *(include if feature involves data)*

- **Configuration**: `skga.bareun.endpoint` (string), `skga.bareun.apiKey` (string, optional), `skga.enabled` (boolean).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For documents ≈2,000 characters, end-to-end detection latency MUST be ≤1.2s when using cloud endpoint and ≤0.8s when using a local engine on a typical developer machine.
- **SC-002**: Quick-fix application MUST replace the diagnostic range correctly in 100% of acceptance tests.
- **SC-003**: When `skga.bareun.endpoint` is empty, the extension MUST use local heuristics and provide at least basic spacing/spelling diagnostics.
- **SC-004**: User-facing privacy settings MUST be discoverable via extension settings and documented in README.

## Assumptions

- Bareun-compatible endpoint accepts POST JSON { "text": "..." } and returns JSON { "issues": [ ... ] } where each issue contains start/end byte indices and message/suggestion.
- The target environment includes Node.js toolchain for building the extension (developer requirement).
