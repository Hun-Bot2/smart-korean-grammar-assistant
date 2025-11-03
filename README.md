# Smart Korean Grammar Assistant (SKGA)

VS Code extension that checks Korean grammar, spelling, and spacing using the Bareun NLP engine (cloud/local) and provides inline diagnostics, hover explanations, and quick fixes for Markdown documents.

Features
- Underlines grammar/spelling/spacing issues in Markdown files
- Hover explanations and messages on diagnostics
- Quick fixes (code actions) when a suggestion is available
- Configurable Bareun endpoint and API key (use local heuristics when not configured)

Configuration
- `skga.bareun.endpoint` — Bareun NLP endpoint (POST JSON { text }) that returns `{ issues: [...] }` where each issue contains start/end/message/suggestion.
- `skga.bareun.apiKey` — Optional API key for Bareun cloud.
- `skga.enabled` — Enable or disable SKGA diagnostics.

Development
1. npm install
2. npm run compile
3. Press F5 in VS Code to run the extension in the Extension Development Host.

Notes
- This initial implementation includes simple local heuristics (double spaces, trailing spaces) when no Bareun endpoint is configured.
- For production use, point `skga.bareun.endpoint` at a proper Bareun API compatible endpoint.
