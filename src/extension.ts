import * as vscode from 'vscode';
import { DiagnosticsManager } from './diagnostics';
import { BareunClient } from './bareunClient';
import { BkgaCodeActionProvider } from './codeActions';
import { BkgaHoverProvider } from './hoverProvider';
import { StatusBarManager } from './status';

let diagnosticsManager: DiagnosticsManager | undefined;
let statusBarManager: StatusBarManager | undefined;
let outputChannel: vscode.OutputChannel | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration();

  // Create status bar manager
  statusBarManager = new StatusBarManager();
  context.subscriptions.push(statusBarManager);

  // Create output channel for debug/info
  outputChannel = vscode.window.createOutputChannel('BKGA');
  context.subscriptions.push(outputChannel);
  
  // Share output channel with BareunClient
  BareunClient.setOutputChannel(outputChannel);

  // Create diagnostics manager with status callback
  diagnosticsManager = new DiagnosticsManager((state, issueCount) => {
    statusBarManager?.setState(state);
    if (issueCount !== undefined) {
      statusBarManager?.setIssueCount(issueCount);
    }
  });

  // Helper to check if document matches include patterns
  function shouldAnalyze(doc: vscode.TextDocument): boolean {
    if (doc.languageId !== 'markdown') return false;
    
    const includePaths = vscode.workspace.getConfiguration('bkga').get<string[]>('includePaths', ['**/*.md']);
    if (includePaths.length === 0) return true; // empty = all files
    
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(doc.uri);
    if (!workspaceFolder) return false;
    
    const relativePath = vscode.workspace.asRelativePath(doc.uri, false);
    
    // Check if file matches any include pattern
    return includePaths.some(pattern => {
      const glob = new vscode.RelativePattern(workspaceFolder, pattern);
      return vscode.languages.match({ pattern: glob, language: 'markdown' }, doc) > 0;
    });
  }

  // analyze all open markdown documents
  vscode.workspace.textDocuments.forEach((doc) => {
    if (shouldAnalyze(doc)) {
      diagnosticsManager?.analyzeDocument(doc);
    }
  });

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (shouldAnalyze(doc)) {
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
      if (shouldAnalyze(doc)) {
        scheduleAnalyze(doc);
      }
    })
  );

  // register code action provider for markdown
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: 'markdown' },
      new BkgaCodeActionProvider(diagnosticsManager!),
      { providedCodeActionKinds: BkgaCodeActionProvider.providedCodeActionKinds }
    )
  );

  // register hover provider for markdown
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: 'markdown' },
      new BkgaHoverProvider(diagnosticsManager!)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bkga.openSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'bkga');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bkga.showOutput', () => {
      vscode.commands.executeCommand('workbench.panel.markers.view.focus');
    })
  );

  // Debug command: show current diagnostics and config in output channel
  context.subscriptions.push(
    vscode.commands.registerCommand('bkga.debugStatus', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('BKGA: 활성화된 에디터가 없습니다');
        return;
      }

      const doc = editor.document;
      const diagnostics = diagnosticsManager?.getDiagnostics(doc.uri) || [];
      const cfg = vscode.workspace.getConfiguration('bkga');
      const endpoint = cfg.get<string>('bareun.endpoint') || '';
      const apiKey = cfg.get<string>('bareun.apiKey') || '';
      const enabled = cfg.get<boolean>('enabled', true);

      vscode.window.showInformationMessage(`BKGA debug: issues=${diagnostics.length}, endpoint=${endpoint ? 'set' : 'unset'}, apiKey=${apiKey ? 'set' : 'unset'}, enabled=${enabled}`);

      outputChannel?.appendLine(`=== BKGA Debug (${new Date().toLocaleString()}) ===`);
      outputChannel?.appendLine(`Document: ${doc.uri.toString()}`);
      outputChannel?.appendLine(`Language: ${doc.languageId}`);
      outputChannel?.appendLine(`Enabled: ${enabled}`);
      outputChannel?.appendLine(`Endpoint: ${endpoint ? endpoint : '<unset>'}`);
      outputChannel?.appendLine(`API Key: ${apiKey ? '<set>' : '<unset>'}`);
      outputChannel?.appendLine(`Issues: ${diagnostics.length}`);
      diagnostics.forEach((d) => {
        outputChannel?.appendLine(` - [${d.severity}] ${d.range.start.line + 1}:${d.range.start.character + 1} - ${d.message}`);
      });
      outputChannel?.show(true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bkga.toggleEnabled', () => {
      const config = vscode.workspace.getConfiguration('bkga');
      const current = config.get<boolean>('enabled', true);
      config.update('enabled', !current, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        `Korean Grammar Assistant ${!current ? '활성화됨' : '비활성화됨'}`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bkga.analyzeDocument', () => {
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
      if (e.affectsConfiguration('bkga')) {
        vscode.workspace.textDocuments.forEach((doc) => {
          if (doc.languageId === 'markdown') diagnosticsManager?.analyzeDocument(doc);
        });
      }
    })
  );
}

export function deactivate() {
  diagnosticsManager?.dispose();
  statusBarManager?.dispose();
}
