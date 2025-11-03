import * as https from 'https';
import { URL } from 'url';

export type BareunIssue = {
  start: number;
  end: number;
  message: string;
  suggestion?: string;
  severity?: 'error' | 'warning' | 'info';
};

export class BareunClient {
  static async analyze(endpoint: string, apiKey: string | undefined, text: string): Promise<BareunIssue[]> {
    if (!endpoint) return [];

    try {
      const url = new URL(endpoint);
      const payload = JSON.stringify({ text });

      const opts: https.RequestOptions = {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname + (url.search || ''),
        port: url.port ? parseInt(url.port) : undefined,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload).toString(),
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
        }
      };

      return await new Promise<BareunIssue[]>((resolve, reject) => {
        const req = https.request(opts, (res) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              // Expecting json.issues[] with start/end/message/suggestion/severity
              const issues = (json.issues || []).map((i: any) => ({
                start: i.start ?? 0,
                end: i.end ?? 0,
                message: i.message ?? i.msg ?? '문장 오류',
                suggestion: i.suggestion || i.fix || undefined,
                severity: i.severity || 'warning'
              }));
              resolve(issues);
            } catch (err) {
              reject(err);
            }
          });
        });

        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
      });
    } catch (err) {
      return [];
    }
  }
}
