// Shared wireframe primitives — mid-fi, grayscale + one accent
// Intentionally rough: dashed placeholders, sparse content, minimal copy.

const WF = {
  ink: '#1a1a1a',
  ink2: '#444',
  ink3: '#888',
  line: '#d8d8d8',
  line2: '#ececec',
  bg: '#ffffff',
  bg2: '#fafafa',
  accent: 'oklch(0.65 0.13 150)',     // muted green
  accentSoft: 'oklch(0.94 0.04 150)',
  warn: 'oklch(0.72 0.12 55)',
  sans: "'Inter', -apple-system, system-ui, sans-serif",
  hand: "'Caveat', cursive",
};

// One-time style injection
if (typeof document !== 'undefined' && !document.getElementById('wf-styles')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Caveat:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap';
  document.head.appendChild(link);
  const s = document.createElement('style');
  s.id = 'wf-styles';
  s.textContent = `
    .wf * { box-sizing: border-box; }
    .wf { font-family: ${WF.sans}; color: ${WF.ink}; background: ${WF.bg}; width: 100%; height: 100%; position: relative; overflow: hidden; }
    .wf-btn { border: 1.5px solid ${WF.ink}; background: ${WF.ink}; color: #fff; padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-family: inherit; }
    .wf-btn-ghost { border: 1.5px solid ${WF.line}; background: transparent; color: ${WF.ink}; padding: 9px 16px; border-radius: 999px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }
    .wf-chip { border: 1px solid ${WF.line}; border-radius: 999px; padding: 5px 10px; font-size: 11px; color: ${WF.ink2}; background: ${WF.bg}; display: inline-flex; align-items: center; gap: 6px; }
    .wf-placeholder { border: 1.5px dashed ${WF.line}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${WF.ink3}; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-align: center; padding: 8px; background: ${WF.bg2}; }
    .wf-note { font-family: ${WF.hand}; color: ${WF.ink2}; font-size: 15px; line-height: 1.1; }
    .wf-divider { height: 1px; background: ${WF.line2}; }
    .wf-kbd { font-family: 'JetBrains Mono', monospace; font-size: 10px; border: 1px solid ${WF.line}; padding: 1px 5px; border-radius: 3px; color: ${WF.ink3}; }
  `;
  document.head.appendChild(s);
}

// Generic placeholder box with monospace label
function Placeholder({ label, style, children }) {
  return <div className="wf-placeholder" style={style}>{children || label}</div>;
}

// Status bar for mobile frames
function StatusBar({ dark }) {
  const c = dark ? '#fff' : WF.ink;
  return (
    <div style={{ height: 28, padding: '0 18px 0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: c, fontFamily: WF.sans }}>
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <svg width="14" height="8" viewBox="0 0 14 8" fill={c}><rect y="5" width="2" height="3" rx="0.5"/><rect x="4" y="3" width="2" height="5" rx="0.5"/><rect x="8" y="1" width="2" height="7" rx="0.5"/><rect x="12" width="2" height="8" rx="0.5"/></svg>
        <svg width="10" height="8" viewBox="0 0 10 8" fill={c}><path d="M5 1.5a4 4 0 0 1 2.8 1.2l.7-.7a5 5 0 0 0-7 0l.7.7A4 4 0 0 1 5 1.5zm0 2a2 2 0 0 1 1.4.6l.7-.7a3 3 0 0 0-4.2 0l.7.7A2 2 0 0 1 5 3.5zm0 2a1 1 0 0 0-1 1 1 1 0 1 0 2 0 1 1 0 0 0-1-1z"/></svg>
        <svg width="18" height="8" viewBox="0 0 18 8" fill="none" stroke={c} strokeWidth="0.8"><rect x="0.5" y="0.5" width="14" height="7" rx="1.5"/><rect x="2" y="2" width="10" height="4" rx="0.5" fill={c} stroke="none"/><rect x="15" y="3" width="1.5" height="2" rx="0.3" fill={c} stroke="none"/></svg>
      </div>
    </div>
  );
}

// Mobile frame wrapper (inner content area 375x760)
function PhoneFrame({ children, dark }) {
  return (
    <div className="wf" style={{ background: dark ? '#1a1a1a' : WF.bg, color: dark ? '#fff' : WF.ink }}>
      <StatusBar dark={dark} />
      <div style={{ position: 'absolute', inset: '28px 0 0', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

// Desktop frame — just a white canvas, no chrome. Content defines its own layout.
function DesktopFrame({ children }) {
  return <div className="wf">{children}</div>;
}

// Sketchy hand-drawn underline for annotations
function Scribble({ w = 40, style }) {
  return (
    <svg width={w} height="8" viewBox={`0 0 ${w} 8`} style={style} fill="none" stroke={WF.ink2} strokeWidth="1.2" strokeLinecap="round">
      <path d={`M2 5 Q ${w*0.25} 2, ${w*0.5} 5 T ${w-2} 5`} />
    </svg>
  );
}

// Sketchy chart placeholder (line)
function ChartLine({ w = 280, h = 80, points = 12, seed = 1 }) {
  const rnd = (i) => {
    const x = Math.sin((i + seed) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const pts = Array.from({ length: points }, (_, i) => {
    const x = (i / (points - 1)) * (w - 20) + 10;
    const y = 15 + rnd(i) * (h - 30);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={WF.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Sketchy bar chart
function ChartBars({ w = 280, h = 80, bars = 7, seed = 1 }) {
  const rnd = (i) => {
    const x = Math.sin((i + seed) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const bw = (w - (bars + 1) * 6) / bars;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {Array.from({ length: bars }, (_, i) => {
        const bh = 12 + rnd(i) * (h - 20);
        return <rect key={i} x={6 + i * (bw + 6)} y={h - bh} width={bw} height={bh} fill={WF.ink} rx="2" />;
      })}
    </svg>
  );
}

// Google "G" logo mark
function GoogleG({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09 0-.73.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// Sheets "icon"
function SheetsIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="2" width="18" height="20" rx="2" fill="#0F9D58"/>
      <rect x="6" y="8" width="12" height="1.5" fill="#fff" opacity="0.9"/>
      <rect x="6" y="11" width="12" height="1.5" fill="#fff" opacity="0.9"/>
      <rect x="6" y="14" width="12" height="1.5" fill="#fff" opacity="0.9"/>
      <rect x="11" y="7" width="1.5" height="10" fill="#0F9D58"/>
    </svg>
  );
}

Object.assign(window, { WF, Placeholder, StatusBar, PhoneFrame, DesktopFrame, Scribble, ChartLine, ChartBars, GoogleG, SheetsIcon });
