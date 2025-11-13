import * as vscode from 'vscode';
import { BareunClient, BareunIssue } from './bareunClient';
import { AnalysisState } from './status';

export type StatusCallback = (state: AnalysisState, issueCount?: number) => void;

export class DiagnosticsManager {
  private collection: vscode.DiagnosticCollection;
  private statusCallback?: StatusCallback;

  constructor(statusCallback?: StatusCallback) {
    this.collection = vscode.languages.createDiagnosticCollection('bkga');
    this.statusCallback = statusCallback;
  }

  dispose() {
    this.collection.clear();
    this.collection.dispose();
  }

  /**
   * Get diagnostics for a specific document URI
   */
  getDiagnostics(uri: vscode.Uri): readonly vscode.Diagnostic[] {
    return this.collection.get(uri) || [];
  }

  clearDiagnostics(uri: vscode.Uri) {
    this.collection.delete(uri);
  }

  async analyzeDocument(doc: vscode.TextDocument) {
    if (!vscode.workspace.getConfiguration().get('bkga.enabled')) {
      this.collection.delete(doc.uri);
      this.statusCallback?.('idle');
      return;
    }

    this.statusCallback?.('analyzing');

    const config = vscode.workspace.getConfiguration();
    const endpoint = config.get<string>('bkga.bareun.endpoint') || '';
    const apiKey = config.get<string>('bkga.bareun.apiKey') || undefined;
    const ignoreEnglishInMarkdown = config.get<boolean>('bkga.ignoreEnglishInMarkdown', true);
    const fullText = doc.getText();

    let issues: BareunIssue[] = [];
    if (endpoint) {
      try {
        issues = await BareunClient.analyze(endpoint, apiKey, fullText);
      } catch (err) {
        // fall back to local heuristics
        this.statusCallback?.('error');
        issues = this.localHeuristics(fullText);
      }
    } else {
      issues = this.localHeuristics(fullText);
    }

    // Markdown inline/code fences often contain commands or English.
    // Skip diagnostics that overlap these ranges to avoid false positives.
    const inlineCodeOffsets =
      doc.languageId === 'markdown' ? this.computeInlineCodeOffsets(fullText) : [];

    const diagnostics: vscode.Diagnostic[] = issues
      .map((iss) => {
        if (
          doc.languageId === 'markdown' &&
          this.intersectsInlineCode(iss.start, iss.end, inlineCodeOffsets)
        ) {
          return null;
        }

        const startPos = doc.positionAt(iss.start);
        const endPos = doc.positionAt(iss.end);
        const range = new vscode.Range(startPos, endPos);
        const snippet = doc.getText(range);
        const category = this.extractCategory(iss.message);

        if (
          doc.languageId === 'markdown' &&
          this.shouldIgnoreSnippet(snippet, category, ignoreEnglishInMarkdown)
        ) {
          return null;
        }

        const diag = new vscode.Diagnostic(range, iss.message, this.mapSeverity(iss.severity));
        diag.source = 'BKGA';
        
        // Set diagnostic tags based on error category for color coding
        diag.code = category;
        
        if (iss.suggestion) {
          (diag as any).suggestion = iss.suggestion;
        }
        return diag;
      })
      .filter((diag): diag is vscode.Diagnostic => Boolean(diag));

    this.collection.set(doc.uri, diagnostics);
    this.statusCallback?.('success', diagnostics.length);
  }

  private mapSeverity(s?: string): vscode.DiagnosticSeverity {
    switch (s) {
      case 'error':
        return vscode.DiagnosticSeverity.Error;
      case 'info':
        return vscode.DiagnosticSeverity.Information;
      default:
        return vscode.DiagnosticSeverity.Warning;
    }
  }

  private extractCategory(message: string): string {
    // Extract category from Bareun API message format: "CATEGORY: text"
    const match = message.match(/^([A-Z_]+):/);
    return match ? match[1] : 'UNKNOWN';
  }

