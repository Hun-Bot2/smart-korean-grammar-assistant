import * as vscode from 'vscode';
import { DiagnosticsManager } from './diagnostics';

/**
 * Provides hover information for Korean grammar diagnostics.
 * Shows detailed explanations and suggestions when hovering over underlined issues.
 */
export class SkgaHoverProvider implements vscode.HoverProvider {
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
    const severity = diagnostic.severity === vscode.DiagnosticSeverity.Error ? '오류' : '경고';

    // Build hover content
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    markdown.appendMarkdown(`### 🇰🇷 Korean Grammar Assistant\n\n`);
    markdown.appendMarkdown(`**문제**: ${diagnostic.message}\n\n`);
    markdown.appendMarkdown(`**원문**: \`${originalText}\`\n\n`);
    
    if (suggestion && suggestion !== originalText) {
      markdown.appendMarkdown(`**제안**: \`${suggestion}\`\n\n`);
      markdown.appendMarkdown(`**심각도**: ${severity}\n\n`);
      markdown.appendMarkdown(`---\n\n`);
      markdown.appendMarkdown(`💡 _빠른 수정을 적용하려면 $(lightbulb) 아이콘을 클릭하거나 \`Cmd+.\` 를 누르세요_`);
    } else {
      markdown.appendMarkdown(`**심각도**: ${severity}\n\n`);
    }

    return new vscode.Hover(markdown, diagnostic.range);
  }
}
