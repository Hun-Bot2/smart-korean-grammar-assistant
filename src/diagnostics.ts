import * as vscode from 'vscode';
import { BareunClient, BareunIssue } from './bareunClient';
import { getExcludedRanges } from './util/markdownFilter';
import { AnalysisState } from './status';

export type StatusCallback = (state: AnalysisState, issueCount?: number) => void;

export class DiagnosticsManager {
  private collection: vscode.DiagnosticCollection;
  private statusCallback?: StatusCallback;

  constructor(statusCallback?: StatusCallback) {
    this.collection = vscode.languages.createDiagnosticCollection('skga');
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

  async analyzeDocument(doc: vscode.TextDocument) {
    if (!vscode.workspace.getConfiguration().get('skga.enabled')) {
      this.collection.delete(doc.uri);
      this.statusCallback?.('idle');
      return;
    }

    this.statusCallback?.('analyzing');

    const endpoint = vscode.workspace.getConfiguration().get<string>('skga.bareun.endpoint') || '';
    const apiKey = vscode.workspace.getConfiguration().get<string>('skga.bareun.apiKey') || undefined;

    let issues: BareunIssue[] = [];
    if (endpoint) {
      try {
        issues = await BareunClient.analyze(endpoint, apiKey, doc.getText());
      } catch (err) {
        // fall back to local heuristics
        this.statusCallback?.('error');
        issues = this.localHeuristics(doc.getText());
      }
    } else {
      issues = this.localHeuristics(doc.getText());
    }

    // Filter out issues that fall inside excluded Markdown ranges (code blocks, inline code)
    const excluded = getExcludedRanges(doc.getText());

    const diagnostics: vscode.Diagnostic[] = issues
      .filter((iss) => {
        // if any excluded range fully contains the issue range, drop it
        for (const ex of excluded) {
          if (iss.start >= ex.start && iss.end <= ex.end) return false;
        }
        return true;
      })
      .map((iss) => {
        const startPos = doc.positionAt(iss.start);
        const endPos = doc.positionAt(iss.end);
        const range = new vscode.Range(startPos, endPos);
        const diag = new vscode.Diagnostic(range, iss.message, this.mapSeverity(iss.severity));
        diag.source = 'SKGA';
        if (iss.suggestion) {
          (diag as any).suggestion = iss.suggestion;
        }
        return diag;
      });

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
}
