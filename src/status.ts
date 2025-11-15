import * as vscode from 'vscode';

export type AnalysisState = 'idle' | 'analyzing' | 'success' | 'error' | 'fallback';

/**
 * Manages the status bar item showing analysis state and issue count.
 */
export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private issueCount: number = 0;
  private state: AnalysisState = 'idle';

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'bkga.showOutput';
    this.updateStatusBar();
    this.statusBarItem.show();
  }

  /**
   * Update the analysis state (idle, analyzing, success, error)
   */
  setState(state: AnalysisState): void {
    this.state = state;
    this.updateStatusBar();
  }

  /**
   * Update the issue count displayed in status bar
   */
  setIssueCount(count: number): void {
    this.issueCount = count;
    this.updateStatusBar();
  }

  /**
   * Update status bar text and icon based on current state
   */
  private updateStatusBar(): void {
    switch (this.state) {
      case 'analyzing':
        this.statusBarItem.text = '$(sync~spin) BKGA: 분석 중...';
        this.statusBarItem.tooltip = 'Korean Grammar Assistant가 문서를 분석하고 있습니다';
        this.statusBarItem.backgroundColor = undefined;
        break;

      case 'error':
        this.statusBarItem.text = '$(error) BKGA: 오류';
        this.statusBarItem.tooltip = '분석 중 오류가 발생했습니다. 출력 패널을 확인하세요';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        break;

      case 'success':
        if (this.issueCount > 0) {
          this.statusBarItem.text = `$(warning) BKGA: ${this.issueCount}개 문제`;
          this.statusBarItem.tooltip = `${this.issueCount}개의 문법/맞춤법 문제 발견`;
          this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
          this.statusBarItem.text = '$(check) BKGA: 문제 없음';
          this.statusBarItem.tooltip = '문법/맞춤법 문제가 발견되지 않았습니다';
          this.statusBarItem.backgroundColor = undefined;
        }
        break;

      case 'fallback':
        this.statusBarItem.text = '$(shield) BKGA: 로컬 검사';
        this.statusBarItem.tooltip =
          'Bareun API 응답이 없어 로컬 휴리스틱만 실행 중입니다. 설정에서 API 키/엔드포인트를 확인하세요.';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        break;

      case 'idle':
      default:
        this.statusBarItem.text = '$(book) BKGA';
        this.statusBarItem.tooltip = 'Smart Korean Grammar Assistant';
        this.statusBarItem.backgroundColor = undefined;
        break;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
