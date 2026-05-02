// fa-components.jsx — Shared utilities and UI components

const C = {
  navy: '#1e3564', navyDark: '#0f1d3a', navyMid: '#2d4a7a',
  gold: '#c8962e', goldLight: '#f5e7c0', goldPale: '#fdf6e8',
  bg: '#f2f0ec', surface: '#ffffff', border: '#ddd8ce', borderLight: '#eeeae3',
  text: '#1a1a1a', textMid: '#3d3d3d', muted: '#6b6b6b', mutedLight: '#9a9a9a',
  success: '#1e6e3e', danger: '#b82a2a', warn: '#7a5000',
  successBg: '#e8f4ed', dangerBg: '#fceaea', warnBg: '#fef7e6',
};

const fmtM = (n, d = 1) => {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n), s = n < 0 ? '-' : '';
  if (abs >= 1000000) return `${s}$${(abs / 1e6).toFixed(d)}T`;
  if (abs >= 1000)    return `${s}$${(abs / 1000).toFixed(d)}B`;
  if (abs >= 1)       return `${s}$${abs.toFixed(0)}M`;
  return `${s}$${(abs * 1000).toFixed(0)}K`;
};
const fmtPct   = (n, sign = true) => (n == null || isNaN(n)) ? '—' : `${sign && n > 0 ? '+' : ''}${(n * 100).toFixed(1)}%`;
const fmtRatio = (n, d = 2)       => (n == null || isNaN(n)) ? '—' : n.toFixed(d);
const fmtX     = (n, d = 1)       => (n == null || isNaN(n)) ? '—' : `${n.toFixed(d)}x`;
const yoyPct   = (curr, prev)     => (prev && curr && prev !== 0) ? (curr - prev) / Math.abs(prev) : null;

const btn = (variant = 'primary') => {
  const base = {
    fontFamily: 'Source Sans 3', cursor: 'pointer', border: 'none',
    borderRadius: 6, fontWeight: 600, transition: 'all .15s',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  };
  if (variant === 'primary')   return { ...base, background: C.gold, color: 'white', padding: '8px 18px' };
  if (variant === 'outline')   return { ...base, background: 'transparent', border: '1.5px solid rgba(255,255,255,.4)', color: 'white', padding: '7px 16px' };
  if (variant === 'ghost')     return { ...base, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.8)', padding: '6px 14px' };
  if (variant === 'secondary') return { ...base, background: C.surface, border: `1.5px solid ${C.border}`, color: C.text, padding: '7px 16px' };
  return base;
};

