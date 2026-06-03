// Income controls — redesign explorations for the "Spent this month" hero.
// Problem: total income ($600) = recurring base ($300, auto-fills monthly)
// + one-off entries (Jun 3 +$300). The pencil edited only the base but
// prefilled $300 while the user looked at $600 — and ✏ vs ⊕ were illegible.
//
// Two families of fix (per user): (1) edit the TOTAL directly, app derives
// the base; (2) edit base + one-offs SEPARATELY but make the structure visible.
// All keep the big-number hero. Recurring shown in green, one-offs neutral.

// ── shared bits ─────────────────────────────────────────────
const INC = { recurring: 300, total: 600, spent: 100, left: 500, month: 'June 2026',
  entries: [{ date: 'Jun 3', amount: 300, note: 'Freelance invoice' }] };

function Eyebrow({ children, style }) {
  return <div style={{ fontSize: 11, color: WF.ink3, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600, ...style }}>{children}</div>;
}

function IcoPencil({ s = 13, c = WF.ink3 }) {
  return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 2.5l2 2L6 12l-2.6.6L4 10z"/></svg>;
}
function IcoPlus({ s = 13, c = WF.ink3 }) {
  return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>;
}
function IcoClose({ s = 12, c = WF.ink3 }) {
  return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>;
}
function IcoCaret({ s = 12, c = WF.ink3, up = false }) {
  return <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: up ? 'rotate(180deg)' : 'none' }}><path d="M4 6l4 4 4-4"/></svg>;
}
function Spinner() {
  return <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 2 }}>
    <IcoCaret up s={9} /><IcoCaret s={9} />
  </span>;
}

