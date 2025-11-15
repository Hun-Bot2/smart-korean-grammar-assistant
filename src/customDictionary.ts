import * as vscode from 'vscode';
import { BareunClient, UpdateCustomDictionaryRequest } from './bareunClient';
import { DictKey } from './customDictionaryMeta';
import { DEFAULT_BAREUN_CUSTOM_DICTIONARY_ENDPOINT } from './constants';

interface CustomDictionaryConfig {
  enabled: boolean;
  endpoint: string;
  domainName: string;
  npSet: string[];
  cpSet: string[];
  cpCaretSet: string[];
  vvSet: string[];
  vaSet: string[];
}

export type CustomDictionarySnapshot = Record<DictKey, string[]>;

export class CustomDictionaryService {
  constructor(private output?: vscode.OutputChannel) {}

  setOutputChannel(channel: vscode.OutputChannel) {
    this.output = channel;
  }

  async addEntry(word: string, dictKey: DictKey): Promise<boolean> {
    const trimmed = word.trim();
    if (!trimmed) {
      vscode.window.showWarningMessage('추가할 단어가 비어 있습니다.');
      return false;
    }

    const config = vscode.workspace.getConfiguration('bkga');
    const key = `customDictionary.${dictKey}`;
    const entries = config.get<string[]>(key, []);
    if (entries.includes(trimmed)) {
      vscode.window.showInformationMessage('이미 사용자 사전에 포함된 단어입니다.');
      return false;
    }

    const target = this.getUpdateTarget();
    await config.update(key, [...entries, trimmed], target);
    this.output?.appendLine(`[CustomDictionary] Added "${trimmed}" to ${dictKey}`);
    return true;
  }

  async removeEntry(word: string, dictKey: DictKey): Promise<boolean> {
    const trimmed = word.trim();
    if (!trimmed) {
      vscode.window.showWarningMessage('삭제할 단어가 비어 있습니다.');
      return false;
    }

    const config = vscode.workspace.getConfiguration('bkga');
    const key = `customDictionary.${dictKey}`;
    const entries = config.get<string[]>(key, []);
    if (!entries.includes(trimmed)) {
      vscode.window.showInformationMessage('사용자 사전에 존재하지 않는 단어입니다.');
      return false;
    }

    const updated = entries.filter((entry) => entry !== trimmed);
    const target = this.getUpdateTarget();
    await config.update(key, updated, target);
    this.output?.appendLine(`[CustomDictionary] Removed "${trimmed}" from ${dictKey}`);
    return true;
  }

  async sync(options?: { silent?: boolean }): Promise<void> {
    const cfg = this.getConfig();
    if (!cfg.enabled) {
      if (!options?.silent) {
        vscode.window.showWarningMessage('사용자 사전 기능이 비활성화되어 있습니다. 설정을 확인해주세요.');
      }
      return;
    }

    if (!cfg.endpoint) {
      vscode.window.showWarningMessage('사용자 사전 API 엔드포인트가 설정되지 않았습니다.');
      return;
    }

    if (!cfg.domainName) {
      vscode.window.showWarningMessage('사용자 사전 도메인 이름을 설정해주세요.');
      return;
    }

    const apiKey = vscode.workspace.getConfiguration('bkga').get<string>('bareun.apiKey') || '';
    if (!apiKey) {
      vscode.window.showWarningMessage('Bareun API 키가 설정되어야 사용자 사전을 동기화할 수 있습니다.');
      return;
    }

    const payload = this.buildPayload(cfg);
    const success = await BareunClient.updateCustomDictionary(cfg.endpoint, apiKey, payload);
    if (success) {
      if (!options?.silent) {
        vscode.window.showInformationMessage('사용자 사전이 Bareun API와 동기화되었습니다.');
      }
    } else {
      vscode.window.showErrorMessage('사용자 사전 동기화에 실패했습니다. 출력 창을 확인해주세요.');
    }
  }

  private getConfig(): CustomDictionaryConfig {
    const config = vscode.workspace.getConfiguration('bkga');
    return {
      enabled: config.get<boolean>('customDictionary.enabled', false),
      endpoint:
        config.get<string>('customDictionary.endpoint', '')?.trim() ||
        DEFAULT_BAREUN_CUSTOM_DICTIONARY_ENDPOINT,
      domainName: config.get<string>('customDictionary.domainName', '').trim(),
      npSet: config.get<string[]>('customDictionary.npSet', []),
      cpSet: config.get<string[]>('customDictionary.cpSet', []),
      cpCaretSet: config.get<string[]>('customDictionary.cpCaretSet', []),
      vvSet: config.get<string[]>('customDictionary.vvSet', []),
      vaSet: config.get<string[]>('customDictionary.vaSet', []),
    };
  }

  getSnapshot(): CustomDictionarySnapshot {
    const cfg = this.getConfig();
    return {
      npSet: cfg.npSet,
      cpSet: cfg.cpSet,
      cpCaretSet: cfg.cpCaretSet,
      vvSet: cfg.vvSet,
      vaSet: cfg.vaSet,
    };
  }

  lookup(word: string): DictKey[] {
    const trimmed = word.trim();
    if (!trimmed) {
      return [];
    }
    const snapshot = this.getSnapshot();
    const matches: DictKey[] = [];
    (Object.keys(snapshot) as DictKey[]).forEach((key) => {
      const arr = snapshot[key] || [];
      if (arr.includes(trimmed)) {
        matches.push(key);
      }
    });
    return matches;
  }

  isEnabled(): boolean {
    return this.getConfig().enabled;
  }

  getDomainName(): string {
    return this.getConfig().domainName;
  }

  private buildPayload(cfg: CustomDictionaryConfig): UpdateCustomDictionaryRequest {
    return {
      domain_name: cfg.domainName,
      dict: {
        domain_name: cfg.domainName,
        np_set: this.buildDictSet(cfg.npSet, 'np_set'),
        cp_set: this.buildDictSet(cfg.cpSet, 'cp_set'),
        cp_caret_set: this.buildDictSet(cfg.cpCaretSet, 'cp_caret_set', 'WORD_LIST_COMPOUND'),
        vv_set: this.buildDictSet(cfg.vvSet, 'vv_set'),
        va_set: this.buildDictSet(cfg.vaSet, 'va_set'),
      },
    };
  }

  private buildDictSet(
    entries: string[],
    name: string,
    type: 'WORD_LIST' | 'WORD_LIST_COMPOUND' = 'WORD_LIST'
  ) {
    const cleaned = entries
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    if (cleaned.length === 0) {
      return undefined;
    }
    const items = cleaned.reduce<Record<string, number>>((acc, entry) => {
      acc[entry] = 1;
      return acc;
    }, {});

    return {
      items,
      type,
      name,
    };
  }

  private getUpdateTarget(): vscode.ConfigurationTarget {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      return vscode.ConfigurationTarget.Workspace;
    }
    return vscode.ConfigurationTarget.Global;
  }
}