// ── Header ──────────────────────────────────────────────────────────────────
function Header({ onNew, onSaved, savedCount }) {
  return (
    <header style={{ background: C.navyDark, color: 'white', padding: '0 32px', height: 58,
                     display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                     boxShadow: '0 2px 12px rgba(0,0,0,.35)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, background: C.gold, borderRadius: 7,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="9" width="3" height="8" fill="white" rx="1"/>
            <rect x="6" y="5" width="3" height="12" fill="white" rx="1"/>
            <rect x="11" y="2" width="3" height="15" fill="white" rx="1"/>
            <path d="M2.5 8L7.5 4L12.5 1.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'Lora', fontWeight: 700, fontSize: 17 }}>10-K Financial Analyzer</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: '.03em' }}>AI-Powered Annual Report Analysis</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {savedCount > 0 && (
          <button onClick={onSaved} style={{ ...btn('ghost'), fontSize: 12 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1L8 5H12L8.5 7.5L9.8 12L6.5 9.5L3.2 12L4.5 7.5L1 5H5Z" fill="currentColor"/></svg>
            Saved ({savedCount})
          </button>
        )}
        <button onClick={onNew} style={{ ...btn('outline'), fontSize: 12 }}>
          + New Analysis
        </button>
      </div>
    </header>
  );
}

// ── Ticker / EDGAR Section ───────────────────────────────────────────────────
function TickerSection({ ticker, setTicker, onGenerate }) {
  const [showHelp, setShowHelp] = React.useState(false);
  const [edgarUrl, setEdgarUrl] = React.useState('');

  const handleGen = () => {
    if (!ticker.trim()) return;
    const u = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker.toUpperCase()}&type=10-K&dateb=&owner=include&count=10`;
    setEdgarUrl(u);
    setShowHelp(true);
    onGenerate?.(u);
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 22, marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        Step 1 — Find your 10-K on EDGAR
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleGen()}
          placeholder="Ticker symbol (e.g. AAPL, MSFT)"
          style={{ flex: 1, border: `1.5px solid ${C.border}`, borderRadius: 6, padding: '9px 14px', fontSize: 15, outline: 'none', background: C.bg, transition: 'border .15s' }}
          onFocus={e => e.target.style.borderColor = C.navy}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <button onClick={handleGen} style={{ ...btn('primary'), fontSize: 14 }}>Generate Link</button>
        {edgarUrl && (
          <a href={edgarUrl} target="_blank" rel="noopener noreferrer"
            style={{ ...btn('secondary'), textDecoration: 'none', fontSize: 14 }}>
            Open EDGAR ↗
          </a>
        )}
      </div>

      {showHelp && (
        <div className="fade-in" style={{ marginTop: 16, background: C.goldPale, border: `1px solid ${C.goldLight}`, borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Lora', fontWeight: 600, fontSize: 14, color: C.navy }}>How to download the 10-K PDF</div>
            <button onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 20, lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              {
                title: 'Via EDGAR Directly', color: C.navyMid,
                steps: ['Click "Open EDGAR ↗" above', 'Find the most recent 10-K filing', 'Click the filing date link', 'Open the main .htm document', 'Print → Save as PDF if needed'],
              },
              {
                title: 'Via SEC ePrint Tool', color: C.gold,
                steps: ['Visit the SEC ePrint link below', 'Enter company name or CIK', 'Select 10-K filing type', 'Download formatted PDF directly'],
                link: { href: 'https://efts.sec.gov/LATEST/search-index?forms=10-K', label: 'Open SEC EDGAR Full-Text Search ↗' },
              },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: col.color, marginBottom: 10 }}>{col.title}</div>
                {col.steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, lineHeight: 1.4 }}>
                    <span style={{ width: 18, height: 18, background: col.color, color: 'white', borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginTop: 1 }}>{i + 1}</span>
                    <span style={{ color: C.textMid }}>{s}</span>
                  </div>
                ))}
                {col.link && <a href={col.link.href} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: C.navy, fontWeight: 700, textDecoration: 'none', borderBottom: `1px solid ${C.navy}` }}>
                  {col.link.label}
                </a>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ onFile, compareMode, files }) {
  const [drag, setDrag] = React.useState([false, false]);
  const refs = [React.useRef(), React.useRef()];

  const handleDrop = (e, idx) => {
    e.preventDefault();
    setDrag(d => { const n = [...d]; n[idx] = false; return n; });
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') onFile(f, idx);
  };
  const setDragIdx = (idx, val) => setDrag(d => { const n = [...d]; n[idx] = val; return n; });

  const Box = ({ idx }) => {
    const f = files[idx];
    const isDragging = drag[idx];
    return (
      <div onDragOver={e => { e.preventDefault(); setDragIdx(idx, true); }}
           onDragLeave={() => setDragIdx(idx, false)}
           onDrop={e => handleDrop(e, idx)}
           onClick={() => refs[idx].current.click()}
           style={{
             flex: 1, border: `2px dashed ${isDragging ? C.gold : f ? C.success : C.border}`,
             borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
             background: isDragging ? C.goldPale : f ? C.successBg : C.surface,
             transition: 'all .2s', minWidth: 0,
           }}>
        <input ref={refs[idx]} type="file" accept=".pdf" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files[0]; if (f) { onFile(f, idx); e.target.value = ''; } }}/>
        {f ? (
          <>
            <div style={{ fontSize: 26, marginBottom: 6 }}>✓</div>
            <div style={{ fontWeight: 700, color: C.success, fontSize: 14, wordBreak: 'break-all' }}>{f.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{(f.size / 1024 / 1024).toFixed(1)} MB · click to replace</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 34, marginBottom: 10, opacity: 0.35 }}>📄</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.navy }}>
              {compareMode ? (idx === 0 ? 'Company A' : 'Company B') : 'Drop 10-K PDF here'}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>PDF · drag & drop or click to browse</div>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        Step 2 — Upload 10-K PDF{compareMode ? 's' : ''}
      </label>
      <div style={{ display: 'flex', gap: 12 }}>
        <Box idx={0}/>
        {compareMode && <Box idx={1}/>}
      </div>
    </div>
  );
}

// ── Progress Steps ───────────────────────────────────────────────────────────
function ProgressSteps({ steps, current, error }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
      <div style={{ fontFamily: 'Lora', fontWeight: 700, fontSize: 18, color: C.navy, marginBottom: 24 }}>Analyzing 10-K…</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {steps.map((s, i) => {
          const done = i < current, active = i === current, pending = i > current;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: pending ? .38 : 1, transition: 'opacity .3s' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: done ? C.success : active ? C.gold : C.borderLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s',
              }}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/></svg>
                ) : active ? (
                  <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2.5px solid white', borderTopColor: 'transparent', animation: 'spin .75s linear infinite' }}/>
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.mutedLight }}/>
                )}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: active ? 700 : done ? 600 : 400, color: active ? C.navy : done ? C.success : C.muted }}>{s.label}</div>
                {active && s.detail && <div style={{ fontSize: 12, color: C.muted, marginTop: 2, animation: 'pulse 2s ease infinite' }}>{s.detail}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <div style={{ marginTop: 20, padding: '10px 14px', background: C.dangerBg, border: `1px solid ${C.danger}33`, borderRadius: 7, color: C.danger, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

// ── Saved Panel ──────────────────────────────────────────────────────────────
function SavedPanel({ saved, onLoad, onDelete, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', zIndex: 190 }}/>
      <div className="fade-in" style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 340,
        background: C.surface, borderLeft: `1px solid ${C.border}`,
        boxShadow: '-6px 0 30px rgba(0,0,0,.15)', zIndex: 200,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Lora', fontWeight: 700, fontSize: 18, color: C.navy }}>Saved Analyses</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 22 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {saved.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.muted, fontSize: 14, marginTop: 50 }}>No saved analyses yet</div>
          ) : saved.map((item, i) => (
            <div key={i} onClick={() => { onLoad(item); onClose(); }}
              style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 10, cursor: 'pointer', background: C.bg, transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.goldPale}
              onMouseLeave={e => e.currentTarget.style.background = C.bg}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>{item.company?.name || 'Unknown'}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {item.company?.ticker && `${item.company.ticker} · `}FY{item.company?.fiscalYear}
                  </div>
                  <div style={{ fontSize: 11, color: C.mutedLight, marginTop: 2 }}>
                    {new Date(item.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); onDelete(i); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 15, padding: '2px 4px' }}>🗑</button>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: C.textMid, display: 'flex', gap: 12 }}>
                <span>Rev: <strong>{fmtM(item.kpis?.revenue)}</strong></span>
                <span>NI: <strong>{fmtM(item.kpis?.netIncome)}</strong></span>
                <span>FCF: <strong>{fmtM(item.kpis?.freeCashFlow)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { C, fmtM, fmtPct, fmtRatio, fmtX, yoyPct, btn, Header, TickerSection, UploadZone, ProgressSteps, SavedPanel });