// presentational money input (mimics the live app's bordered field)
function MoneyInput({ value, width = 96, focus = false, note }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1.5px solid ${focus ? WF.ink : WF.line}`, borderRadius: 8, padding: '7px 9px', background: '#fff', minWidth: width }}>
        <span style={{ color: WF.ink3, fontSize: 13 }}>$</span>
        <span style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flex: 1 }}>{value}</span>
        <Spinner />
      </span>
      {note && <span style={{ fontSize: 12, color: WF.ink3 }}>{note}</span>}
    </span>
  );
}

function HeroNum({ size = 76 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
      <div style={{ fontSize: size, fontWeight: 600, letterSpacing: -2.4, lineHeight: 0.85 }}>$100.00</div>
    </div>
  );
}

function ProgressBar({ pct = 0.167, width = 560, mb = 0 }) {
  return (
    <div style={{ marginBottom: mb }}>
      <div style={{ height: 5, background: WF.line2, borderRadius: 3, maxWidth: width, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: WF.warn }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, fontSize: 12, color: WF.ink2 }}>
        <span style={{ width: 9, height: 9, background: WF.warn, borderRadius: 2 }} />Monthly · $100.00 of $600.00
      </div>
    </div>
  );
}

function StatRow({ compact }) {
  const items = [['Today', '$0.00'], ['This week', '$0.00'], ['Daily avg', '$0.00'], ['Projected', '$0.00'], ['Left to spend', '$500.00', true]];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24 }}>
      {items.map(([k, v, green]) => (
        <div key={k}>
          <Eyebrow style={{ marginBottom: 6, fontSize: 10 }}>{k}</Eyebrow>
          <div style={{ fontSize: compact ? 19 : 22, fontWeight: 600, letterSpacing: -0.5, color: green ? WF.accent : WF.ink }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

// small reusable buttons
function GhostBtn({ children, onClick, style }) {
  return <button className="wf-btn-ghost" style={{ padding: '7px 13px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 7, ...style }}>{children}</button>;
}
function DarkBtn({ children, style }) {
  return <button className="wf-btn" style={{ padding: '7px 15px', fontSize: 12.5, ...style }}>{children}</button>;
}

// caption that always shows the honest breakdown
function BreakdownCaption({ style }) {
  return (
    <div style={{ fontSize: 13, color: WF.ink3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', ...style }}>
      <span style={{ color: WF.accent, fontWeight: 600 }}>$300 recurring</span>
      <span>+</span>
      <span style={{ color: WF.ink2, fontWeight: 600 }}>$300 added this month</span>
      <span>·</span>
      <span>{INC.month}</span>
    </div>
  );
}

function Tag({ children }) {
  return <span style={{ fontSize: 11, fontWeight: 600, color: '#2f6fd6', background: 'oklch(0.95 0.03 250)', padding: '2px 7px', borderRadius: 5 }}>{children}</span>;
}

// frame helper: eyebrow + big number + a slot to the right of the number
function HeroTop({ right }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Eyebrow style={{ marginBottom: 8 }}>Spent this month</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, flexWrap: 'wrap' }}>
        <HeroNum />
        {right}
      </div>
    </div>
  );
}

const PAD = '34px 40px';

// ════════════════════════════════════════════════════════════
// A · INLINE BREAKDOWN — total reads honestly, one "Edit income"
//      button opens a panel; recurring and one-offs clearly split.
// ════════════════════════════════════════════════════════════
function IncomeA() {
  return (
    <DesktopFrame>
      <div style={{ padding: PAD, position: 'relative' }}>
        <HeroTop right={
          <div style={{ paddingBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 16, color: WF.ink3 }}>of <span style={{ color: WF.ink, fontWeight: 600 }}>$600.00</span> income</div>
            <GhostBtn><IcoPencil /> Edit income</GhostBtn>
          </div>
        } />
        <BreakdownCaption style={{ marginBottom: 18 }} />
        <ProgressBar mb={26} />
        <StatRow compact />

        {/* open panel (popover) */}
        <div style={{ position: 'absolute', top: 96, right: 40, width: 340, background: '#fff', border: `1px solid ${WF.line}`, borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.10)', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Income · {INC.month}</div>
            <IcoClose />
          </div>

          <Eyebrow style={{ fontSize: 10, marginBottom: 8 }}>Recurring monthly</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
            <MoneyInput value="300" width={92} />
            <span style={{ fontSize: 11, color: WF.accent, fontWeight: 600 }}>auto-fills each month</span>
          </div>
          <div style={{ height: 1, background: WF.line2, margin: '14px 0' }} />

          <Eyebrow style={{ fontSize: 10, marginBottom: 8 }}>Added this month</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', fontSize: 13 }}>
            <span style={{ color: WF.ink3 }}>Jun 3 · Freelance invoice</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>+$300.00</span>
              <IcoPencil s={12} /><IcoClose />
            </span>
          </div>
          <button className="wf-chip" style={{ marginTop: 8, border: `1px dashed ${WF.line}`, cursor: 'pointer' }}><IcoPlus s={11} /> Add one-off income</button>

          <div style={{ height: 1, background: WF.line, margin: '14px 0 12px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Total income</span>
            <span style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>$600.00</span>
          </div>
        </div>

        <div className="wf-note" style={{ position: 'absolute', bottom: 14, right: 30, width: 220, transform: 'rotate(-2deg)' }}>
          One button → a panel that shows the math. Recurring and one-offs are clearly separate; total is the sum.
        </div>
      </div>
    </DesktopFrame>
  );
}

// ════════════════════════════════════════════════════════════
// B · EDIT THE TOTAL — click the total, the field is prefilled
//     with $600 (what you see). A live caption derives recurring.
// ════════════════════════════════════════════════════════════
function IncomeB() {
  return (
    <DesktopFrame>
      <div style={{ padding: PAD, position: 'relative' }}>
        <HeroTop right={
          <div style={{ paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, color: WF.ink3 }}>of</span>
              <MoneyInput value="600" width={104} focus />
              <span style={{ fontSize: 16, color: WF.ink3 }}>income</span>
              <DarkBtn>Save</DarkBtn>
              <button className="wf-btn-ghost" style={{ padding: '7px 13px', fontSize: 12.5 }}>Cancel</button>
            </div>
            <div style={{ fontSize: 12, color: WF.ink3, paddingLeft: 2 }}>
              Sets your <span style={{ color: WF.accent, fontWeight: 600 }}>recurring income to $300</span> · keeps the <span style={{ color: WF.ink2, fontWeight: 600 }}>$300 added this month</span>
            </div>
          </div>
        } />
        <ProgressBar mb={26} />
        <StatRow compact />

        <div className="wf-note" style={{ position: 'absolute', bottom: 14, right: 30, width: 250, transform: 'rotate(-2deg)' }}>
          You edit the number you see ($600). The app back-solves recurring = total − one-offs, and tells you so under the field.
        </div>
      </div>
    </DesktopFrame>
  );
}

// ════════════════════════════════════════════════════════════
// C · LABELED BUTTONS — minimal change: kill the icons, add a
//     breakdown line + two text buttons. Entries fold up next to it.
// ════════════════════════════════════════════════════════════
function IncomeC() {
  return (
    <DesktopFrame>
      <div style={{ padding: PAD, position: 'relative' }}>
        <HeroTop right={
          <div style={{ paddingBottom: 10, fontSize: 16, color: WF.ink3 }}>of <span style={{ color: WF.ink, fontWeight: 600 }}>$600.00</span> income</div>
        } />
        <BreakdownCaption style={{ marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          <GhostBtn><IcoPencil /> Edit recurring income</GhostBtn>
          <GhostBtn><IcoPlus /> Add income this month</GhostBtn>
        </div>
        <ProgressBar mb={24} />
        <StatRow compact />

        {/* entries pulled up, clearly labeled as the "added" bucket */}
        <div style={{ marginTop: 26 }}>
          <Eyebrow style={{ marginBottom: 10 }}>Added this month <span style={{ color: WF.ink3, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· on top of recurring</span></Eyebrow>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 560, padding: '9px 0', borderTop: `1px solid ${WF.line2}`, fontSize: 13.5 }}>
            <span style={{ color: WF.ink2 }}>Jun 3 · Freelance invoice</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontWeight: 600 }}>+$300.00</span><IcoPencil s={12} /><IcoClose />
            </span>
          </div>
        </div>

        <div className="wf-note" style={{ position: 'absolute', bottom: 14, right: 30, width: 215, transform: 'rotate(-2deg)' }}>
          Smallest change: text buttons instead of ✏/⊕, plus a breakdown line so the two numbers stop colliding.
        </div>
      </div>
    </DesktopFrame>
  );
}

// ════════════════════════════════════════════════════════════
// D · COMPONENT CHIPS — the total's makeup sits under the number
//     as editable chips. Direct, scannable, no hidden state.
// ════════════════════════════════════════════════════════════
function Chip({ children, dashed, onClick }) {
  return <button className="wf-chip" style={{ padding: '8px 12px', fontSize: 13, gap: 8, cursor: 'pointer', border: dashed ? `1px dashed ${WF.line}` : `1px solid ${WF.line}`, background: '#fff' }}>{children}</button>;
}
function IncomeD() {
  return (
    <DesktopFrame>
      <div style={{ padding: PAD, position: 'relative' }}>
        <HeroTop right={
          <div style={{ paddingBottom: 10, fontSize: 16, color: WF.ink3 }}>of <span style={{ color: WF.ink, fontWeight: 600 }}>$600.00</span> income · {INC.month}</div>
        } />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: WF.ink3, marginRight: 2 }}>made of</span>
          <Chip>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: WF.accent }} />
            Recurring <strong style={{ fontWeight: 700 }}>$300</strong> <span style={{ color: WF.ink3 }}>/mo</span> <IcoPencil s={12} />
          </Chip>
          <span style={{ color: WF.ink3 }}>+</span>
          <Chip>
            Jun 3 <strong style={{ fontWeight: 700 }}>+$300</strong> <IcoClose />
          </Chip>
          <Chip dashed><IcoPlus s={11} /> Add income</Chip>
          <span style={{ color: WF.ink3 }}>=</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>$600 total</span>
        </div>
        <ProgressBar mb={26} />
        <StatRow compact />

        <div className="wf-note" style={{ position: 'absolute', bottom: 14, right: 30, width: 220, transform: 'rotate(-2deg)' }}>
          Every part of $600 is a chip you can tap to edit. The recurring chip is green and reads "/mo" so it's never confused with a one-off.
        </div>
      </div>
    </DesktopFrame>
  );
}

// ════════════════════════════════════════════════════════════
// E · EXPANDABLE LEDGER — "$600 ▾" expands to a running-total
//     mini-ledger with inline edit on each line.
// ════════════════════════════════════════════════════════════
function IncomeE() {
  return (
    <DesktopFrame>
      <div style={{ padding: PAD, position: 'relative' }}>
        <HeroTop right={
          <button style={{ paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 16, color: WF.ink3 }}>of <span style={{ color: WF.ink, fontWeight: 600 }}>$600.00</span> income</span>
            <span style={{ display: 'inline-flex', padding: 3, border: `1px solid ${WF.line}`, borderRadius: 6 }}><IcoCaret up /></span>
          </button>
        } />

        {/* expanded ledger */}
        <div style={{ maxWidth: 460, border: `1px solid ${WF.line}`, borderRadius: 10, overflow: 'hidden', marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: WF.bg2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: WF.accent }} />
              Recurring monthly <span style={{ fontSize: 11, color: WF.accent }}>auto</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>$300.00</span><IcoPencil s={12} />
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderTop: `1px solid ${WF.line2}`, fontSize: 13 }}>
            <span style={{ color: WF.ink2 }}>Jun 3 · Freelance invoice</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>+$300.00</span><IcoPencil s={12} /><IcoClose />
            </span>
          </div>
          <div style={{ padding: '9px 14px', borderTop: `1px solid ${WF.line2}` }}>
            <button className="wf-chip" style={{ border: `1px dashed ${WF.line}`, cursor: 'pointer' }}><IcoPlus s={11} /> Add one-off income</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '11px 14px', borderTop: `1.5px solid ${WF.line}`, background: WF.bg2 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Total income</span>
            <span style={{ fontSize: 17, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>$600.00</span>
          </div>
        </div>

        <ProgressBar mb={24} />
        <StatRow compact />

        <div className="wf-note" style={{ position: 'absolute', bottom: 14, right: 30, width: 215, transform: 'rotate(-2deg)' }}>
          The "/ $600 ▾" expands into a tiny ledger. Recurring sits at the top, one-offs below, total at the bottom — like a receipt.
        </div>
      </div>
    </DesktopFrame>
  );
}

// ════════════════════════════════════════════════════════════
// MOBILE — bottom-sheet "Manage income" (mirrors A), plus a
// labeled-button hero (mirrors C) and edit-total (mirrors B).
// ════════════════════════════════════════════════════════════
function MHero({ children }) {
  return (
    <div style={{ padding: '20px 18px 0' }}>
      <Eyebrow style={{ fontSize: 10, marginBottom: 6 }}>Spent this month</Eyebrow>
      <div style={{ fontSize: 52, fontWeight: 600, letterSpacing: -1.8, lineHeight: 0.9 }}>$100.00</div>
      {children}
    </div>
  );
}
function MStat() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px', padding: '18px 18px 0' }}>
      {[['Daily avg', '$0.00'], ['Projected', '$0.00'], ['Left to spend', '$500.00', true]].map(([k, v, g]) => (
        <div key={k}><Eyebrow style={{ fontSize: 9, marginBottom: 4 }}>{k}</Eyebrow><div style={{ fontSize: 20, fontWeight: 600, color: g ? WF.accent : WF.ink }}>{v}</div></div>
      ))}
    </div>
  );
}
function MBar() {
  return (
    <div style={{ padding: '14px 18px 0' }}>
      <div style={{ height: 5, background: WF.line2, borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: '16.7%', background: WF.warn }} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, fontSize: 11, color: WF.ink2 }}><span style={{ width: 8, height: 8, background: WF.warn, borderRadius: 2 }} />$100.00 of $600.00</div>
    </div>
  );
}

// A-mobile · bottom sheet
function IncomeAMobile() {
  return (
    <PhoneFrame>
      <MHero>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: WF.ink3 }}>of <strong style={{ color: WF.ink }}>$600.00</strong> income</span>
          <button className="wf-btn-ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}><IcoPencil s={12} /> Edit</button>
        </div>
        <div style={{ fontSize: 12, color: WF.ink3, marginTop: 8 }}><span style={{ color: WF.accent, fontWeight: 600 }}>$300 recurring</span> + <span style={{ color: WF.ink2, fontWeight: 600 }}>$300 added</span></div>
      </MHero>
      <MBar />
      <MStat />

      {/* scrim + bottom sheet */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff', borderRadius: '18px 18px 0 0', padding: '14px 18px 22px', boxShadow: '0 -8px 28px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: WF.line, margin: '0 auto 14px' }} />
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Income · {INC.month}</div>

        <Eyebrow style={{ fontSize: 10, marginBottom: 8 }}>Recurring monthly</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <MoneyInput value="300" width={84} />
          <span style={{ fontSize: 11, color: WF.accent, fontWeight: 600 }}>auto-fills each month</span>
        </div>
        <div style={{ height: 1, background: WF.line2, margin: '16px 0' }} />

        <Eyebrow style={{ fontSize: 10, marginBottom: 8 }}>Added this month</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
          <span style={{ color: WF.ink3 }}>Jun 3 · Freelance</span>
          <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}><strong>+$300.00</strong><IcoPencil s={12} /><IcoClose /></span>
        </div>
        <button className="wf-chip" style={{ marginTop: 10, border: `1px dashed ${WF.line}`, width: '100%', justifyContent: 'center', padding: '9px' }}><IcoPlus s={11} /> Add one-off income</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${WF.line}` }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Total income</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>$600.00</span>
        </div>
        <button className="wf-btn" style={{ width: '100%', justifyContent: 'center', marginTop: 16, padding: '12px' }}>Done</button>
      </div>
    </PhoneFrame>
  );
}

