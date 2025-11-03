import * as vscode from 'vscode';
import { DiagnosticsManager } from './diagnostics';

export class SkgaCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  constructor(private diagnosticsManager: DiagnosticsManager) {}

  provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken) {
    const actions: vscode.CodeAction[] = [];

    for (const diag of context.diagnostics) {
      const suggestion = (diag as any).suggestion;
      if (suggestion) {
        const fix = new vscode.CodeAction('Replace with suggestion', vscode.CodeActionKind.QuickFix);
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.replace(document.uri, diag.range, suggestion);
        fix.diagnostics = [diag];
        actions.push(fix);
      }
    }

    return actions;
  }
}
