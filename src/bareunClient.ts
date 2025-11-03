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
    if (!apiKey) {
      console.warn('Bareun API key not configured, using local heuristics');
      return [];
    }

    try {
      const url = new URL(endpoint);
      const payload = JSON.stringify({ text });

      const opts: https.RequestOptions = {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname,
        port: 443,
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          'Content-Length': Buffer.byteLength(payload).toString()
        }
      };

      return await new Promise<BareunIssue[]>((resolve, reject) => {
        const req = https.request(opts, (res) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode !== 200) {
              console.error(`Bareun API error: ${res.statusCode} - ${data}`);
              resolve([]);
              return;
            }
            
            try {
              const json = JSON.parse(data);
              // Parse Bareun API response format
              const issues: BareunIssue[] = [];
              
              // Bareun may return errors/corrections in different formats
              // Adjust this based on actual API response
              if (json.errors && Array.isArray(json.errors)) {
                json.errors.forEach((err: any) => {
                  issues.push({
                    start: err.start ?? err.begin ?? 0,
                    end: err.end ?? err.start + (err.length || 1),
                    message: err.message || err.help || '문법 오류',
                    suggestion: err.replacement || err.correction || undefined,
                    severity: err.type === 'error' ? 'error' : 'warning'
                  });
                });
              }
              
              resolve(issues);
            } catch (err) {
              console.error('Failed to parse Bareun response:', err);
              resolve([]);
            }
          });
        });

        req.on('error', (e) => {
          console.error('Bareun API request failed:', e);
          resolve([]);
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          console.error('Bareun API timeout');
          resolve([]);
        });

        req.write(payload);
        req.end();
      });
    } catch (err) {
      console.error('Bareun client error:', err);
      return [];
    }
  }
}
