import fs from 'fs';
import path from 'path';

export type ChangeKind = 'new' | 'improved' | 'fixed';

export interface ChangeItem {
  kind: ChangeKind;
  text: string;
}

export interface Release {
  version: string;
  date: string;
  title: string;
  items: ChangeItem[];
  slug: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
}

function sectionKind(header: string): ChangeKind {
  const h = header.toLowerCase();
  if (h.includes('fix')) return 'fixed';
  if (h.includes('improv') || h.includes('changed')) return 'improved';
  return 'new';
}

export function getReleases(): Release[] {
  const filePath = path.join(process.cwd(), 'CHANGELOG.md');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Split on version headers: ## [x.y.z] — date
  const blocks = content.split(/^(?=## \[)/m).filter(b => /^## \[/.test(b));

  return blocks.map(block => {
    const lines = block.split('\n');
    const headerLine = lines[0];

    const headerMatch = headerLine.match(/^## \[([^\]]+)\]\s*[—\-]+\s*(.+)$/);
    if (!headerMatch) return null;

    const version = headerMatch[1];
    const date = headerMatch[2].trim();
    const slug = 'v' + version.replace(/\./g, '-');

    // First non-empty, non-header, non-list line is the release title
    let title = '';
    for (let i = 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (l && !l.startsWith('#') && !l.startsWith('-') && l !== '---') {
        title = stripMarkdown(l).replace(/\.$/, '');
        break;
      }
    }

    const items: ChangeItem[] = [];
    let currentKind: ChangeKind = 'new';

    for (const line of lines.slice(1)) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        currentKind = sectionKind(trimmed.replace(/^#+\s*/, ''));
        continue;
      }
      if (trimmed.startsWith('- ')) {
        const text = stripMarkdown(trimmed.slice(2));
        if (text) items.push({ kind: currentKind, text });
      }
    }

    return { version, date, title: title || `v${version}`, items, slug };
  }).filter((r): r is Release => r !== null && r.items.length > 0);
}
