import * as vscode from 'vscode';
import { DiagnosticsManager } from './diagnostics';
import { BareunClient } from './bareunClient';
import { BkgaCodeActionProvider } from './codeActions';
import { BkgaHoverProvider } from './hoverProvider';
import { StatusBarManager } from './status';
import { applyDecorations, clearDecorations, disposeDecorations } from './decorations';
import { CustomDictionaryService } from './customDictionary';
import { DictKey } from './customDictionaryMeta';
import { CustomDictionaryPanel } from './customDictionaryPanel';
import { DEFAULT_BAREUN_REVISION_ENDPOINT } from './constants';

let diagnosticsManager: DiagnosticsManager | undefined;
let statusBarManager: StatusBarManager | undefined;
let outputChannel: vscode.OutputChannel | undefined;
let customDictionaryService: CustomDictionaryService | undefined;

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
  customDictionaryService = new CustomDictionaryService(outputChannel);

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

  function refreshDecorations(doc: vscode.TextDocument) {
    vscode.window.visibleTextEditors.forEach((editor) => {
      if (editor.document.uri.toString() !== doc.uri.toString()) {
        return;
      }

      if (!shouldAnalyze(doc)) {
        clearDecorations(editor);
        return;
      }

      const diagnostics = diagnosticsManager?.getDiagnostics(doc.uri) || [];
      applyDecorations(editor, diagnostics);
    });
  }

  // Analyze active document
  if (vscode.window.activeTextEditor) {
    const doc = vscode.window.activeTextEditor.document;
    if (shouldAnalyze(doc)) {
      diagnosticsManager.analyzeDocument(doc).then(() => {
        refreshDecorations(doc);
      });
    } else {
      diagnosticsManager.clearDiagnostics(doc.uri);
      refreshDecorations(doc);
    }
  }

  // Apply decorations when changing active editor
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        refreshDecorations(editor.document);
      }
    })
  );

  // Re-analyze on document change (debounce to avoid excessive calls)
  let debounceTimer: NodeJS.Timeout | undefined;
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        const targetDoc = e.document;
        if (!shouldAnalyze(targetDoc)) {
          diagnosticsManager?.clearDiagnostics(targetDoc.uri);
          refreshDecorations(targetDoc);
          return;
        }

        diagnosticsManager?.analyzeDocument(targetDoc)?.then(() => {
          refreshDecorations(targetDoc);
        });
      }, 350);
    })
  );  // register code action provider for markdown
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
      new BkgaHoverProvider(diagnosticsManager!, customDictionaryService!)
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
      const endpointSetting = cfg.get<string>('bareun.endpoint')?.trim() || '';
      const endpoint = endpointSetting || DEFAULT_BAREUN_REVISION_ENDPOINT;
      const apiKey = cfg.get<string>('bareun.apiKey')?.trim() || '';
      const enabled = cfg.get<boolean>('enabled', true);
      const endpointStatus = endpointSetting ? 'custom' : 'default';

      vscode.window.showInformationMessage(`BKGA debug: issues=${diagnostics.length}, endpoint=${endpointStatus}, apiKey=${apiKey ? 'set' : 'unset'}, enabled=${enabled}`);

      outputChannel?.appendLine(`=== BKGA Debug (${new Date().toLocaleString()}) ===`);
      outputChannel?.appendLine(`Document: ${doc.uri.toString()}`);
      outputChannel?.appendLine(`Language: ${doc.languageId}`);
      outputChannel?.appendLine(`Enabled: ${enabled}`);
      outputChannel?.appendLine(`Endpoint: ${endpoint}${endpointSetting ? '' : ' (default)'}`);
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
      if (!editor || editor.document.languageId !== 'markdown') {
        vscode.window.showWarningMessage('마크다운 문서만 분석할 수 있습니다.');
        return;
      }
      diagnosticsManager?.analyzeDocument(editor.document)?.then(() => {
        refreshDecorations(editor.document);
      });
      vscode.window.showInformationMessage('문서 분석을 시작합니다...');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bkga.fixSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('활성화된 에디터가 없습니다.');
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showWarningMessage('텍스트를 선택해주세요.');
        return;
      }

      const selectedText = editor.document.getText(selection);
      const cfg = vscode.workspace.getConfiguration('bkga');
      const endpointSetting = cfg.get<string>('bareun.endpoint')?.trim() || '';
      const endpoint = endpointSetting || DEFAULT_BAREUN_REVISION_ENDPOINT;
      const apiKey = cfg.get<string>('bareun.apiKey')?.trim() || undefined;

      if (!apiKey) {
        vscode.window.showWarningMessage('Bareun API 키가 필요합니다.');
        return;
      }

      try {
        statusBarManager?.setState('analyzing');
        vscode.window.showInformationMessage('선택한 텍스트를 분석 중...');
        
        const issues = await BareunClient.analyze(endpoint, apiKey, selectedText);
        
        if (issues.length === 0) {
          statusBarManager?.setState('success');
          vscode.window.showInformationMessage('문제가 발견되지 않았습니다.');
          return;
        }

        // Apply all fixes from end to start to maintain correct positions
        let fixedText = selectedText;
        const sortedIssues = [...issues].sort((a, b) => b.start - a.start);
        
        for (const issue of sortedIssues) {
          if (issue.suggestion) {
            fixedText = fixedText.substring(0, issue.start) + 
                       issue.suggestion + 
                       fixedText.substring(issue.end);
          }
        }

        await editor.edit(editBuilder => {
          editBuilder.replace(selection, fixedText);
        });

        statusBarManager?.setState('success');
        vscode.window.showInformationMessage(`${issues.length}개의 문제를 수정했습니다.`);
      } catch (err) {
        statusBarManager?.setState('error');
        vscode.window.showErrorMessage('분석 중 오류가 발생했습니다.');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bkga.syncCustomDictionary', async () => {
      await customDictionaryService?.sync();
      CustomDictionaryPanel.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bkga.addSelectionToCustomDictionary', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('활성화된 에디터가 없습니다.');
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showWarningMessage('사용자 사전에 추가할 텍스트를 선택해주세요.');
        return;
      }

      const text = editor.document.getText(selection).trim();
      if (!text) {
        vscode.window.showWarningMessage('선택한 텍스트가 비어 있습니다.');
        return;
      }

      const dictType = await vscode.window.showQuickPick(
        [
          { label: '고유명사 (np_set)', value: 'npSet', detail: '인명, 작품명 등 단일 명사' },
          { label: '복합명사 (cp_set)', value: 'cpSet', detail: '여러 단어로 구성된 복합 명사' },
          { label: '복합명사 분리 (cp_caret_set)', value: 'cpCaretSet', detail: '^ 로 분리된 복합명사' },
          { label: '동사 (vv_set)', value: 'vvSet', detail: '새로운 동사/용언' },
          { label: '형용사 (va_set)', value: 'vaSet', detail: '새로운 형용사/형용사적 표현' },
        ],
        { placeHolder: '추가할 사용자 사전 종류를 선택하세요.' }
      );

      if (!dictType) {
        return;
      }

      const added = await customDictionaryService?.addEntry(text, dictType.value as DictKey);
      if (added) {
        await customDictionaryService?.sync({ silent: true });
        CustomDictionaryPanel.refresh();
        vscode.window.showInformationMessage(`"${text}"을(를) 사용자 사전에 추가했습니다.`);
      }
    })
  );

  const extractArgs = (raw: any): { word: string; dictKey: DictKey } | undefined => {
    const payload = Array.isArray(raw) ? raw[0] : raw;
    if (!payload || typeof payload.word !== 'string' || typeof payload.dictKey !== 'string') {
      return undefined;
    }
    return payload as { word: string; dictKey: DictKey };
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('bkga.addWordToCustomDictionary', async (rawArgs) => {
      const args = extractArgs(rawArgs);
      if (!args) {
        vscode.window.showWarningMessage('추가할 단어 정보가 올바르지 않습니다.');
        return;
      }
      const added = await customDictionaryService?.addEntry(args.word, args.dictKey);
      if (added) {
        await customDictionaryService?.sync({ silent: true });
        CustomDictionaryPanel.refresh();
        vscode.window.showInformationMessage(`"${args.word}"을(를) 사용자 사전에 추가했습니다.`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bkga.removeWordFromCustomDictionary', async (rawArgs) => {
      const args = extractArgs(rawArgs);
      if (!args) {
        vscode.window.showWarningMessage('삭제할 단어 정보가 올바르지 않습니다.');
        return;
      }
      const removed = await customDictionaryService?.removeEntry(args.word, args.dictKey);
      if (removed) {
        await customDictionaryService?.sync({ silent: true });
        CustomDictionaryPanel.refresh();
        vscode.window.showInformationMessage(`"${args.word}"을(를) 사용자 사전에서 삭제했습니다.`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bkga.showCustomDictionary', async () => {
      CustomDictionaryPanel.render(context);
    })
  );

  // watch configuration changes and re-analyze
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('bkga')) {
        vscode.workspace.textDocuments.forEach((doc) => {
          if (shouldAnalyze(doc)) {
            diagnosticsManager?.analyzeDocument(doc)?.then(() => {
              refreshDecorations(doc);
            });
          } else {
            diagnosticsManager?.clearDiagnostics(doc.uri);
            refreshDecorations(doc);
          }
        });
      }
      CustomDictionaryPanel.refresh();
    })
  );
}

export function deactivate() {
  diagnosticsManager?.dispose();
  statusBarManager?.dispose();
  disposeDecorations();
}
