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
        path: url.pathname,
        port: 443,
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          'Content-Length': Buffer.byteLength(payload).toString()
        },
        rejectUnauthorized: false  // SSL 인증서 검증 비활성화 (개발용)
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
            
            console.log('Bareun API response:', data); // 디버깅용
            
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
              
              console.log('Parsed issues:', issues); // 디버깅용
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