  // Very small heuristic checks for Korean spacing/typos to provide offline behavior
  private localHeuristics(text: string): BareunIssue[] {
    const issues: BareunIssue[] = [];

    // double spaces
    const doubleSpace = / {2,}/g;
    let m: RegExpExecArray | null;
    while ((m = doubleSpace.exec(text))) {
      issues.push({ start: m.index, end: m.index + m[0].length, message: '여분의 공백이 있습니다.', suggestion: ' ', severity: 'warning' });
    }

    // trailing space at end of lines
    const lines = text.split(/\r?\n/);
    let pos = 0;
    for (const line of lines) {
      if (line.endsWith(' ')) {
        const start = pos + line.length - 1;
        issues.push({ start, end: pos + line.length, message: '행 끝에 불필요한 공백이 있습니다.', suggestion: line.trimEnd(), severity: 'info' });
      }
      pos += line.length + 1; // + newline
    }

    return issues;
  }

  private computeInlineCodeOffsets(text: string): Array<{ start: number; end: number }> {
    const spans: Array<{ start: number; end: number }> = [];
    let i = 0;

    while (i < text.length) {
      if (text[i] !== '`') {
        i++;
        continue;
      }

      let fenceLen = 1;
      while (i + fenceLen < text.length && text[i + fenceLen] === '`') {
        fenceLen++;
      }

      const fence = '`'.repeat(fenceLen);
      const contentStart = i;
      i += fenceLen;
      const closing = text.indexOf(fence, i);
      if (closing === -1) {
        break;
      }

      spans.push({ start: contentStart, end: closing + fenceLen });
      i = closing + fenceLen;
    }

    return spans;
  }

  private intersectsInlineCode(
    start: number,
    end: number,
    spans: Array<{ start: number; end: number }>
  ): boolean {
    if (!spans.length) {
      return false;
    }
    return spans.some((span) => Math.max(span.start, start) < Math.min(span.end, end));
  }

  private shouldIgnoreSnippet(snippet: string, category: string, ignoreEnglish: boolean): boolean {
    if (!snippet) {
      return true;
    }

    const trimmed = snippet.trim();
    if (!trimmed) {
      return true;
    }

    if (ignoreEnglish && this.isLikelyEnglish(trimmed)) {
      return true;
    }

    if (this.containsUrlOrEmail(trimmed) || this.containsMarkdownLink(trimmed)) {
      return true;
    }

    if (category === 'SPACING') {
      if (
        this.containsShortcutPattern(trimmed) ||
        this.containsHangulCommaRun(trimmed) ||
        this.containsAllCapsAscii(trimmed)
      ) {
        return true;
      }
    }

    return false;
  }

  private isLikelyEnglish(text: string): boolean {
    if (!text) {
      return false;
    }
    const cleaned = text.replace(/[`*_#>~.,!?'"()\[\]{}:;+\-=\\/0-9\s]/g, '');
    if (!cleaned) {
      return false;
    }
    const hasHangul = /[가-힣]/.test(cleaned);
    if (hasHangul) {
      return false;
    }
    const latinOnly = cleaned.replace(/[^A-Za-z]/g, '');
    return latinOnly.length > 0;
  }

  private containsShortcutPattern(text: string): boolean {
    const shortcutRegex = /\b(?:cmd|ctrl|shift|alt|option|enter|esc|tab|space|backspace|delete|del)\b/i;
    if (!shortcutRegex.test(text)) {
      return false;
    }
    return /\+/.test(text) || /[\(\[]/.test(text);
  }

  private containsMarkdownLink(text: string): boolean {
    return /\[[^\]]+\]\([^)]+\)/.test(text);
  }

  private containsUrlOrEmail(text: string): boolean {
    if (/https?:\/\/\S+/i.test(text)) {
      return true;
    }
    return /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text);
  }

  private containsHangulCommaRun(text: string): boolean {
    return /[가-힣],[가-힣]/.test(text);
  }

  private containsAllCapsAscii(text: string): boolean {
    return /\b[A-Z0-9]{3,}\b/.test(text);
  }
}
