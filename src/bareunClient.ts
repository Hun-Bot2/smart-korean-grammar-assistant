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
              resolve([]);
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
              resolve([]);
            }
          });
        });

        req.on('error', (e) => {
          out.appendLine(`Bareun request error: ${String(e)}`);
          resolve([]);
        });

        req.setTimeout(5000, () => {
          req.destroy();
          out.appendLine('Bareun request timeout');
          resolve([]);
        });

        req.write(payload);
        req.end();
      });
    } catch (err) {
      return [];
    }
  }
}
