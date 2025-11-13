import * as vscode from 'vscode';

// Decoration types for different error categories
export const decorationTypes = {
  spelling: vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline wavy',
    color: new vscode.ThemeColor('bkga.spelling'),
  }),
  spacing: vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline wavy',
    color: new vscode.ThemeColor('bkga.spacing'),
  }),
  standard: vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline wavy',
    color: new vscode.ThemeColor('bkga.standard'),
  }),
  statistical: vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline wavy',
    color: new vscode.ThemeColor('bkga.statistical'),
  }),
  default: vscode.window.createTextEditorDecorationType({
    textDecoration: 'underline wavy',
    color: new vscode.ThemeColor('editorError.foreground'),
  }),
};

// Map Bareun API category codes to decoration types
export function getCategoryDecorationType(category: string): vscode.TextEditorDecorationType {
  const normalized = (category || '').toUpperCase();

  if (normalized.includes('맞춤법') || normalized.includes('SPELLING') || normalized.includes('TYPO')) {
    return decorationTypes.spelling;
  }
  if (normalized.includes('띄어쓰기') || normalized.includes('SPACING')) {
    return decorationTypes.spacing;
  }
  if (normalized.includes('표준어') || normalized.includes('STANDARD')) {
    return decorationTypes.standard;
  }
  if (normalized.includes('통계') || normalized.includes('STATISTICAL')) {
    return decorationTypes.statistical;
  }
  return decorationTypes.default;
}

// Apply decorations to editor based on diagnostics
export function applyDecorations(editor: vscode.TextEditor, diagnostics: readonly vscode.Diagnostic[]) {
  const decorationMap = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();

  Object.values(decorationTypes).forEach((type) => {
    decorationMap.set(type, []);
  });

  diagnostics.forEach((diag) => {
    if (diag.source !== 'BKGA') {
      return;
    }
    const category = typeof diag.code === 'string' ? diag.code : '';
    const decorationType = getCategoryDecorationType(category);
    decorationMap.get(decorationType)?.push(diag.range);
  });

  decorationMap.forEach((ranges, decorationType) => {
    editor.setDecorations(decorationType, ranges);
  });
}

// Clear all decorations from editor
export function clearDecorations(editor: vscode.TextEditor) {
  Object.values(decorationTypes).forEach((type) => {
    editor.setDecorations(type, []);
  });
}

// Dispose all decoration types (call on extension deactivation)
export function disposeDecorations() {
  Object.values(decorationTypes).forEach((type) => type.dispose());
}
