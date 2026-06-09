import fs from 'fs';
import path from 'path';

export type BlockType = 'h2' | 'p' | 'callout' | 'code' | 'table' | 'ul' | 'ol';

export interface Block {
  type: BlockType;
  // h2
  text?: string;
  id?: string;
  // callout
  variant?: 'tip' | 'note' | 'warning';
  // p / callout body / ul items / ol items
  html?: string;
  items?: string[];
  // code
  lines?: string[];
  // table
  headers?: string[];
  rows?: string[][];
}

export interface TocEntry {
  label: string;
  id: string;
}

export interface WikiArticle {
  title: string;
  section: string;
  slug: string;
  order: number;
  lede: string;
  editUrl: string;
  blocks: Block[];
  toc: TocEntry[];
}

export interface NavItem {
  title: string;
  slug: string;
  section: string;
  order: number;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

// ── inline markdown → HTML ──────────────────────────────────────
function inlineHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim().replace(/^['"]|['"]$/g, '');
    meta[key] = value;
  }
  return { meta, body: match[2].trim() };
}

function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  const lines = body.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // blank line — skip
    if (!line.trim()) { i++; continue; }

    // h2
    if (line.startsWith('## ')) {
      const text = line.slice(3).trim();
      blocks.push({ type: 'h2', text, id: slugify(text) });
      i++;
      continue;
    }

    // skip h1/h3+
    if (line.startsWith('#')) { i++; continue; }

    // code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // closing ```
      blocks.push({ type: 'code', lines: codeLines });
      continue;
    }

    // callout / blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      const raw = quoteLines.join(' ');
      const variantMatch = raw.match(/^\*\*(Tip|Note|Warning):?\*\*[:\s]*(.*)/i);
      const variant = variantMatch
        ? (variantMatch[1].toLowerCase() as 'tip' | 'note' | 'warning')
        : 'note';
      const bodyText = variantMatch ? variantMatch[2] : raw;
      blocks.push({ type: 'callout', variant, html: inlineHtml(bodyText) });
      continue;
    }

    // table
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const parseRow = (l: string) =>
        l.split('|').slice(1, -1).map((c) => c.trim());
      const headers = parseRow(tableLines[0]);
      const rows = tableLines
        .slice(2) // skip separator row
        .map(parseRow)
        .filter((r) => r.some((c) => c));
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // unordered list
    if (line.match(/^- /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^- /)) {
        items.push(inlineHtml(lines[i].slice(2).trim()));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // ordered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(inlineHtml(lines[i].replace(/^\d+\. /, '').trim()));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // paragraph — collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('> ') &&
      !lines[i].startsWith('|') &&
      !lines[i].match(/^- /) &&
      !lines[i].match(/^\d+\. /)
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length) {
      blocks.push({ type: 'p', html: inlineHtml(paraLines.join(' ')) });
    } else {
      i++; // safety: advance past any line that matched no handler
    }
  }

  return blocks;
}

function articleFromFile(filePath: string): WikiArticle | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { meta, body } = parseFrontmatter(content);
    if (!meta.title || !meta.section || !meta.slug) return null;
    const blocks = parseBody(body);
    const toc: TocEntry[] = blocks
      .filter((b): b is Block & { type: 'h2'; text: string; id: string } => b.type === 'h2' && !!b.text)
      .map((b) => ({ label: b.text!, id: b.id! }));
    return {
      title: meta.title,
      section: meta.section.toLowerCase().replace(/\s+/g, '-'),
      slug: meta.slug,
      order: parseInt(meta.order ?? '99'),
      lede: meta.lede ?? '',
      editUrl: meta.editUrl ?? '',
      blocks,
      toc,
    };
  } catch {
    return null;
  }
}

const SECTION_LABELS: Record<string, string> = {
  'getting-started': 'Getting started',
  tracking: 'Tracking',
  money: 'Money',
  sharing: 'Sharing',
};

const SECTION_ORDER = ['getting-started', 'tracking', 'money', 'sharing'];

export function getAllArticles(): WikiArticle[] {
  const base = path.join(process.cwd(), 'src/content/wiki');
  const articles: WikiArticle[] = [];
  for (const section of SECTION_ORDER) {
    const dir = path.join(base, section);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
      const article = articleFromFile(path.join(dir, file));
      if (article) articles.push({ ...article, section });
    }
  }
  articles.sort((a, b) => {
    const si = SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section);
    return si !== 0 ? si : a.order - b.order;
  });
  return articles;
}

export function getArticle(section: string, slug: string): WikiArticle | null {
  return getAllArticles().find((a) => a.section === section && a.slug === slug) ?? null;
}

export function getNav(articles: WikiArticle[]): NavGroup[] {
  const groups: NavGroup[] = [];
  for (const section of SECTION_ORDER) {
    const items = articles
      .filter((a) => a.section === section)
      .sort((a, b) => a.order - b.order)
      .map(({ title, slug, section: s, order }) => ({ title, slug, section: s, order }));
    if (items.length) {
      groups.push({ group: SECTION_LABELS[section] ?? section, items });
    }
  }
  return groups;
}
