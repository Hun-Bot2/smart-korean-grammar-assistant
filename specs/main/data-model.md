# Data Model: Smart Korean Grammar Assistant

This feature has minimal persistent data needs. Configuration is stored using VS Code Settings (no separate database or files).

## Entities

- Configuration (stored in VS Code settings):
  - `skga.bareun.endpoint` (string) — URL to send analysis requests. Empty = local-only mode.
  - `skga.bareun.apiKey` (string, optional) — API key for protected endpoints.
  - `skga.enabled` (boolean) — Enable/disable diagnostics.

## Validation Rules

- `skga.bareun.endpoint` must be a valid HTTP/HTTPS URL if present.
- `skga.bareun.apiKey` stored as plain string in settings (document in README for security implications).
