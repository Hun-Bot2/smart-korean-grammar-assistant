# Smart Korean Grammar Assistant (SKGA)

Bareun NLP 엔진(클라우드/로컬)을 사용해 마크다운 문서의 한국어 문법·맞춤법·띄어쓰기를 검사하고, 인라인 진단, 호버 설명, 빠른 수정을 제공합니다.
https://bareun.ai/home

## Installation

### From VS Code Marketplace
1. VS Code를 엽니다.
2. 확장(Extensions)을 엽니다 (`Cmd+Shift+X` 또는 `Ctrl+Shift+X`).
3. "Smart Korean Grammar Assistant"를 검색합니다.
4. 설치(Install)를 클릭합니다.

### From VSIX file
다음 명령으로 설치합니다:
```bash
code --install-extension smart-korean-grammar-assistant-1.0.0.vsix
```

## Features

- **인라인 검사**: 마크다운 파일의 문법/맞춤법/띄어쓰기 문제를 밑줄로 표시합니다.
- **Hover 설명**: 원문, 제안, 심각도 정보를 간단히 보여 줍니다.
- **빠른 수정**: 한 번에 수정 적용이 가능합니다 (`Cmd+.`).
- **상태 표시 줄**: 실시간 분석 상태와 문제 개수를 표시합니다.
- **키보드 단축키**: 토글/분석/수정 기능에 빠르게 접근할 수 있습니다.
- **마크다운 인식**: 코드 블록과 인라인 코드는 분석에서 제외합니다.
- **엔진 선택**: Bareun 클라우드 API 또는 로컬 휴리스틱을 사용할 수 있습니다.

## Keyboard Shortcuts

| Command | Mac | Windows/Linux | Description |
|---------|-----|---------------|-------------|
| Toggle Enable/Disable | `Cmd+Shift+K Cmd+Shift+E` | `Ctrl+Shift+K Ctrl+Shift+E` | 활성화/비활성화 |
| Analyze Document | `Cmd+Shift+K Cmd+Shift+A` | `Ctrl+Shift+K Ctrl+Shift+A` | 현재 문서 분석 |
| Quick Fix | `Cmd+Shift+K Cmd+Shift+F` | `Ctrl+Shift+K Ctrl+Shift+F` | 빠른 수정 적용 |

> 팁: 표준 단축키 `Cmd+.`(또는 `Ctrl+.`)로 빠른 수정 메뉴를 열 수 있습니다.

## Configuration

- `skga.bareun.endpoint` — Bareun NLP 엔드포인트 (기본값: `https://api.bareun.ai/bareun.RevisionService/CorrectError`).
- `skga.bareun.apiKey` — Bareun 클라우드 서비스 API 키(클라우드 API 사용 시 필요).
- `skga.enabled` — SKGA 진단 사용 여부(기본값: `true`).

### Getting a Bareun API Key

1. [Bareun NLP](https://bareun.ai/)에서 가입합니다.
2. 대시보드에서 API 키를 생성합니다.
3. VS Code 설정에 키를 추가합니다: `설정 > 확장(Extensions) > 스마트 한국어 문법 도우미`.

## Usage

1. 마크다운 파일(`.md`)을 엽니다.
2. SKGA가 문서를 자동으로 분석합니다.
3. 문법/맞춤법 문제는 노란 밑줄로 표시됩니다.
4. 밑줄 친 텍스트에 마우스를 올려 상세 내용을 확인합니다.
5. 전구 아이콘을 클릭하거나 `Cmd+.`를 눌러 빠른 수정을 적용합니다.
6. 상태 표시 줄(오른쪽 하단)에서 문제 개수를 확인합니다.

## Development

```bash
npm install
npm run compile
# VS Code에서 F5를 눌러 Extension Development Host로 실행합니다.
npm test
```

## Status Bar Indicators

- `SKGA` — 대기 상태
- `SKGA: 분석 중...` — 문서 분석 중
- `SKGA: 문제 없음` — 문제없음
- `SKGA: N개 문제` — 문제 N 개 감지
- `SKGA: 오류` — 분석 오류

## Notes

- 이 확장은 한국어 마크다운 블로그 글에 최적화되어 있습니다.
- 코드 블록(` ``` `)과 인라인 코드(`` ` ``)는 자동으로 분석에서 제외됩니다.
- Bareun API를 사용할 수 없는 경우, 기본 로컬 휴리스틱(이중 공백, 줄 끝 공백)을 사용합니다.
- 빠르게 타이핑할 때 과도한 API 호출을 막기 위해 분석은 350ms 디바운스됩니다.
