import * as assert from 'assert';

// NOTE: Full unit tests for DiagnosticsManager require vscode-test EDH.
// This file is a placeholder that can be run with: npm run test:unit
// For now, we test the Markdown filter utility which doesn't need vscode.

import { getExcludedRanges } from '../../src/util/markdownFilter';

describe('Markdown Filter (unit)', () => {
  it('should detect fenced code blocks', () => {
    const md = '# Title\n\n```js\ncode\n```\n\ntext';
    const ranges = getExcludedRanges(md);
    assert.ok(ranges.length >= 1);
    assert.ok(ranges.some(r => md.substring(r.start, r.end).includes('code')));
  });

  it('should detect inline code', () => {
    const md = 'Hello `world` test';
    const ranges = getExcludedRanges(md);
    assert.ok(ranges.length >= 1);
    assert.ok(ranges.some(r => md.substring(r.start, r.end) === '`world`'));
  });
});
