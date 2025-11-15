import * as https from 'https';
import { URL } from 'url';
import * as vscode from 'vscode';

export type BareunIssue = {
  start: number;
  end: number;
  message: string;
  suggestion?: string;
  severity?: 'error' | 'warning' | 'info';
};

export type DictSetPayload = {
  items: Record<string, number>;
  type: 'WORD_LIST' | 'WORD_LIST_COMPOUND';
  name?: string;
};

export type UpdateCustomDictionaryRequest = {
  domain_name: string;
  dict: {
    domain_name: string;
    np_set?: DictSetPayload;
    cp_set?: DictSetPayload;
    cp_caret_set?: DictSetPayload;
    vv_set?: DictSetPayload;
    va_set?: DictSetPayload;
  };
};

let outputChannel: vscode.OutputChannel | undefined;

export class BareunClient {
  static setOutputChannel(channel: vscode.OutputChannel) {
    outputChannel = channel;
  }
  
  static async analyze(endpoint: string, apiKey: string | undefined, text: string): Promise<BareunIssue[]> {
    const out = outputChannel || vscode.window.createOutputChannel('BKGA-fallback');
    
    if (!endpoint) {
      out.appendLine('Bareun endpoint not configured, skipping API call');
      return [];
    }
    if (!apiKey) {
      out.appendLine('Bareun API key not configured, skipping API call');
      return [];
    }

    try {
      const url = new URL(endpoint);
      // Bareun API request format
      const payload = JSON.stringify({
        document: {
          content: text,
          language: "ko-KR"
        },
        encoding_type: "UTF32"
      });

      const opts: https.RequestOptions = {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname + (url.search || ''),
        port: url.port ? Number(url.port) : 443,
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
           'Content-Length': Buffer.byteLength(payload).toString(),
           'User-Agent': 'BKGA-VSCode/1.0',
        },
        rejectUnauthorized: false  // SSL certificate verification disabled (Bareun API cert chain issue)
      };

      out.appendLine('--- Bareun API Request ---');
      out.appendLine(`Bareun request -> ${opts.method} https://${opts.hostname}${opts.path}`);
      out.appendLine(`Payload length: ${Buffer.byteLength(payload)}`);

      return await new Promise<BareunIssue[]>((resolve, reject) => {
        const req = https.request(opts, (res) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            out.appendLine(`Bareun response status: ${res.statusCode}`);
            out.appendLine(`Bareun response body: ${data}`);

            if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
              reject(new Error(`Bareun HTTP ${res.statusCode ?? 'unknown'}`));
              return;
            }

            try {
              const json = JSON.parse(data);
              const issues: BareunIssue[] = [];

              // Parse Bareun API response - revisedBlocks contains corrections
              if (json.revisedBlocks && Array.isArray(json.revisedBlocks)) {
                json.revisedBlocks.forEach((block: any) => {
                  if (block.revisions && block.revisions.length > 0) {
                    // Block has corrections
                    const offset = block.origin?.beginOffset || 0;
                    const length = block.origin?.length || 0;

                    issues.push({
                      start: offset,
                      end: offset + length,
                      message: `${block.revisions[0].category}: ${block.revised}`,
                      suggestion: block.revised,
                      severity: block.revisions[0].category === 'TYPO' ? 'error' : 'warning'
                    });
                  }
                });
              }

              out.appendLine(`Parsed issues count: ${issues.length}`);
              resolve(issues);
            } catch (err) {
              out.appendLine(`Failed to parse Bareun response: ${String(err)}`);
              reject(err instanceof Error ? err : new Error(String(err)));
            }
          });
        });

        req.on('error', (e) => {
          out.appendLine(`Bareun request error: ${String(e)}`);
          reject(e instanceof Error ? e : new Error(String(e)));
        });

        req.setTimeout(5000, () => {
          req.destroy();
          out.appendLine('Bareun request timeout');
          reject(new Error('Bareun request timeout'));
        });

        req.write(payload);
        req.end();
      });
    } catch (err) {
      out.appendLine(`Bareun analyze aborted: ${String(err)}`);
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  static async updateCustomDictionary(
    endpoint: string,
    apiKey: string | undefined,
    payload: UpdateCustomDictionaryRequest
  ): Promise<boolean> {
    const out = outputChannel || vscode.window.createOutputChannel('BKGA-fallback');

    if (!endpoint) {
      out.appendLine('Custom dictionary endpoint not configured.');
      return false;
    }

    if (!apiKey) {
      out.appendLine('Bareun API key not configured. Cannot sync custom dictionary.');
      return false;
    }

    try {
      const url = new URL(endpoint);
      const body = JSON.stringify(payload);

      const opts: https.RequestOptions = {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname + (url.search || ''),
        port: url.port ? Number(url.port) : 443,
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          'Content-Length': Buffer.byteLength(body).toString(),
          'User-Agent': 'BKGA-VSCode/1.0 CustomDictionary',
        },
        rejectUnauthorized: false,
      };

      out.appendLine('--- Bareun Custom Dictionary Request ---');
      out.appendLine(`Endpoint -> ${opts.method} https://${opts.hostname}${opts.path}`);
      out.appendLine(`Payload length: ${Buffer.byteLength(body)}`);

      return await new Promise<boolean>((resolve) => {
        const req = https.request(opts, (res) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            out.appendLine(`Custom dictionary response status: ${res.statusCode}`);
            out.appendLine(`Custom dictionary response body: ${data}`);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(true);
            } else {
              resolve(false);
            }
          });
        });

        req.on('error', (err) => {
          out.appendLine(`Custom dictionary request error: ${String(err)}`);
          resolve(false);
        });

        req.setTimeout(5000, () => {
          req.destroy();
          out.appendLine('Custom dictionary request timeout');
          resolve(false);
        });

        req.write(body);
        req.end();
      });
    } catch (err) {
      out.appendLine(`Custom dictionary request failed: ${String(err)}`);
      return false;
    }
  }
}
