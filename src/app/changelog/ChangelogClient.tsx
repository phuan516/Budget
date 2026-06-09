'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Release, ChangeKind } from '@/lib/releases';
import s from './page.module.css';

const ACCENT = 'oklch(0.65 0.13 150)';

const TAG_CONFIG: Record<ChangeKind, { color: string; bg: string; label: string }> = {
  new:      { color: 'oklch(0.65 0.13 150)', bg: 'oklch(0.94 0.04 150)', label: 'New' },
  improved: { color: '#444',                  bg: '#fafafa',               label: 'Improved' },
  fixed:    { color: 'oklch(0.72 0.12 55)',  bg: 'oklch(0.95 0.03 55)',  label: 'Fixed' },
};

function Tag({ kind }: { kind: ChangeKind }) {
  const { color, bg, label } = TAG_CONFIG[kind];
  return (
    <span className={s.tag} style={{ color, background: bg }}>{label}</span>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

type Filter = ChangeKind | 'all';

const FILTER_OPTIONS: { label: string; value: Filter }[] = [
  { label: 'All',      value: 'all' },
  { label: 'New',      value: 'new' },
  { label: 'Improved', value: 'improved' },
  { label: 'Fixed',    value: 'fixed' },
];

function useFiltered(releases: Release[], filter: Filter) {
  return releases
    .map(r => ({
      ...r,
      visible: filter === 'all' ? r.items : r.items.filter(i => i.kind === filter),
    }))
    .filter(r => r.visible.length > 0);
}

function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  if (done) return <p className={s.subscribeSuccess}>You&apos;re in — thanks!</p>;

  return (
    <form onSubmit={e => { e.preventDefault(); setDone(true); }} className={s.subscribeForm}>
      <input
        type="email"
        placeholder="email@you.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className={s.subscribeInput}
        aria-label="Email address"
      />
      <button type="submit" className={s.subscribeBtn}>Subscribe</button>
    </form>
  );
}

/* ── Desktop ── */
function DesktopChangelog({ releases }: { releases: Release[] }) {
  const [activeSlug, setActiveSlug] = useState(releases[0]?.slug ?? '');
  const [filter, setFilter] = useState<Filter>('all');
  const timelineRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const filtered = useFiltered(releases, filter);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = blockRefs.current.get(hash);
    const container = timelineRef.current;
    if (el && container) {
      setTimeout(() => {
        container.scrollTo({ top: el.offsetTop - 36, behavior: 'smooth' });
        setActiveSlug(hash);
      }, 80);
    }
  }, []);

  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;
    const observers: IntersectionObserver[] = [];
    blockRefs.current.forEach((el, slug) => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSlug(slug); },
        { root: container, rootMargin: '-5% 0px -60% 0px', threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [filtered]);

  const scrollTo = useCallback((slug: string) => {
    const el = blockRefs.current.get(slug);
    const container = timelineRef.current;
    if (!el || !container) return;
    container.scrollTo({ top: el.offsetTop - 36, behavior: 'smooth' });
    setActiveSlug(slug);
  }, []);

  return (
    <div className={s.body}>
      {/* Version rail */}
      <aside className={s.rail}>
        <div className={s.railEyebrow}>Releases</div>
        {releases.map((r, i) => {
          const active = r.slug === activeSlug;
          return (
            <button
              key={r.slug}
              className={s.railRow}
              onClick={() => scrollTo(r.slug)}
              style={{ color: active ? '#1a1a1a' : '#888', fontWeight: active ? 600 : 400 }}
            >
              <span className={s.railDot} style={{ background: i === 0 ? ACCENT : '#d8d8d8' }} />
              v{r.version}
            </button>
          );
        })}
        <div className={s.railSpacer} />
        <button className={s.railArchive}>archive ↓</button>
      </aside>

      {/* Timeline */}
      <div className={s.timeline} ref={timelineRef}>
        <div className={s.timelineHeader}>
          <h1 className={s.h1}>What&apos;s new</h1>
          <p className={s.sub}>Product updates and fixes, newest first.</p>
        </div>
        <div className={s.timelineList}>
          <div className={s.timelineRule} />
          {filtered.map((r, i) => (
            <div
              key={r.slug}
              id={r.slug}
              className={s.releaseBlock}
              ref={el => { if (el) blockRefs.current.set(r.slug, el); }}
            >
              <div className={s.timelineNode} style={{ borderColor: i === 0 ? ACCENT : '#d8d8d8' }} />
              <div className={s.metaRow}>
                <span className={s.versionNum}>v{r.version}</span>
                <span className={s.dateStr}>{formatDate(r.date)}</span>
              </div>
              <h2 className={s.releaseTitle}>{r.title}</h2>
              <div className={s.changeList}>
                {r.visible.map((item, j) => (
                  <div key={j} className={s.changeItem}>
                    <div className={s.tagCell}><Tag kind={item.kind} /></div>
                    <p className={s.changeText}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ── Mobile ── */
function MobileChangelog({ releases }: { releases: Release[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const filtered = useFiltered(releases, filter);

  return (
    <div className={s.mobileShell}>
      <header className={s.mobileHeader}>
        <div className={s.mobileHeaderTop}>
          <Link href="/" className={s.mobileBack} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </Link>
          <span className={s.mobileTitle}>What&apos;s new</span>
        </div>
        <div className={s.filterChips} role="group" aria-label="Filter by type">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`${s.chip} ${filter === opt.value ? s.chipActive : s.chipInactive}`}
              aria-pressed={filter === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <div className={s.mobileScroll}>
        <div className={s.mobileTimelineList}>
          <div className={s.mobileRule} />
          {filtered.map((r, i) => (
            <div key={r.slug} id={`mobile-${r.slug}`} className={s.mobileReleaseBlock}>
              <div className={s.mobileNode} style={{ borderColor: i === 0 ? ACCENT : '#d8d8d8' }} />
              <div className={s.mobileMetaRow}>
                <span className={s.mobileVersionNum}>v{r.version}</span>
                <span className={s.mobileDateStr}>{formatDate(r.date)}</span>
              </div>
              <h2 className={s.mobileReleaseTitle}>{r.title}</h2>
              <div className={s.mobileChangeList}>
                {r.visible.map((item, j) => (
                  <div key={j} className={s.mobileChangeItem}>
                    <Tag kind={item.kind} />
                    <p className={s.mobileChangeText}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ── Root export ── */
export default function ChangelogClient({ releases }: { releases: Release[] }) {
  return (
    <>
      <div className="hidden lg:flex flex-col" style={{ height: '100vh', overflow: 'hidden', background: '#fff', color: '#1a1a1a' }}>
        <header className={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/" className={s.headerLogo}>
              <Image src="/ledger-A-512.png" alt="Ledger" width={18} height={18} style={{ borderRadius: '50%', flexShrink: 0 }} />
              <span className={s.headerLogoText}>Ledger</span>
            </Link>
            <span style={{ color: '#d8d8d8', fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: '#444' }}>Changelog</span>
          </div>
        </header>
        <DesktopChangelog releases={releases} />
      </div>
      <div className="lg:hidden">
        <MobileChangelog releases={releases} />
      </div>
    </>
  );
}
