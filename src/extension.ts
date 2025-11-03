import * as vscode from 'vscode';
import { DiagnosticsManager } from './diagnostics';
import { BareunClient } from './bareunClient';
import { SkgaCodeActionProvider } from './codeActions';

let diagnosticsManager: DiagnosticsManager | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration();

  diagnosticsManager = new DiagnosticsManager();

  // analyze all open markdown documents
  vscode.workspace.textDocuments.forEach((doc) => {
    if (doc.languageId === 'markdown') {
      diagnosticsManager?.analyzeDocument(doc);
    }
  });

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.languageId === 'markdown') {
        diagnosticsManager?.analyzeDocument(doc);
      }
    })
  );

  // Debounced analysis to avoid overloading during rapid typing
  const pending = new Map<string, NodeJS.Timeout>();
  const scheduleAnalyze = (doc: vscode.TextDocument) => {
    const key = doc.uri.toString();
    if (pending.has(key)) clearTimeout(pending.get(key)!);
    const t = setTimeout(() => {
      diagnosticsManager?.analyzeDocument(doc);
      pending.delete(key);
    }, 350);
    pending.set(key, t);
  };

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      const doc = e.document;
      if (doc.languageId === 'markdown') {
        scheduleAnalyze(doc);
      }
    })
  );

  // register code action provider for markdown
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: 'markdown' },
      new SkgaCodeActionProvider(diagnosticsManager!),
      { providedCodeActionKinds: SkgaCodeActionProvider.providedCodeActionKinds }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('skga.openSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'skga');
    })
  );

  // watch configuration changes and re-analyze
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('skga')) {
        vscode.workspace.textDocuments.forEach((doc) => {
          if (doc.languageId === 'markdown') diagnosticsManager?.analyzeDocument(doc);
        });
      }
    })
  );

  console.log('Smart Korean Grammar Assistant activated');
}

export function deactivate() {
  diagnosticsManager?.dispose();
}
