import * as vscode from 'vscode';
import { DiagnosticsManager } from './diagnostics';
import { BareunClient } from './bareunClient';
import { SkgaCodeActionProvider } from './codeActions';
import { SkgaHoverProvider } from './hoverProvider';
import { StatusBarManager } from './status';

let diagnosticsManager: DiagnosticsManager | undefined;
let statusBarManager: StatusBarManager | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration();

  // Create status bar manager
  statusBarManager = new StatusBarManager();
  context.subscriptions.push(statusBarManager);

  // Create diagnostics manager with status callback
  diagnosticsManager = new DiagnosticsManager((state, issueCount) => {
    statusBarManager?.setState(state);
    if (issueCount !== undefined) {
      statusBarManager?.setIssueCount(issueCount);
    }
  });

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

  // register hover provider for markdown
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: 'markdown' },
      new SkgaHoverProvider(diagnosticsManager!)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('skga.openSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'skga');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('skga.showOutput', () => {
      vscode.commands.executeCommand('workbench.panel.markers.view.focus');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('skga.toggleEnabled', () => {
      const config = vscode.workspace.getConfiguration('skga');
      const current = config.get<boolean>('enabled', true);
      config.update('enabled', !current, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        `Korean Grammar Assistant ${!current ? '활성화됨' : '비활성화됨'}`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('skga.analyzeDocument', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        diagnosticsManager?.analyzeDocument(editor.document);
        vscode.window.showInformationMessage('문서 분석 시작...');
      } else {
        vscode.window.showWarningMessage('활성 Markdown 문서가 없습니다');
      }
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
  statusBarManager?.dispose();
}
