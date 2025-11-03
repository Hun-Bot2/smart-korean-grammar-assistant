# Changelog | 변경 사항

All notable changes to the Smart Korean Grammar Assistant extension will be documented in this file.

Smart Korean Grammar Assistant 확장 프로그램의 모든 주요 변경 사항이 이 파일에 기록됩니다.

## [Unreleased]

### Added | 추가됨
- **User Story 1: Inline Grammar Checks | 인라인 문법 검사**
  - Real-time Korean grammar/spelling/spacing diagnostics for Markdown files
  - 마크다운 파일에 대한 실시간 한국어 문법/맞춤법/띄어쓰기 진단
  
  - Bareun NLP cloud API integration (api.bareun.ai)
  - Bareun NLP 클라우드 API 통합 (api.bareun.ai)
  
  - Markdown-aware filtering (excludes code blocks and inline code)
  - 마크다운 인식 필터링 (코드 블록 및 인라인 코드 제외)
  
  - Debounced analysis (350ms) to prevent performance issues during typing
  - 타이핑 중 성능 문제 방지를 위한 디바운스 분석 (350ms)
  
  - Local heuristics fallback mode for offline usage
  - 오프라인 사용을 위한 로컬 휴리스틱 폴백 모드

- **User Story 2: Hover & Status Bar | 호버 및 상태 표시줄**
  - Hover provider showing detailed issue explanations with original text and suggestions
  - 원문 및 제안과 함께 상세한 문제 설명을 표시하는 호버 제공자
  
  - Status bar indicator displaying analysis state (idle/analyzing/success/error)
  - 분석 상태를 표시하는 상태 표시줄 표시기 (대기/분석 중/성공/오류)
  
  - Real-time issue count in status bar
  - 상태 표시줄의 실시간 문제 개수
  
  - Quick access to Problems panel via status bar click
  - 상태 표시줄 클릭으로 문제 패널에 빠르게 접근

- **Keyboard Shortcuts | 키보드 단축키**
  - `Cmd+Shift+K Cmd+Shift+E` (Mac) / `Ctrl+Shift+K Ctrl+Shift+E` (Win/Linux): Toggle enable/disable | 활성화/비활성화 전환
  - `Cmd+Shift+K Cmd+Shift+A` (Mac) / `Ctrl+Shift+K Ctrl+Shift+A` (Win/Linux): Analyze current document | 현재 문서 분석
  - `Cmd+Shift+K Cmd+Shift+F` (Mac) / `Ctrl+Shift+K Ctrl+Shift+F` (Win/Linux): Quick fix | 빠른 수정

- **Commands | 명령어**
  - `Korean Grammar: 설정 열기` - Open SKGA settings | SKGA 설정 열기
  - `Korean Grammar: 활성화/비활성화` - Toggle extension on/off | 확장 프로그램 켜기/끄기
  - `Korean Grammar: 현재 문서 분석` - Manually trigger analysis | 수동으로 분석 실행
  - `Korean Grammar: 문제 패널 보기` - Open Problems panel | 문제 패널 열기

### Configuration | 설정
- `skga.bareun.endpoint` - Bareun NLP endpoint URL | Bareun NLP 엔드포인트 URL
- `skga.bareun.apiKey` - API key for Bareun cloud service | Bareun 클라우드 서비스용 API 키
- `skga.enabled` - Enable/disable diagnostics (default: true) | 진단 활성화/비활성화 (기본값: true)

### Fixed | 수정됨
- SSL certificate verification issues with Bareun API
- Bareun API의 SSL 인증서 검증 문제

- Response parsing for camelCase field names (revisedBlocks)
- camelCase 필드 이름에 대한 응답 파싱 (revisedBlocks)

- Diagnostic position calculation using UTF-32 offsets
- UTF-32 오프셋을 사용한 진단 위치 계산

- Category-based severity mapping (TYPO → error, others → warning)
- 카테고리 기반 심각도 매핑 (TYPO → 오류, 기타 → 경고)

## [0.0.1] - 2025-11-03

### Added | 추가됨
- Initial scaffold and project structure
- 초기 스캐폴드 및 프로젝트 구조

- Foundation for VS Code extension with TypeScript
- TypeScript를 사용한 VS Code 확장 프로그램 기반

- Basic diagnostic collection and code action providers
- 기본 진단 수집 및 코드 액션 제공자
