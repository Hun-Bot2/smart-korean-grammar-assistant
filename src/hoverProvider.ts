import * as vscode from 'vscode';
import { DiagnosticsManager } from './diagnostics';

/**
 * Provides hover information for Korean grammar diagnostics.
 * Shows detailed explanations and suggestions when hovering over underlined issues.
 */
export class BkgaHoverProvider implements vscode.HoverProvider {
  constructor(private diagnosticsManager: DiagnosticsManager) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    // Get diagnostics for this document
    const diagnostics = this.diagnosticsManager.getDiagnostics(document.uri);
    if (!diagnostics || diagnostics.length === 0) {
      return null;
    }

    // Find diagnostic at this position
    const diagnostic = diagnostics.find(d => d.range.contains(position));
    if (!diagnostic) {
      return null;
    }

    // Extract issue details from diagnostic
    const originalText = document.getText(diagnostic.range);
    const suggestion = (diagnostic as any).suggestion;
    const category = (diagnostic.code as string) || '';

    // Map category to user-friendly name and emoji
    const categoryInfo = this.getCategoryInfo(category);

    // Build hover content
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    markdown.appendMarkdown(`#🇰🇷 ${categoryInfo.name}\n\n`);
    
    if (suggestion && suggestion !== originalText) {
      const diff = this.buildDiffHighlight(originalText, suggestion);
      markdown.appendMarkdown(`**원문**: ${diff.originalHtml}\n\n`);
      markdown.appendMarkdown(`**대치어**: ${diff.suggestionHtml}\n\n`);
      if (diff.diffBlock) {
        markdown.appendMarkdown(`**변경 내용**:\n`);
        markdown.appendCodeblock(diff.diffBlock, 'diff');
        markdown.appendMarkdown(`\n`);
      }
      markdown.appendMarkdown(`**도움말**: ${diagnostic.message}\n\n`);
      markdown.appendMarkdown(`---\n\n`);
      markdown.appendMarkdown(`💡 _빠른 수정을 적용하려면 전구 아이콘을 클릭하거나 \`Cmd+.\` 를 누르세요_`);
    } else {
      markdown.appendMarkdown(`**도움말**: ${diagnostic.message}\n\n`);
    }

    return new vscode.Hover(markdown, diagnostic.range);
  }

  private getCategoryInfo(category: string): { name: string; emoji: string; color: string } {
    if (category.includes('맞춤법') || category.includes('SPELLING')) {
      return { name: '🔴 맞춤법 오류', emoji: '🔴', color: 'red' };
    } else if (category.includes('띄어쓰기') || category.includes('SPACING')) {
      return { name: '🟡 띄어쓰기 오류', emoji: '🟡', color: 'yellow' };
    } else if (category.includes('표준어') || category.includes('STANDARD')) {
      return { name: '🟣 표준어 의심', emoji: '🟣', color: 'purple' };
    } else if (category.includes('통계') || category.includes('STATISTICAL')) {
      return { name: '🔵 통계적 교정', emoji: '🔵', color: 'blue' };
    }
    return { name: '⚪ 문법/맞춤법 오류', emoji: '⚪', color: 'gray' };
  }

  private buildDiffHighlight(
    original: string,
    suggestion: string
  ): { originalHtml: string; suggestionHtml: string; diffBlock: string } {
    if (!suggestion) {
      const escaped = this.wrapInCode(this.escapeHtml(original));
      return { originalHtml: escaped, suggestionHtml: escaped, diffBlock: '' };
    }

    if (original === suggestion) {
      const escaped = this.wrapInCode(this.escapeHtml(original));
      return { originalHtml: escaped, suggestionHtml: escaped, diffBlock: '' };
    }

    let prefixLen = 0;
    const maxPrefix = Math.min(original.length, suggestion.length);
    while (prefixLen < maxPrefix && original[prefixLen] === suggestion[prefixLen]) {
      prefixLen++;
    }

    let suffixLen = 0;
    const maxSuffix = Math.min(original.length, suggestion.length) - prefixLen;
    while (
      suffixLen < maxSuffix &&
      original[original.length - 1 - suffixLen] === suggestion[suggestion.length - 1 - suffixLen]
    ) {
      suffixLen++;
    }

    const originalPrefix = this.escapeHtml(original.slice(0, prefixLen));
    const originalChange = this.escapeHtml(original.slice(prefixLen, original.length - suffixLen));
    const originalSuffix =
      suffixLen > 0 ? this.escapeHtml(original.slice(original.length - suffixLen)) : '';

    const suggestionPrefix = this.escapeHtml(suggestion.slice(0, prefixLen));
    const suggestionChange = this.escapeHtml(
      suggestion.slice(prefixLen, suggestion.length - suffixLen)
    );
    const suggestionSuffix =
      suffixLen > 0 ? this.escapeHtml(suggestion.slice(suggestion.length - suffixLen)) : '';

    const originalHtml = this.wrapInCode(
      `${originalPrefix}${
        originalChange ? `<span style="background-color:#ffeceb;">${originalChange}</span>` : ''
      }${originalSuffix}`
    );
    const suggestionHtml = this.wrapInCode(
      `${suggestionPrefix}${
        suggestionChange ? `<span style="background-color:#e6ffed;">${suggestionChange}</span>` : ''
      }${suggestionSuffix}`
    );

    return {
      originalHtml,
      suggestionHtml,
      diffBlock: `- ${original}\n+ ${suggestion}`
    };
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private wrapInCode(content: string): string {
    return `<code>${content || '&nbsp;'}</code>`;
  }
}
