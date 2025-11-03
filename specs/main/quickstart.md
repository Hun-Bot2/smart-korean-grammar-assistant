# Quickstart: Smart Korean Grammar Assistant (development)

Location: `/Users/jeonghun/smart-korean-grammar-assistant`

1. Install dependencies

```bash
cd /Users/jeonghun/smart-korean-grammar-assistant
npm install
```

2. Compile TypeScript

```bash
npm run compile
```

3. Launch Extension Development Host

- Open the folder in VS Code and press F5. Open a Markdown file and verify diagnostics appear (double spaces, trailing spaces) when running with default local heuristics.

4. Configure Bareun endpoint (optional)

- Set `skga.bareun.endpoint` in your User or Workspace settings to point to a compatible analyze endpoint (see `/specs/main/contracts/bareun-openapi.json` for the expected contract).
