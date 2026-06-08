// Changelog (release notes) + Wiki / docs — desktop, same Ledger shell

// Shared top nav for these doc-style pages
function DocNav({ active }) {
  const items = ['Overview', 'Transactions', 'Categories', 'Sheet'];
  return (
    <div style={{ padding: '20px 32px', borderBottom: `1px solid ${WF.line2}`, display: 'flex', alignItems: 'center', gap: 24, fontSize: 13 }}>
      <div style={{ fontWeight: 600 }}>Ledger</div>
      <div style={{ display: 'flex', gap: 18, color: WF.ink3 }}>
        {items.map((it) => (
          <span key={it} style={active === it ? { color: WF.ink, fontWeight: 500 } : null}>{it}</span>
        ))}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: WF.ink3 }}>
        <span style={active === 'Help' ? { color: WF.ink, fontWeight: 500 } : null}>Help</span>
        <span style={active === "What's new" ? { color: WF.ink, fontWeight: 500 } : null}>What's new</span>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: WF.bg2, border: `1px solid ${WF.line}` }} />
      </div>
    </div>
  );
}

// Small colored tag used in changelog entries
function ReleaseTag({ kind }) {
  const map = {
    New: { fg: WF.accent, bg: WF.accentSoft, label: 'New' },
    Improved: { fg: WF.ink2, bg: WF.bg2, label: 'Improved' },
    Fixed: { fg: WF.warn, bg: 'oklch(0.95 0.03 55)', label: 'Fixed' },
  };
  const t = map[kind];
  return (
    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, color: t.fg, background: t.bg, padding: '2px 7px', borderRadius: 4 }}>{t.label}</span>
  );
}

// Faux text lines — a paragraph placeholder built from grey bars
function TextLines({ lines = 3, width = '100%', last = 0.6 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width }}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} style={{ height: 7, borderRadius: 3, background: WF.line2, width: i === lines - 1 ? `${last * 100}%` : '100%' }} />
      ))}
    </div>
  );
}

