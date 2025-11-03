export type Range = { start: number; end: number };

// Very small Markdown filter that finds fenced code blocks and inline code spans
export function getExcludedRanges(markdown: string): Range[] {
  const ranges: Range[] = [];

  // Fenced code blocks (``` ... ```), support language hints
  const fenceRe = /(^```[\s\S]*?^```)/gm;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(markdown))) {
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }

  // Inline code spans using single backticks (avoid matching triple/fenced)
  const inlineRe = /`([^`\n]+?)`/g;
  while ((m = inlineRe.exec(markdown))) {
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }

  // Collapse overlapping ranges
  ranges.sort((a, b) => a.start - b.start);
  const merged: Range[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (!last || r.start > last.end) merged.push({ ...r });
    else if (r.end > last.end) last.end = r.end;
  }

  return merged;
}
