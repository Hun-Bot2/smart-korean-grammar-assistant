import * as vscode from 'vscode';
import { DICT_CATEGORY_LABELS, DictKey } from './customDictionaryMeta';
import { DEFAULT_BAREUN_CUSTOM_DICTIONARY_ENDPOINT } from './constants';

export class CustomDictionaryPanel {
  private static currentPanel: CustomDictionaryPanel | undefined;

  static render(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (CustomDictionaryPanel.currentPanel) {
      CustomDictionaryPanel.currentPanel.panel.reveal(column);
      CustomDictionaryPanel.currentPanel.update();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'bkgaCustomDictionary',
      'BKGA 사용자 사전',
      column,
      { enableScripts: false }
    );

    CustomDictionaryPanel.currentPanel = new CustomDictionaryPanel(panel);
  }

  static refresh() {
    CustomDictionaryPanel.currentPanel?.update();
  }

  private constructor(private panel: vscode.WebviewPanel) {
    this.update();
    this.panel.onDidDispose(() => {
      CustomDictionaryPanel.currentPanel = undefined;
    });
  }

  private update() {
    this.panel.webview.html = this.buildHtml();
  }

  private buildHtml(): string {
    const cfg = vscode.workspace.getConfiguration('bkga');
    const cd = cfg.get<any>('customDictionary') || {};
    const domainName: string = cd.domainName || '';
    const rawEndpoint: string = (cd.endpoint || '').trim();
    const endpoint =
      rawEndpoint || DEFAULT_BAREUN_CUSTOM_DICTIONARY_ENDPOINT;
    const usingDefault = !rawEndpoint;
    const enabled = Boolean(cd.enabled);
    const categories = (Object.keys(DICT_CATEGORY_LABELS) as DictKey[]).map((key) => {
      const entries: string[] = cd[key] || [];
      return { key, items: entries };
    });

    const emptyState = categories.every((cat) => !cat.items || cat.items.length === 0);

    return /* html */ `
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <style>
      :root {
        color-scheme: light dark;
        --bg: var(--vscode-editor-background, #1e1e1e);
        --fg: var(--vscode-foreground, #e0e0e0);
        --panel-bg: rgba(255,255,255,0.04);
        --accent: var(--vscode-list-highlightForeground, #4fc3f7);
        --border: rgba(255,255,255,0.08);
      }
      body {
        padding: 16px;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: var(--bg);
        color: var(--fg);
      }
      .header {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 16px;
      }
      .status {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 6px;
        background: var(--panel-bg);
        width: fit-content;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
      }
      section {
        background: var(--panel-bg);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 12px;
      }
      section h2 {
        margin: 0;
        font-size: 16px;
      }
      section p.subtitle {
        margin: 2px 0 8px;
        font-size: 11px;
        color: var(--accent);
      }
      section p.helper {
        margin: 0 0 12px;
        font-size: 12px;
        opacity: 0.8;
      }
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        max-height: 180px;
        overflow-y: auto;
      }
      li {
        padding: 6px 8px;
        border-radius: 6px;
        background: rgba(255,255,255,0.03);
        margin-bottom: 6px;
        font-size: 13px;
      }
      li:last-child {
        margin-bottom: 0;
      }
      .empty {
        padding: 24px;
        text-align: center;
        border: 1px dashed var(--border);
        border-radius: 12px;
        margin-top: 12px;
        font-size: 13px;
        opacity: 0.8;
      }
      code {
        background: rgba(255,255,255,0.08);
        padding: 2px 6px;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>사용자 사전 (${enabled ? '활성화됨' : '비활성화됨'})</h1>
      <div class="status">
        <span>도메인: <code>${domainName || '미설정'}</code></span>
        <span>엔드포인트: <code>${endpoint}</code>${usingDefault ? ' (기본)' : ''}</span>
        <span>총 단어: ${categories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0)}</span>
      </div>
    </div>

    <div class="grid">
      ${categories
        .map((cat) => {
          const meta = DICT_CATEGORY_LABELS[cat.key as DictKey];
          const itemsHtml =
            cat.items && cat.items.length
              ? cat.items
                  .map((item) => `<li>${item}</li>`)
                  .join('')
              : '<div class="empty">아직 단어가 없습니다.<br/>명령 팔레트에서 "사용자 사전 추가"를 실행해 보세요.</div>';

          return `<section>
            <h2>${meta.title} (${cat.items?.length || 0})</h2>
            <p class="subtitle">${meta.subtitle}</p>
            <p class="helper">${meta.helper}</p>
            ${
              cat.items && cat.items.length
                ? `<ul>${itemsHtml}</ul>`
                : itemsHtml
            }
          </section>`;
        })
        .join('')}
    </div>

    ${
      emptyState
        ? `<div class="empty">
            아직 등록된 사용자 사전 단어가 없습니다.<br/>
            텍스트를 선택하고 <code>Korean Grammar: 선택 텍스트를 사용자 사전에 추가</code> 명령을 실행해보세요.
          </div>`
        : ''
    }
  </body>
</html>`;
  }
}