// ── CHANGELOG · release-notes timeline ──────────────────────
function ChangelogA() {
  const releases = [
    {
      v: '2.4', date: 'Jun 3, 2026', title: 'Reconcile with your statement',
      items: [
        ['New', 'Enter your bank balance to surface missing or duplicate transactions.'],
        ['New', 'Discrepancy banner on the overview when numbers drift apart.'],
        ['Improved', 'Smart-parse now infers payment method from merchant names.'],
      ],
    },
    {
      v: '2.3', date: 'May 19, 2026', title: 'Share cards',
      items: [
        ['New', 'Strava-style monthly recap + no-spend-streak cards for social.'],
        ['Improved', 'Category breakdown export sized for stories (9:16).'],
        ['Fixed', 'Currency symbol dropped on shared images in some locales.'],
      ],
    },
    {
      v: '2.2', date: 'Apr 28, 2026', title: 'Income controls, redesigned',
      items: [
        ['Improved', 'Recurring base + one-off entries now show the running math.'],
        ['Fixed', 'Editing the total no longer overwrites recurring income.'],
      ],
    },
  ];
  return (
    <DesktopFrame>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* version rail */}
        <div style={{ width: 168, borderRight: `1px solid ${WF.line2}`, padding: '28px 20px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: WF.ink3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 14 }}>Releases</div>
          {releases.map((r, i) => (
            <div key={r.v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', fontSize: 13, color: i === 0 ? WF.ink : WF.ink3, fontWeight: i === 0 ? 600 : 400 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: i === 0 ? WF.accent : WF.line }} />
              v{r.v}
            </div>
          ))}
          <div style={{ marginTop: 18, fontSize: 11, color: WF.ink3, fontFamily: 'JetBrains Mono, monospace' }}>archive ↓</div>
        </div>

        {/* timeline */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '36px 56px' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.6, margin: 0, marginBottom: 5 }}>What's new</h1>
            <div style={{ fontSize: 13, color: WF.ink3 }}>Product updates and fixes, newest first.</div>
          </div>

          <div style={{ position: 'relative', paddingLeft: 28 }}>
            {/* vertical line */}
            <div style={{ position: 'absolute', left: 4, top: 6, bottom: 0, width: 1, background: WF.line }} />
            {releases.map((r, i) => (
              <div key={r.v} style={{ position: 'relative', marginBottom: 34 }}>
                <div style={{ position: 'absolute', left: -28, top: 4, width: 9, height: 9, borderRadius: '50%', background: WF.bg, border: `2px solid ${i === 0 ? WF.accent : WF.line}` }} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: WF.ink2 }}>v{r.v}</span>
                  <span style={{ fontSize: 11, color: WF.ink3 }}>{r.date}</span>
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: -0.3, margin: '0 0 12px' }}>{r.title}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {r.items.map(([kind, text], j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 62, flexShrink: 0, paddingTop: 1 }}><ReleaseTag kind={kind} /></div>
                      <div style={{ fontSize: 13, color: WF.ink2, lineHeight: 1.5, maxWidth: 480 }}>{text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* subscribe rail */}
        <div style={{ width: 220, borderLeft: `1px solid ${WF.line2}`, padding: '36px 24px', flexShrink: 0 }}>
          <div style={{ border: `1px solid ${WF.line}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Get updates</div>
            <div style={{ fontSize: 11, color: WF.ink3, lineHeight: 1.5, marginBottom: 12 }}>One short email per release. No spam.</div>
            <Placeholder label="email@you.com" style={{ height: 32, marginBottom: 8, justifyContent: 'flex-start', paddingLeft: 10 }} />
            <button className="wf-btn" style={{ width: '100%', justifyContent: 'center' }}>Subscribe</button>
          </div>
          <div style={{ marginTop: 20, fontSize: 11, color: WF.ink3, lineHeight: 1.6 }}>
            <div style={{ color: WF.ink2, fontWeight: 500, marginBottom: 6 }}>Also</div>
            <div>RSS feed ↗</div>
            <div>Roadmap ↗</div>
            <div>Status page ↗</div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// ── WIKI / DOCS · three-pane help article ───────────────────
function WikiA() {
  const tree = [
    { group: 'Getting started', items: ['What is Ledger', 'Connect a sheet', 'Your first entry'] },
    { group: 'Tracking', items: ['Chat input', 'Smart parse & categories', 'Editing transactions'], active: 'Smart parse & categories' },
    { group: 'Money', items: ['Income controls', 'Budgets & caps', 'Reconcile a statement'] },
    { group: 'Sharing', items: ['Share cards', 'Export & backup'] },
  ];
  const toc = ['How it works', 'Confidence & confirm', 'Teaching it rules', 'Editing a guess', 'Limitations'];
  return (
    <DesktopFrame>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* nav tree */}
        <div style={{ width: 230, borderRight: `1px solid ${WF.line2}`, padding: '24px 18px', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ border: `1px solid ${WF.line}`, borderRadius: 8, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={WF.ink3} strokeWidth="1.5"><circle cx="6" cy="6" r="4.5"/><path d="M10 10l3 3"/></svg>
            <span style={{ fontSize: 12, color: WF.ink3 }}>Search docs</span>
            <span className="wf-kbd" style={{ marginLeft: 'auto' }}>/</span>
          </div>
          {tree.map((sec) => (
            <div key={sec.group} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: WF.ink3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>{sec.group}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sec.items.map((it) => {
                  const on = sec.active === it;
                  return (
                    <div key={it} style={{ fontSize: 13, padding: '5px 8px', borderRadius: 6, color: on ? WF.ink : WF.ink2, fontWeight: on ? 600 : 400, background: on ? WF.accentSoft : 'transparent', borderLeft: on ? `2px solid ${WF.accent}` : '2px solid transparent' }}>{it}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* article */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '34px 52px' }}>
          <div style={{ fontSize: 11, color: WF.ink3, marginBottom: 14, display: 'flex', gap: 6 }}>
            <span>Tracking</span><span>›</span><span style={{ color: WF.ink2 }}>Smart parse & categories</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.6, margin: '0 0 10px' }}>Smart parse &amp; categories</h1>
          <div style={{ fontSize: 14, color: WF.ink3, lineHeight: 1.5, marginBottom: 24, maxWidth: 540 }}>
            How Ledger reads a plain-text entry like “lunch 14 card” and turns it into a categorized transaction.
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>How it works</h2>
          <TextLines lines={3} width={540} />

          {/* callout */}
          <div style={{ display: 'flex', gap: 12, background: WF.accentSoft, border: `1px solid oklch(0.85 0.06 150)`, borderRadius: 10, padding: '14px 16px', margin: '20px 0', maxWidth: 540 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: WF.accent, flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Tip</div>
              <TextLines lines={2} last={0.8} />
            </div>
          </div>

          {/* code / example block */}
          <div style={{ border: `1px solid ${WF.line}`, borderRadius: 10, overflow: 'hidden', maxWidth: 540, marginBottom: 24 }}>
            <div style={{ padding: '8px 14px', borderBottom: `1px solid ${WF.line2}`, fontSize: 10, color: WF.ink3, fontFamily: 'JetBrains Mono, monospace', display: 'flex', justifyContent: 'space-between' }}>
              <span>example</span><span>copy</span>
            </div>
            <div style={{ padding: '14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: WF.ink2, lineHeight: 1.8 }}>
              <div><span style={{ color: WF.ink3 }}>in&nbsp;</span>lunch 14 card</div>
              <div><span style={{ color: WF.ink3 }}>out</span> $14 · <span style={{ color: WF.accent }}>Food</span> · Card</div>
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>Teaching it rules</h2>
          <TextLines lines={2} width={540} last={0.7} />
          <div style={{ marginTop: 14, marginBottom: 8 }}>
            <Placeholder label="screenshot · rule editor" style={{ height: 120, maxWidth: 540 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 28, paddingTop: 18, borderTop: `1px solid ${WF.line2}`, maxWidth: 540 }}>
            <span style={{ fontSize: 12, color: WF.ink3 }}>Was this helpful?</span>
            <button className="wf-chip">👍 Yes</button>
            <button className="wf-chip">👎 No</button>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: WF.ink3 }}>Edit on GitHub ↗</span>
          </div>
        </div>

        {/* on-this-page TOC */}
        <div style={{ width: 188, borderLeft: `1px solid ${WF.line2}`, padding: '34px 22px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: WF.ink3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>On this page</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {toc.map((t, i) => (
              <div key={t} style={{ fontSize: 12, color: i === 0 ? WF.ink : WF.ink3, fontWeight: i === 0 ? 600 : 400, borderLeft: i === 0 ? `2px solid ${WF.accent}` : `2px solid ${WF.line2}`, paddingLeft: 10, lineHeight: 1.3 }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// ── CHANGELOG · mobile ──────────────────────────────────────
function ChangelogMobile() {
  const releases = [
    { v: '2.4', date: 'Jun 3', title: 'Reconcile with your statement', items: [['New', 'Enter your bank balance to surface missing or duplicate transactions.'], ['New', 'Discrepancy banner on the overview.'], ['Improved', 'Smart-parse infers payment method from merchants.']] },
    { v: '2.3', date: 'May 19', title: 'Share cards', items: [['New', 'Strava-style monthly recap + streak cards.'], ['Fixed', 'Currency symbol dropped on shared images.']] },
    { v: '2.2', date: 'Apr 28', title: 'Income controls, redesigned', items: [['Improved', 'Recurring + one-off entries show the math.']] },
  ];
  return (
    <PhoneFrame>
      {/* sticky header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${WF.line2}`, background: WF.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={WF.ink} strokeWidth="1.6" strokeLinecap="round"><path d="M10 3 5 8l5 5"/></svg>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.4 }}>What's new</div>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <button className="wf-chip" style={{ background: WF.ink, color: '#fff', borderColor: WF.ink }}>All</button>
          <button className="wf-chip">New</button>
          <button className="wf-chip">Improved</button>
          <button className="wf-chip">Fixed</button>
        </div>
      </div>
      {/* scroll body */}
      <div style={{ position: 'absolute', inset: '85px 0 0', overflow: 'hidden', padding: '20px 20px 0' }}>
        <div style={{ position: 'relative', paddingLeft: 22 }}>
          <div style={{ position: 'absolute', left: 3, top: 6, bottom: 0, width: 1, background: WF.line }} />
          {releases.map((r, i) => (
            <div key={r.v} style={{ position: 'relative', marginBottom: 26 }}>
              <div style={{ position: 'absolute', left: -22, top: 4, width: 8, height: 8, borderRadius: '50%', background: WF.bg, border: `2px solid ${i === 0 ? WF.accent : WF.line}` }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: WF.ink2 }}>v{r.v}</span>
                <span style={{ fontSize: 10, color: WF.ink3 }}>{r.date}, 2026</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2, marginBottom: 10 }}>{r.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {r.items.map(([kind, text], j) => (
                  <div key={j} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div><ReleaseTag kind={kind} /></div>
                    <div style={{ fontSize: 12.5, color: WF.ink2, lineHeight: 1.45 }}>{text}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

// ── WIKI · mobile index / nav ───────────────────────────────
function WikiMobileIndex() {
  const tree = [
    { group: 'Getting started', items: ['What is Ledger', 'Connect a sheet', 'Your first entry'] },
    { group: 'Tracking', items: ['Chat input', 'Smart parse & categories', 'Editing transactions'] },
    { group: 'Money', items: ['Income controls', 'Budgets & caps', 'Reconcile a statement'] },
    { group: 'Sharing', items: ['Share cards', 'Export & backup'] },
  ];
  return (
    <PhoneFrame>
      <div style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${WF.line2}` }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.4, marginBottom: 12 }}>Help &amp; docs</div>
        <div style={{ border: `1px solid ${WF.line}`, borderRadius: 8, padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={WF.ink3} strokeWidth="1.5"><circle cx="6" cy="6" r="4.5"/><path d="M10 10l3 3"/></svg>
          <span style={{ fontSize: 13, color: WF.ink3 }}>Search docs</span>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: '92px 0 0', overflow: 'hidden', padding: '6px 20px 0' }}>
        {tree.map((sec) => (
          <div key={sec.group} style={{ borderBottom: `1px solid ${WF.line2}`, padding: '14px 0' }}>
            <div style={{ fontSize: 10, color: WF.ink3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>{sec.group}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {sec.items.map((it) => (
                <div key={it} style={{ display: 'flex', alignItems: 'center', padding: '9px 0', fontSize: 14 }}>
                  <span style={{ flex: 1 }}>{it}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={WF.ink3} strokeWidth="1.5"><path d="M5 3l5 4-5 4"/></svg>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

// ── WIKI · mobile article ───────────────────────────────────
function WikiMobileArticle() {
  return (
    <PhoneFrame>
      {/* sticky bar w/ back + breadcrumb */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${WF.line2}`, display: 'flex', alignItems: 'center', gap: 12, background: WF.bg }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={WF.ink} strokeWidth="1.6" strokeLinecap="round"><path d="M10 3 5 8l5 5"/></svg>
        <span style={{ fontSize: 12, color: WF.ink3 }}>Tracking</span>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke={WF.ink3} strokeWidth="1.5" style={{ marginLeft: 'auto' }}><circle cx="2" cy="7" r="1"/><circle cx="7" cy="7" r="1"/><circle cx="12" cy="7" r="1"/></svg>
      </div>
      <div style={{ position: 'absolute', inset: '79px 0 0', overflow: 'hidden', padding: '20px 20px 0' }}>
        <h1 style={{ fontSize: 23, fontWeight: 600, letterSpacing: -0.4, margin: '0 0 8px' }}>Smart parse &amp; categories</h1>
        <div style={{ fontSize: 13, color: WF.ink3, lineHeight: 1.5, marginBottom: 20 }}>How Ledger reads “lunch 14 card” and turns it into a categorized transaction.</div>

        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>How it works</div>
        <TextLines lines={3} />

        {/* callout */}
        <div style={{ display: 'flex', gap: 10, background: WF.accentSoft, border: '1px solid oklch(0.85 0.06 150)', borderRadius: 10, padding: '13px 14px', margin: '18px 0' }}>
          <div style={{ width: 15, height: 15, borderRadius: '50%', background: WF.accent, flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Tip</div>
            <TextLines lines={2} last={0.85} />
          </div>
        </div>

        {/* code block */}
        <div style={{ border: `1px solid ${WF.line}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '7px 12px', borderBottom: `1px solid ${WF.line2}`, fontSize: 10, color: WF.ink3, fontFamily: 'JetBrains Mono, monospace', display: 'flex', justifyContent: 'space-between' }}>
            <span>example</span><span>copy</span>
          </div>
          <div style={{ padding: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: WF.ink2, lineHeight: 1.8 }}>
            <div><span style={{ color: WF.ink3 }}>in&nbsp;</span>lunch 14 card</div>
            <div><span style={{ color: WF.ink3 }}>out</span> $14 · <span style={{ color: WF.accent }}>Food</span> · Card</div>
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Teaching it rules</div>
        <TextLines lines={2} last={0.7} />
        <div style={{ marginTop: 12 }}>
          <Placeholder label="screenshot · rule editor" style={{ height: 110 }} />
        </div>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, { ChangelogA, WikiA, ChangelogMobile, WikiMobileIndex, WikiMobileArticle });
