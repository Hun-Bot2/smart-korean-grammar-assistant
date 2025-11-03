# Smart Korean Grammar Assistant Constitution

## Core Principles

### I. Focused Utility

Every feature must directly support the user’s core goal: writing and correcting Korean text in VSCode **without context switching**.
No extra UX or AI features should be added unless they improve writing flow or correctness.

### II. Markdown-First

The extension treats **Markdown** as its primary domain.
Code blocks, links, images, and inline code must be excluded from inspection by default.
All behaviors and optimizations should prioritize Markdown writing performance and accuracy.

### III. Reliable Performance

Inspection must be **fast, quiet, and safe**:

* End-to-end check under 1.2 s (Cloud) or 0.8 s (Local) for 2 k characters.
* Never block typing or break focus.
* Always fail gracefully and inform the user non-intrusively (status bar message only).

### IV. Privacy & Transparency

The user must know exactly where text is sent and why.
Support **Local-Only Mode** for complete privacy.
Logs and telemetry may never contain actual content unless explicitly opted in (debug mode).

### V. Extensibility & Replaceability

The grammar engine layer is **adapter-based**.
Bareun is the default engine, but it must be replaceable with another NLP service or LLM without changing core logic.
Interface contracts are stable and versioned.

---

## Development Standards

1. **Clean-Room Implementation** — No third-party code copied from existing extensions.
2. **MIT or Apache-2.0 License** — All dependencies must allow open use.
3. **Consistent Module Layout** — `/ui`, `/core`, `/engines`, `/test` structure enforced.
4. **Error Handling** — Use circuit breakers, retries, and masked logging for all network calls.
5. **Accessibility** — Use clear color contrast and readable hover messages.

---

## Workflow & Quality Gates

* **Test-First**: Unit and contract tests required for all core modules.
* **Review Process**: Every PR must verify diagnostic correctness and latency targets.
* **Benchmark Suite**: Run latency/accuracy tests before tagging a release.
* **Release Policy**: Tag semantic versions `MAJOR.MINOR.PATCH`; document breaking adapter changes.
* **Dogfooding**: Each release must be used on real Markdown posts before public publishing.

---

## Governance

This constitution defines all architectural and workflow standards for Smart Korean Grammar Assistant.
<!--
Sync Impact Report

- Version change: 1.0.0 -> 1.0.0 (no change)
- Modified principles: none
- Added sections: none
- Removed sections: none
- Templates checked:
	- `.specify/templates/spec-template.md`: ✅ up-to-date
	- `.specify/templates/plan-template.md`: ✅ up-to-date
	- `.specify/templates/tasks-template.md`: ✅ up-to-date
	- `.specify/templates/checklist-template.md`: ✅ up-to-date
	- `.specify/templates/agent-file-template.md`: ✅ up-to-date
- Follow-up TODOs: none

Notes:
- No bracket-style placeholders ([ALL_CAPS_IDENTIFIER]) were found in the existing constitution. No changes to principles or governance were required.
- Dates and version remain as originally ratified: Version `1.0.0`, Ratified `2025-10-30`, Last Amended `2025-10-30`.
-->

```markdown
# Smart Korean Grammar Assistant Constitution

## Core Principles

### I. Focused Utility

Every feature must directly support the user’s core goal: writing and correcting Korean text in VSCode **without context switching**.
No extra UX or AI features should be added unless they improve writing flow or correctness.

### II. Markdown-First

The extension treats **Markdown** as its primary domain.
Code blocks, links, images, and inline code must be excluded from inspection by default.
All behaviors and optimizations should prioritize Markdown writing performance and accuracy.

### III. Reliable Performance

Inspection must be **fast, quiet, and safe**:

* End-to-end check under 1.2 s (Cloud) or 0.8 s (Local) for 2 k characters.
* Never block typing or break focus.
* Always fail gracefully and inform the user non-intrusively (status bar message only).

### IV. Privacy & Transparency

The user must know exactly where text is sent and why.
Support **Local-Only Mode** for complete privacy.
Logs and telemetry may never contain actual content unless explicitly opted in (debug mode).

### V. Extensibility & Replaceability

The grammar engine layer is **adapter-based**.
Bareun is the default engine, but it must be replaceable with another NLP service or LLM without changing core logic.
Interface contracts are stable and versioned.

---

## Development Standards

1. **Clean-Room Implementation** — No third-party code copied from existing extensions.
2. **MIT or Apache-2.0 License** — All dependencies must allow open use.
3. **Consistent Module Layout** — `/ui`, `/core`, `/engines`, `/test` structure enforced.
4. **Error Handling** — Use circuit breakers, retries, and masked logging for all network calls.
5. **Accessibility** — Use clear color contrast and readable hover messages.

---

## Workflow & Quality Gates

* **Test-First**: Unit and contract tests required for all core modules.
* **Review Process**: Every PR must verify diagnostic correctness and latency targets.
* **Benchmark Suite**: Run latency/accuracy tests before tagging a release.
* **Release Policy**: Tag semantic versions `MAJOR.MINOR.PATCH`; document breaking adapter changes.
* **Dogfooding**: Each release must be used on real Markdown posts before public publishing.

---

## Governance

This constitution defines all architectural and workflow standards for Smart Korean Grammar Assistant.
Any amendments must include:

1. Written rationale (why change is needed).
2. Approval by project maintainer(s).
3. Migration notes for users (if behavior or config changes).

All contributors are responsible for verifying compliance with this constitution during review.

**Version**: 1.0.0 | **Ratified**: 2025-10-30 | **Last Amended**: 2025-10-30

---

```
