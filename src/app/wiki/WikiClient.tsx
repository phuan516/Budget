'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { WikiArticle, NavGroup, Block } from '@/lib/wiki';
import s from './wiki.module.css';

const SECTION_LABELS: Record<string, string> = {
  'getting-started': 'Getting started',
  tracking: 'Tracking',
  money: 'Money',
  sharing: 'Sharing',
};

// ── Inline markup rendered via dangerouslySetInnerHTML ──────────
// Content comes from our own MDX files — safe to use.
function InlineHtml({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── Block renderer ──────────────────────────────────────────────
function ArticleBlock({ block, mobile }: { block: Block; mobile?: boolean }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (!block.lines) return;
    navigator.clipboard.writeText(block.lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (block.type === 'h2') {
    return (
      <h2
        id={block.id}
        className={mobile ? s.mobileArticleH2 : s.articleH2}
      >
        {block.text}
      </h2>
    );
  }

  if (block.type === 'p') {
    return (
      <p className={s.articleP}>
        <InlineHtml html={block.html!} />
      </p>
    );
  }

  if (block.type === 'callout') {
    const variant = block.variant ?? 'tip';
    const bgClass = variant === 'tip' ? s.calloutTip : variant === 'warning' ? s.calloutWarning : s.calloutNote;
    const dotClass = variant === 'tip' ? s.calloutDotTip : variant === 'warning' ? s.calloutDotWarn : s.calloutDotNote;
    const label = variant === 'tip' ? 'Tip' : variant === 'warning' ? 'Warning' : null;
    return (
      <div className={`${s.callout} ${bgClass}`} style={mobile ? { margin: '18px 0' } : undefined}>
        <div className={`${s.calloutDot} ${dotClass}`} />
        <div>
          {label && <div className={s.calloutLabel}>{label}</div>}
          <div className={s.calloutBody}><InlineHtml html={block.html!} /></div>
        </div>
      </div>
    );
  }

  if (block.type === 'code') {
    return (
      <div className={s.codeBlock}>
        <div className={s.codeHeader}>
          <span>example</span>
          <button className={s.codeCopy} onClick={copyCode}>
            {copied ? 'Copied' : 'copy'}
          </button>
        </div>
        <div className={s.codeBody}>{(block.lines ?? []).join('\n')}</div>
      </div>
    );
  }

  if (block.type === 'table') {
    return (
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table className={s.table}>
          <thead>
            <tr>
              {(block.headers ?? []).map((h, i) => (
                <th key={i}><InlineHtml html={h} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(block.rows ?? []).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}><InlineHtml html={cell} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === 'ul') {
    return (
      <ul className={s.articleUl}>
        {(block.items ?? []).map((item, i) => (
          <li key={i}><InlineHtml html={item} /></li>
        ))}
      </ul>
    );
  }

  if (block.type === 'ol') {
    return (
      <ol className={s.articleOl}>
        {(block.items ?? []).map((item, i) => (
          <li key={i}><InlineHtml html={item} /></li>
        ))}
      </ol>
    );
  }

  return null;
}

// ── Article content area ────────────────────────────────────────
function ArticleContent({
  article,
  activeTocId,
  mobile,
}: {
  article: WikiArticle;
  activeTocId: string;
  mobile?: boolean;
}) {
  return (
    <>
      {!mobile && (
        <div className={s.breadcrumb}>
          <span>{SECTION_LABELS[article.section] ?? article.section}</span>
          <span>›</span>
          <span className={s.breadcrumbCurrent}>{article.title}</span>
        </div>
      )}
      <h1 className={mobile ? s.mobileArticleH1 : s.articleH1}>{article.title}</h1>
      <p className={mobile ? s.mobileArticleLede : s.articleLede}>{article.lede}</p>

      {article.blocks.map((block, i) => (
        <ArticleBlock key={i} block={block} mobile={mobile} />
      ))}

      {article.editUrl && (
        <div className={s.articleFooter}>
          <a href={article.editUrl} target="_blank" rel="noopener noreferrer" className={s.editLink}>
            Edit this page
          </a>
        </div>
      )}
    </>
  );
}

// ── Search: filters allArticles client-side, no backend needed ──
function useWikiSearch(allArticles: WikiArticle[]) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const results = q === '' ? [] : allArticles
    .filter(a => a.title.toLowerCase().includes(q) || a.lede.toLowerCase().includes(q))
    .slice(0, 6);
  return { query, setQuery, results, open: q !== '' };
}

function SearchResults({ results, query, onNavigate }: { results: WikiArticle[]; query: string; onNavigate: () => void }) {
  return (
    <div className={s.searchResults} role="listbox">
      {results.length === 0 ? (
        <div className={s.searchEmpty}>No results for &quot;{query}&quot;</div>
      ) : (
        results.map(a => (
          <Link
            key={a.slug}
            href={`/wiki/${a.section}/${a.slug}`}
            className={s.searchResultItem}
            onClick={onNavigate}
          >
            <div className={s.searchResultTitle}>{a.title}</div>
            <div className={s.searchResultSection}>{SECTION_LABELS[a.section] ?? a.section}</div>
          </Link>
        ))
      )}
    </div>
  );
}

// ── Main WikiClient ─────────────────────────────────────────────
interface Props {
  nav: NavGroup[];
  article: WikiArticle | null;
  allArticles: WikiArticle[];
}

export default function WikiClient({ nav, article, allArticles }: Props) {
  const desktopArticle = article ?? allArticles.find((a) => a.slug === 'what-is-ledger') ?? null;

  const [activeTocIds, setActiveTocIds] = useState<Set<string>>(new Set());
  const articleRef = useRef<HTMLDivElement>(null);
  const search = useWikiSearch(allArticles);
  const mobileSearch = useWikiSearch(allArticles);

  // Reset mobile view when article changes
  useEffect(() => {
    setActiveTocIds(new Set());
  }, [article?.slug]);

  // Scrollspy
  useEffect(() => {
    if (!desktopArticle || !articleRef.current) return;
    const container = articleRef.current;

    function update() {
      const headings = Array.from(container.querySelectorAll('h2[id]')) as HTMLElement[];
      if (!headings.length) return;
      const { top: containerTop, bottom: containerBottom } = container.getBoundingClientRect();
      const visible = new Set<string>();
      for (const heading of headings) {
        const { top, bottom } = heading.getBoundingClientRect();
        if (bottom > containerTop && top < containerBottom) {
          visible.add(heading.id);
        }
      }
      setActiveTocIds(visible);
    }

    container.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
    return () => {
      container.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [desktopArticle?.slug]);

  const activeSlug = article?.slug ?? desktopArticle?.slug ?? '';

  // ── Shared nav tree ──────────────────────────────────────────
  const NavTree = (
    <nav className={s.navTree} aria-label="Wiki navigation">
      <div className={s.search}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#888" strokeWidth="1.5" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" />
          <path d="M10 10l3 3" />
        </svg>
        <input
          type="text"
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') search.setQuery(''); }}
          placeholder="Search docs…"
          aria-label="Search docs"
          className={s.searchInput}
        />
        {search.open && (
          <SearchResults results={search.results} query={search.query} onNavigate={() => search.setQuery('')} />
        )}
      </div>
      {nav.map((group) => (
        <div key={group.group} className={s.navGroup}>
          <div className={s.navGroupLabel}>{group.group}</div>
          <div className={s.navItems}>
            {group.items.map((item) => (
              <Link
                key={item.slug}
                href={`/wiki/${item.section}/${item.slug}`}
                className={`${s.navItem} ${activeSlug === item.slug ? s.navItemActive : ''}`}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  // ── Desktop three-pane ───────────────────────────────────────
  const DesktopLayout = (
    <div className={s.shell}>
      <header className={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" className={s.headerLogo}>
            <Image src="/ledger-A-512.png" alt="Ledger" width={18} height={18} style={{ borderRadius: '50%', flexShrink: 0 }} />
            <span className={s.headerLogoText}>Ledger</span>
          </Link>
          <span className={s.headerSlash}>/</span>
          <span style={{ fontSize: 13, color: '#444' }}>Wiki</span>
        </div>
      </header>
      <div className={s.body}>
        {NavTree}

        <main className={s.article} ref={articleRef}>
          {desktopArticle ? (
            <div className={s.articleInner}>
              <ArticleContent article={desktopArticle} activeTocId="" />
            </div>
          ) : (
            <div className={s.welcome}>Select an article from the navigation.</div>
          )}
        </main>

        {desktopArticle && desktopArticle.toc.length > 0 && (
          <div className={s.toc}>
            <div className={s.tocEyebrow}>On this page</div>
            <div className={s.tocItems}>
              {desktopArticle.toc.map((entry) => (
                <a
                  key={entry.id}
                  href={`#${entry.id}`}
                  className={`${s.tocItem} ${activeTocIds.has(entry.id) ? s.tocItemActive : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(entry.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {entry.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Mobile index ─────────────────────────────────────────────
  const MobileIndex = (
    <div className={s.mobileShell}>
      <div className={s.mobileHeader}>
        <div className={s.mobileHeaderTop}>
          <Link href="/" aria-label="Back to Ledger" style={{ display: 'flex', alignItems: 'center', color: '#888', marginRight: 2 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M10 3 5 8l5 5" />
            </svg>
          </Link>
          <span className={s.mobileTitle}>Help &amp; docs</span>
        </div>
        <div className={s.mobileSearch}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#888" strokeWidth="1.5" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" />
            <path d="M10 10l3 3" />
          </svg>
          <input
            type="text"
            value={mobileSearch.query}
            onChange={(e) => mobileSearch.setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') mobileSearch.setQuery(''); }}
            placeholder="Search docs…"
            aria-label="Search docs"
            className={s.mobileSearchInput}
          />
          {mobileSearch.open && (
            <SearchResults results={mobileSearch.results} query={mobileSearch.query} onNavigate={() => mobileSearch.setQuery('')} />
          )}
        </div>
      </div>
      <div className={s.mobileScroll}>
        {nav.map((group) => (
          <div key={group.group} className={s.mobileGroup}>
            <div className={s.mobileGroupLabel}>{group.group}</div>
            <div className={s.mobileNavItems}>
              {group.items.map((item) => (
                <Link
                  key={item.slug}
                  href={`/wiki/${item.section}/${item.slug}`}
                  className={s.mobileNavItem}
                >
                  <span className={s.mobileNavItemText}>{item.title}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#888" strokeWidth="1.5">
                    <path d="M5 3l5 4-5 4" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Mobile article ───────────────────────────────────────────
  const MobileArticle = article ? (
    <div className={s.mobileArticleShell}>
      <div className={s.mobileBar}>
        <Link href="/wiki" aria-label="Back to Wiki index" className={s.mobileBarBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M10 3 5 8l5 5" />
          </svg>
        </Link>
        <span className={s.mobileBarSection}>{SECTION_LABELS[article.section] ?? article.section}</span>
      </div>
      <main className={s.mobileArticleScroll}>
        <ArticleContent article={article} activeTocId="" mobile />
      </main>
    </div>
  ) : null;

  return (
    <>
      {/* Desktop (≥ 768px) */}
      <div className="hidden md:block h-full">{DesktopLayout}</div>
      {/* Mobile (< 768px) */}
      <div className="md:hidden">
        {article ? MobileArticle : MobileIndex}
      </div>
    </>
  );
}
