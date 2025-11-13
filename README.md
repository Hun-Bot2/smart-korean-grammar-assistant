# Bareun Korean Grammar Assistant (BKGA)

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Hun-Bot2/smart-korean-grammer-assistant/releases)
[![Release](https://img.shields.io/github/v/release/Hun-Bot2/smart-korean-grammer-assistant)](https://github.com/Hun-Bot2/smart-korean-grammer-assistant/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Bareun NLP 엔진을 사용해 마크다운 문서의 한국어 문법·맞춤법·띄어쓰기를 검사하고, 인라인 진단, 호버 설명, 빠른 수정을 제공합니다.

https://bareun.ai/home

<!-- ![BKGA Demo](./assets/demo.gif) -->
<!-- TODO: Add demo GIF showing real-time grammar checking -->

## Installation

### From VS Code Marketplace
1. VS Code를 엽니다.
2. 확장(Extensions)을 엽니다 (`Cmd+Shift+X` 또는 `Ctrl+Shift+X`).
3. "Bareun Korean Grammar Assistant"를 검색합니다.
4. 설치(Install)를 클릭합니다.

### From VSIX file
다음 명령으로 설치합니다:
```bash
code --install-extension smart-korean-grammar-assistant-1.0.0.vsix
```

## Features

### 오류 유형별 색상 구분
- **맞춤법 오류**: 🔴 빨간색 밑줄
- **띄어쓰기 오류**: 🟡 노란색 밑줄  
- **표준어 의심**: 🟣 보라색 밑줄
- **통계적 교정**: 🔵 파란색 밑줄
- **영어 관련**: 🩷 핑크색 밑줄

### 실시간 분석 및 수정
.md 확장자인 markdown(마크다운) 문서에서만 작동됩니다! -> 확장자를 추가하시고 싶다면 아래 메일로 연락주세요!

- **인라인 검사**: 마크다운 파일의 문법/맞춤법/띄어쓰기 문제를 밑줄로 표시합니다.
- **Hover 설명**: 원문, 대치어, 도움말을 보여 줍니다.
- **빠른 수정**: 개별 오류를 간단하게 수정 (`Cmd+.`).
- **선택 영역 자동 수정**: 여러 줄을 선택하여 (Cmd+A) 한번에 모든 오류 수정 (`Cmd+K G F`).

### 사용자 편의성
- **상태 표시 줄**: 실시간 분석 상태와 문제 개수를 표시합니다.
- **키보드 단축키**: 토글/분석/수정 기능에 빠르게 접근할 수 있습니다.
- **마크다운 지원**: Bareun API가 코드 블록과 인라인 코드를 자동으로 분석에서 제외합니다.

### Screenshots

#### Inline Diagnostics
![Inline Diagnostics](./assets/inline-diagnostics.png)
<!-- TODO: Add screenshot showing underlined errors in markdown -->

#### Hover Information
![Hover Information](./assets/hover-info.png)
<!-- TODO: Add screenshot of hover tooltip with error details -->

#### Quick Fix
![Quick Fix](./assets/quick-fix.png)
<!-- TODO: Add screenshot of quick fix menu -->

#### Fix Selection (Auto-fix multiple lines)
![Fix Selection](./assets/fix-selection.png)
<!-- TODO: Add screenshot of selecting and fixing multiple lines at once -->

## Keyboard Shortcuts

| Command | Mac | Windows/Linux | Description |
|---------|-----|---------------|-------------|
| Toggle Enable/Disable | `Cmd+K G E` | `Ctrl+K G E` | 활성화/비활성화 |
| Analyze Document | `Cmd+K G A` | `Ctrl+K G A` | 현재 문서 분석 |
| Fix Selection | `Cmd+K G F` | `Ctrl+K G F` | 선택 영역 자동 수정 (여러 줄 한번에) |

> **팁**: 
> - 개별 오류 수정: `Cmd+.` (또는 `Ctrl+.`)로 빠른 수정 메뉴 열기
> - 여러 줄 한번에 수정: 텍스트 선택 후 `Cmd+K G F`

## Configuration

- `bkga.bareun.endpoint` — Bareun NLP 엔드포인트 URL
- `bkga.bareun.apiKey` — Bareun API 키 (**필수**)
- `bkga.enabled` — Extension 활성화 여부 (기본값: `true`)
- `bkga.includePaths` — 분석할 파일 패턴 (기본값: `["**/*.md"]`)
- `bkga.ignoreEnglishInMarkdown` — 마크다운 문서에서 영어 텍스트는 진단에서 제외 (기본값: `true`)

### Getting a Bareun API Key

1. [Bareun NLP](https://bareun.ai/)에서 가입합니다.
2. 대시보드에서 API 키를 생성합니다.
3. VS Code 설정에 키를 추가합니다: `설정 > 확장(Extensions) > Bareun Korean Grammar Assistant`.

## Usage

### 기본 사용법
1. 마크다운 파일(`.md`)을 엽니다.
2. BKGA가 문서를 자동으로 분석합니다.
3. 문법/맞춤법 문제는 밑줄로 표시됩니다.
4. 밑줄 친 텍스트에 마우스를 올려 상세 내용을 확인합니다.

### 수정 방법
- **개별 수정**: 전구 아이콘 클릭 또는 `Cmd+.`로 빠른 수정
- **여러 줄 한번에**: 텍스트 선택 후 `Cmd+K G F`로 자동 수정
- **상태 확인**: 오른쪽 하단 상태 표시줄에서 문제 개수 확인

## Development

```bash
npm install
npm run compile
# VS Code에서 F5를 눌러 Extension Development Host로 실행합니다.
npm test
```

## Status Bar Indicators

- `BKGA` — 대기 상태
- `BKGA: 분석 중...` — 문서 분석 중
- `BKGA: 문제없음` — 문제없음
- `BKGA: N개 문제` — 문제 N 개 감지
- `BKGA: 오류` — 분석 오류

## Notes

- 이 확장은 한국어 마크다운 문서 작성에 최적화되어 있습니다.
- **Bareun API 키가 필수입니다.** [bareun.ai](https://bareun.ai/)에서 무료로 발급받을 수 있습니다.
- API 키 없이는 기본적인 공백 검사만 수행됩니다.
- 코드 블록(` ``` `)과 인라인 코드(`` ` ``)는 Bareun API가 자동으로 분석에서 제외합니다.
- 빠른 타이핑 시 과도한 API 호출을 방지하기 위해 350ms 디바운스가 적용됩니다.

## Contributing

피드백,버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

- **Issues**: [GitHub Issues](https://github.com/Hun-Bot2/smart-korean-grammer-assistant/issues)
- **Repository**: [GitHub](https://github.com/Hun-Bot2/smart-korean-grammer-assistant)
- **Email**: [surtrcode@gmail.com](mailto:surtrcode@gmail.com)

## License

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