// C-mobile · labeled buttons inline
function IncomeCMobile() {
  return (
    <PhoneFrame>
      <MHero>
        <div style={{ fontSize: 13, color: WF.ink3, marginTop: 8 }}>of <strong style={{ color: WF.ink }}>$600.00</strong> income · {INC.month}</div>
        <div style={{ fontSize: 12, color: WF.ink3, marginTop: 8 }}><span style={{ color: WF.accent, fontWeight: 600 }}>$300 recurring</span> + <span style={{ color: WF.ink2, fontWeight: 600 }}>$300 added this month</span></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="wf-btn-ghost" style={{ flex: 1, padding: '9px', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><IcoPencil s={12} /> Edit recurring</button>
          <button className="wf-btn-ghost" style={{ flex: 1, padding: '9px', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><IcoPlus s={12} /> Add income</button>
        </div>
      </MHero>
      <MBar />
      <MStat />
      <div style={{ padding: '20px 18px 0' }}>
        <Eyebrow style={{ marginBottom: 10, fontSize: 10 }}>Added this month</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${WF.line2}`, padding: '10px 0', fontSize: 13.5 }}>
          <span style={{ color: WF.ink2 }}>Jun 3 · Freelance invoice</span>
          <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}><strong>+$300.00</strong><IcoPencil s={12} /><IcoClose /></span>
        </div>
      </div>
    </PhoneFrame>
  );
}

// B-mobile · edit the total inline
function IncomeBMobile() {
  return (
    <PhoneFrame>
      <MHero>
        <div style={{ marginTop: 12 }}>
          <Eyebrow style={{ fontSize: 10, marginBottom: 8 }}>Total income</Eyebrow>
          <MoneyInput value="600" width={120} focus />
          <div style={{ fontSize: 11.5, color: WF.ink3, marginTop: 10, lineHeight: 1.5 }}>
            Sets <span style={{ color: WF.accent, fontWeight: 600 }}>recurring to $300</span><br />keeps <span style={{ color: WF.ink2, fontWeight: 600 }}>$300 added this month</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="wf-btn" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}>Save</button>
            <button className="wf-btn-ghost" style={{ flex: 1, padding: '11px' }}>Cancel</button>
          </div>
        </div>
      </MHero>
      <div style={{ marginTop: 22 }}><MBar /></div>
      <MStat />
    </PhoneFrame>
  );
}

// E-mobile · expandable ledger (receipt style)
function IncomeEMobile() {
  return (
    <PhoneFrame>
      <MHero>
        <button style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
          <span style={{ fontSize: 13, color: WF.ink3 }}>of <strong style={{ color: WF.ink }}>$600.00</strong> income</span>
          <span style={{ display: 'inline-flex', padding: 3, border: `1px solid ${WF.line}`, borderRadius: 6 }}><IcoCaret up s={11} /></span>
        </button>
      </MHero>

      {/* expanded ledger */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{ border: `1px solid ${WF.line}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: WF.bg2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: WF.accent }} />
              Recurring monthly <span style={{ fontSize: 10, color: WF.accent, fontWeight: 600 }}>AUTO</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>$300.00</span><IcoPencil s={13} />
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderTop: `1px solid ${WF.line2}`, fontSize: 13 }}>
            <span style={{ color: WF.ink2 }}>Jun 3 · Freelance</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>+$300.00</span><IcoPencil s={13} /><IcoClose />
            </span>
          </div>
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${WF.line2}` }}>
            <button className="wf-chip" style={{ border: `1px dashed ${WF.line}`, width: '100%', justifyContent: 'center', padding: '9px', cursor: 'pointer' }}><IcoPlus s={11} /> Add one-off income</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '13px 14px', borderTop: `1.5px solid ${WF.line}`, background: WF.bg2 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Total income</span>
            <span style={{ fontSize: 19, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>$600.00</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}><MBar /></div>
      <MStat />
    </PhoneFrame>
  );
}

Object.assign(window, {
  IncomeA, IncomeB, IncomeC, IncomeD, IncomeE,
  IncomeAMobile, IncomeCMobile, IncomeBMobile, IncomeEMobile,
});
