# Changelog

All notable changes to the Smart Korean Grammar Assistant extension will be documented in this file.

## [Unreleased]

### Added
- Initial implementation of Korean grammar checking for Markdown files
- Local heuristics mode (offline mode) for basic spacing checks
- Configurable Bareun NLP endpoint integration
- Quick fixes for diagnostics with suggestions
- Markdown-aware filtering (excludes code blocks and inline code)
- Debounced analysis to prevent performance issues during typing

### Configuration
- `skga.bareun.endpoint` - Configure cloud/local Bareun endpoint
- `skga.bareun.apiKey` - Optional API key for authenticated endpoints
- `skga.enabled` - Enable/disable diagnostics

## [0.0.1] - 2025-11-03

### Added
- Initial scaffold and project structure
- Foundation for VS Code extension with TypeScript
- Basic diagnostic collection and code action providers
