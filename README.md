# Smart Korean Grammar Assistant (SKGA)

VS Code extension that checks Korean grammar, spelling, and spacing using the Bareun NLP engine (cloud/local) and provides inline diagnostics, hover explanations, and quick fixes for Markdown documents.

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (`Cmd+Shift+X` or `Ctrl+Shift+X`)
3. Search for "Smart Korean Grammar Assistant"
4. Click Install

### From VSIX file
```bash
code --install-extension smart-korean-grammar-assistant-1.0.0.vsix
```

## Features

- **Inline Grammar Checks**: Underlines grammar/spelling/spacing issues in Markdown files
- **Hover Explanations**: Detailed hover info showing original text, suggestions, and severity
- **Quick Fixes**: Code actions to apply corrections with one click (`Cmd+.`)
- **Status Bar**: Real-time analysis state and issue count indicator
- **Keyboard Shortcuts**: Quick access to toggle, analyze, and fix
- **Markdown-Aware**: Excludes code blocks and inline code from analysis
- **Configurable Engine**: Use Bareun cloud API or local heuristics

## Keyboard Shortcuts

| Command | Mac | Windows/Linux | Description |
|---------|-----|---------------|-------------|
| Toggle Enable/Disable | `Cmd+Shift+K Cmd+Shift+E` | `Ctrl+Shift+K Ctrl+Shift+E` | 활성화/비활성화 |
| Analyze Document | `Cmd+Shift+K Cmd+Shift+A` | `Ctrl+Shift+K Ctrl+Shift+A` | 현재 문서 분석 |
| Quick Fix | `Cmd+Shift+K Cmd+Shift+F` | `Ctrl+Shift+K Ctrl+Shift+F` | 빠른 수정 적용 |

> **Tip**: You can also use the standard `Cmd+.` (or `Ctrl+.`) to open Quick Fix menu

## Configuration

- `skga.bareun.endpoint` — Bareun NLP endpoint (default: `https://api.bareun.ai/bareun.RevisionService/CorrectError`)
- `skga.bareun.apiKey` — API key for Bareun cloud service (required for cloud API)
- `skga.enabled` — Enable or disable SKGA diagnostics (default: `true`)

### Getting a Bareun API Key

1. Visit [Bareun NLP](https://bareun.ai/) to sign up
2. Generate an API key from your dashboard
3. Add the key to VS Code settings: `File > Preferences > Settings > Extensions > Smart Korean Grammar Assistant`

## Usage

1. Open a Markdown file (`.md`)
2. SKGA automatically analyzes the document
3. Grammar/spelling issues appear with yellow squiggles
4. Hover over underlined text to see details
5. Click the lightbulb 💡 or press `Cmd+.` to apply quick fixes
6. Check the status bar (bottom-right) for issue count

## Development

```bash
npm install
npm run compile
# Press F5 in VS Code to run the extension in Extension Development Host
npm test
```

## Status Bar Indicators

- `SKGA` — Idle (no active analysis)
- `SKGA: 분석 중...` — Analyzing document
- `SKGA: 문제 없음` — No issues found
- `SKGA: N개 문제` — Issues detected
- `SKGA: 오류` — Analysis error

## Notes

- This extension is optimized for Korean Markdown blog posts
- Code blocks (` ``` `) and inline code (`` ` ``) are automatically excluded from analysis
- When Bareun API is unavailable, falls back to basic local heuristics (double spaces, trailing spaces)
- Analysis is debounced (350ms) to avoid excessive API calls during rapid typing
