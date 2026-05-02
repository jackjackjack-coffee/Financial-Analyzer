// fa-results.jsx — All 5 result tabs + supporting components

// ── Industry benchmarks ──────────────────────────────────────────────────────
const BENCHMARKS = {
  technology:  { currentRatio:2.0, quickRatio:1.7, debtToEquity:0.5,  roe:0.25, roa:0.12, grossMargin:0.55, operatingMargin:0.22, netMargin:0.20, assetTurnover:0.80 },
  financial:   { currentRatio:1.1, quickRatio:1.0, debtToEquity:2.5,  roe:0.12, roa:0.01, grossMargin:0.40, operatingMargin:0.25, netMargin:0.22, assetTurnover:0.10 },
  healthcare:  { currentRatio:2.1, quickRatio:1.5, debtToEquity:0.8,  roe:0.15, roa:0.07, grossMargin:0.55, operatingMargin:0.15, netMargin:0.12, assetTurnover:0.70 },
  consumer:    { currentRatio:1.5, quickRatio:1.1, debtToEquity:1.2,  roe:0.18, roa:0.08, grossMargin:0.35, operatingMargin:0.12, netMargin:0.08, assetTurnover:1.20 },
  industrial:  { currentRatio:1.7, quickRatio:1.2, debtToEquity:0.9,  roe:0.14, roa:0.07, grossMargin:0.30, operatingMargin:0.12, netMargin:0.09, assetTurnover:0.90 },
  energy:      { currentRatio:1.4, quickRatio:1.0, debtToEquity:1.0,  roe:0.10, roa:0.06, grossMargin:0.35, operatingMargin:0.14, netMargin:0.10, assetTurnover:0.60 },
  default:     { currentRatio:1.8, quickRatio:1.3, debtToEquity:0.8,  roe:0.15, roa:0.08, grossMargin:0.40, operatingMargin:0.14, netMargin:0.10, assetTurnover:0.90 },
};
const getBenchmark = (sector) => BENCHMARKS[(sector||'').toLowerCase().split(/[\s,]/)[0]] || BENCHMARKS.default;

// ── DCF computation ──────────────────────────────────────────────────────────
function computeDCF({ baseFCF, fcfGrowth, wacc, tgr, years = 5, cash = 0, debt = 0, shares = 1 }) {
  if (!baseFCF || !wacc || wacc <= tgr) return null;
  let pvFCFs = 0, fcf = baseFCF;
  const projections = [];
  for (let i = 1; i <= years; i++) {
    fcf *= (1 + fcfGrowth);
    const pv = fcf / Math.pow(1 + wacc, i);
    pvFCFs += pv;
    projections.push({ year: i, fcf, pv });
  }
  const tv  = fcf * (1 + tgr) / (wacc - tgr);
  const pvTV = tv / Math.pow(1 + wacc, years);
  const ev   = pvFCFs + pvTV;
  const equity = ev - debt + cash;
  const iv   = shares > 0 ? equity / shares : null;
  return { pvFCFs, pvTV, tv, ev, equity, iv, projections };
}

// ── Mini bar chart ───────────────────────────────────────────────────────────
function BarChart({ title, data, fmt }) {
  if (!data?.length) return null;
  const vals   = data.map(d => d.value ?? 0);
  const maxAbs = Math.max(...vals.map(Math.abs), 1);
  const W = 250, barW = 56, gap = 14, padL = 6, padB = 22, chartH = 130;
  const COLS = ['#8aaad0', '#4370a8', C.gold];
  const fmtFn = fmt || ((n) => fmtM(n, 0));

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>{title}</div>
      <svg width={W} height={chartH + padB} style={{ overflow: 'visible' }}>
        {data.map((d, i) => {
          const x    = padL + i * (barW + gap);
          const bH   = (Math.abs(d.value ?? 0) / maxAbs) * (chartH - 26);
          const neg  = (d.value ?? 0) < 0;
          const y    = neg ? chartH - padB / 2 : chartH - padB / 2 - bH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(bH, 2)} fill={COLS[i % 3]} rx={3}/>
              <text x={x + barW / 2} y={chartH - padB / 2 + 14} textAnchor="middle" fontSize={10} fill={C.muted}>{d.year}</text>
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={10} fill={C.textMid} fontWeight={i === data.length - 1 ? '700' : '400'}>
                {fmtFn(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── YoY badge ────────────────────────────────────────────────────────────────
function YoYBadge({ value }) {
  if (value == null) return <span style={{ color: C.muted }}>—</span>;
  const isPos = value >= 0;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                   background: isPos ? C.successBg : C.dangerBg, color: isPos ? C.success : C.danger }}>
      {isPos ? '+' : ''}{(value * 100).toFixed(1)}%
    </span>
  );
}

// ── Footnotes section ────────────────────────────────────────────────────────
function FootnotesSection({ footnotes }) {
  const [open, setOpen] = React.useState(false);
  const entries = Object.entries(footnotes || {}).filter(([, v]) => v);
  if (!entries.length) return null;
  return (
    <div style={{ marginTop: 20, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', padding: '10px 16px', background: C.bg, border: 'none', cursor: 'pointer',
                 display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: C.muted }}>
        <span>📌 Source Footnotes</span>
        <span style={{ fontSize: 11 }}>{open ? '▲ collapse' : '▼ expand'}</span>
      </button>
      {open && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 7, background: C.surface }}>
          {entries.map(([k, v]) => (
            <div key={k} style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: C.textMid, marginRight: 6, textTransform: 'capitalize' }}>{k}:</span>{v}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Summary
// ══════════════════════════════════════════════════════════════════════════════
function SummaryTab({ data }) {
  const { company, kpis, summary, flags } = data;
  const kpiCards = [
    { label: 'Revenue',        val: fmtM(kpis?.revenue),       sub: kpis?.revenueGrowth != null ? `${fmtPct(kpis.revenueGrowth)} YoY` : null },
    { label: 'Net Income',     val: fmtM(kpis?.netIncome),      sub: kpis?.netMargin != null ? `${fmtPct(kpis.netMargin, false)} net margin` : null },
    { label: 'EPS',            val: kpis?.eps != null ? `$${kpis.eps.toFixed(2)}` : '—', sub: null },
    { label: 'Free Cash Flow', val: fmtM(kpis?.freeCashFlow),  sub: null },
    { label: 'Cash',           val: fmtM(kpis?.cash),           sub: null },
    { label: 'Total Debt',     val: fmtM(kpis?.totalDebt),      sub: null },
  ];

  return (
    <div className="fade-in">
      {/* Company header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 5, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'Lora', fontSize: 28, fontWeight: 700, color: C.navyDark }}>{company?.name || 'Unknown Company'}</h2>
          {company?.ticker && <span style={{ fontSize: 13, fontWeight: 700, color: C.gold, background: C.goldPale, padding: '2px 10px', borderRadius: 4 }}>{company.ticker}</span>}
          {company?.sector && <span style={{ fontSize: 13, color: C.muted, background: C.bg, padding: '2px 10px', borderRadius: 4 }}>{company.sector}</span>}
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>Fiscal Year {company?.fiscalYear}{company?.filingDate ? ` · Filed ${company.filingDate}` : ''}</div>
        {company?.description && (
          <p style={{ fontSize: 14, color: C.textMid, marginTop: 10, lineHeight: 1.65, fontStyle: 'italic', borderLeft: `3px solid ${C.goldLight}`, paddingLeft: 14 }}>
            {company.description}
          </p>
        )}
      </div>

      {/* KPI grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
        {kpiCards.map(({ label, val, sub }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', flex: '1 1 130px', minWidth: 120 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>{label}</div>
            <div style={{ fontFamily: 'Lora', fontSize: 22, fontWeight: 700, color: C.navyDark, lineHeight: 1 }}>{val}</div>
            {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Headline */}
      {summary?.headline && (
        <div style={{ background: C.navy, color: 'white', borderRadius: 8, padding: '14px 22px', marginBottom: 20, fontFamily: 'Lora', fontSize: 15, fontStyle: 'italic', lineHeight: 1.5 }}>
          "{summary.headline}"
        </div>
      )}

      {/* Key points grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { title: 'Key Highlights',       items: summary?.keyPoints,    color: C.navy,    bg: '#f0f4fa' },
          { title: 'Risk Factors',          items: summary?.risks,         color: C.danger,  bg: C.dangerBg },
          { title: 'Growth Opportunities',  items: summary?.opportunities, color: C.success, bg: C.successBg },
        ].map(({ title, items, color, bg }) => (
          <div key={title} style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.07em', color, marginBottom: 10 }}>{title}</div>
            {(items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13, lineHeight: 1.45 }}>
                <span style={{ color, fontWeight: 700, flexShrink: 0 }}>›</span>
                <span style={{ color: C.textMid }}>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Flags */}
      {flags && (flags.strengths?.length || flags.weaknesses?.length) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { title: '🟢 Strengths', items: flags.strengths, color: C.success, bg: C.successBg },
            { title: '🔴 Weaknesses', items: flags.weaknesses, color: C.danger, bg: C.dangerBg },
          ].map(({ title, items, color, bg }) => (
            <div key={title} style={{ background: bg, border: `1px solid ${color}33`, borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 10 }}>{title}</div>
              {(items || []).map((item, i) => (
                <div key={i} style={{ fontSize: 13, color: C.textMid, marginBottom: 7, lineHeight: 1.4, paddingLeft: 10, borderLeft: `2px solid ${color}44` }}>{item}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Financial Statements
// ══════════════════════════════════════════════════════════════════════════════
function StatementsTab({ data, onCSVCopied }) {
  const [sheet, setSheet] = React.useState('income');
  const { incomeStatement: income, balanceSheet: balance, cashFlow } = data;

  const SHEETS = [
    { id: 'income',  label: 'Income Statement' },
    { id: 'balance', label: 'Balance Sheet' },
    { id: 'cashflow',label: 'Cash Flow' },
  ];
  const ROWS = {
    income: [
      { label: 'Revenue',           key: 'revenue' },
      { label: 'Gross Profit',      key: 'grossProfit' },
      { label: '  Gross Margin',    pct: true, compute: d => d.grossProfit && d.revenue ? d.grossProfit / d.revenue : null },
      { label: 'Operating Income',  key: 'operatingIncome' },
      { label: '  Operating Margin',pct: true, compute: d => d.operatingIncome && d.revenue ? d.operatingIncome / d.revenue : null },
      { label: 'Net Income',        key: 'netIncome' },
      { label: '  Net Margin',      pct: true, compute: d => d.netIncome && d.revenue ? d.netIncome / d.revenue : null },
      { label: 'EBITDA',            key: 'ebitda' },
    ],
    balance: [
      { label: 'Cash & Equivalents', key: 'cash' },
      { label: 'Current Assets',     key: 'currentAssets' },
      { label: 'Total Assets',       key: 'totalAssets' },
      { label: 'Current Liabilities',key: 'currentLiabilities' },
      { label: 'Total Liabilities',  key: 'totalLiabilities' },
      { label: 'Total Debt',         key: 'totalDebt' },
      { label: "Shareholders' Equity",key: 'equity' },
    ],
    cashflow: [
      { label: 'Operating Cash Flow',  key: 'operatingCF' },
      { label: 'Investing Cash Flow',  key: 'investingCF' },
      { label: 'Financing Cash Flow',  key: 'financingCF' },
      { label: 'Free Cash Flow',       key: 'freeCashFlow' },
      { label: 'Capital Expenditure',  key: 'capex' },
    ],
  };

  const rows    = ROWS[sheet];
  const rawData = sheet === 'income' ? income : sheet === 'balance' ? balance : cashFlow;
  if (!rawData?.length) return <div style={{ color: C.muted, fontSize: 14, padding: 20 }}>No data available for this statement.</div>;

  const sorted = [...rawData].sort((a, b) => +(a.year ?? a.y ?? 0) - +(b.year ?? b.y ?? 0));
  const years  = sorted.map(d => d.year ?? d.y);

  const getVal = (row, d) => row.compute ? row.compute(d) : d[row.key];

  const buildCSV = () => {
    const yoyHeaders = years.slice(1).map(y => `YoY ${y}`);
    const header = ['Metric', ...years, ...yoyHeaders].join(',');
    const lines  = rows.map(row => {
      const vals = sorted.map(d => {
        const v = getVal(row, d);
        return row.pct ? (v != null ? (v * 100).toFixed(1) + '%' : '') : (v ?? '');
      });
      const yoys = sorted.slice(1).map((d, i) => {
        if (row.pct || row.compute) return '';
        const c = d[row.key], p = sorted[i][row.key];
        return (c != null && p != null && p !== 0) ? ((c - p) / Math.abs(p) * 100).toFixed(1) + '%' : '';
      });
      return [row.label.trim(), ...vals, ...yoys].join(',');
    });
    return [header, ...lines].join('\n');
  };

  const thStyle = (extra = {}) => ({ padding: '10px 14px', textAlign: 'right', color: 'white', fontWeight: 700, fontSize: 13, ...extra });
  const tdStyle = (extra = {}) => ({ padding: '9px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, ...extra });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {SHEETS.map(s => (
            <button key={s.id} onClick={() => setSheet(s.id)}
              style={{ ...btn(sheet === s.id ? 'primary' : 'secondary'), fontSize: 13, padding: '6px 14px' }}>
              {s.label}
            </button>
          ))}
        </div>
        <button onClick={() => { navigator.clipboard.writeText(buildCSV()); onCSVCopied?.(); }}
          style={{ ...btn('secondary'), fontSize: 12, padding: '5px 12px' }}>
          📋 Copy as CSV
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.navyDark }}>
              <th style={{ ...thStyle({ textAlign: 'left', color: 'rgba(255,255,255,.6)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', width: '32%' }) }}>Metric</th>
              {sorted.map((d, i) => <th key={i} style={thStyle()}>FY{d.year ?? d.y}</th>)}
              {sorted.slice(1).map((d, i) => (
                <th key={`yh${i}`} style={thStyle({ color: 'rgba(255,255,255,.55)', fontWeight: 600, fontSize: 11 })}>YoY {d.year ?? d.y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? C.surface : C.bg, borderBottom: `1px solid ${C.borderLight}` }}>
                <td style={{ padding: '9px 14px', paddingLeft: row.pct ? 26 : 14, fontWeight: row.pct ? 400 : 600, fontSize: row.pct ? 12 : 13, color: row.pct ? C.muted : C.text, fontStyle: row.pct ? 'italic' : 'normal' }}>
                  {row.label.trim()}
                </td>
                {sorted.map((d, ci) => {
                  const v = getVal(row, d);
                  return (
                    <td key={ci} style={tdStyle({ color: C.textMid })}>
                      {row.pct ? (v != null ? fmtPct(v, false) : '—') : (v != null ? fmtM(v) : '—')}
                    </td>
                  );
                })}
                {sorted.slice(1).map((d, ci) => {
                  if (row.pct || row.compute) return <td key={`yoy${ci}`} style={tdStyle({ textAlign: 'center', color: C.muted })}>—</td>;
                  const c = d[row.key], p = sorted[ci][row.key];
                  return <td key={`yoy${ci}`} style={tdStyle({ textAlign: 'center' })}><YoYBadge value={yoyPct(c, p)}/></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FootnotesSection footnotes={data.footnotes}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Trend Analysis
// ══════════════════════════════════════════════════════════════════════════════
function TrendsTab({ data }) {
  const { incomeStatement: income, cashFlow } = data;
  if (!income?.length) return <div style={{ color: C.muted }}>No data available.</div>;

  const sorted  = [...income].sort((a, b) => +(a.year ?? a.y) - +(b.year ?? b.y));
  const cfSorted = cashFlow ? [...cashFlow].sort((a, b) => +(a.year ?? a.y) - +(b.year ?? b.y)) : [];
  const mapData = (arr, key) => arr.map(d => ({ year: `FY${d.year ?? d.y}`, value: d[key] }));

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { title: 'Revenue',       data: mapData(sorted, 'revenue') },
          { title: 'Net Income',    data: mapData(sorted, 'netIncome') },
          { title: 'EBITDA',        data: mapData(sorted, 'ebitda') },
          ...(cfSorted.length ? [{ title: 'Free Cash Flow', data: mapData(cfSorted, 'freeCashFlow') }] : []),
        ].map(({ title, data: d }) => (
          <div key={title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, display: 'flex', justifyContent: 'center' }}>
            <BarChart title={title} data={d}/>
          </div>
        ))}
      </div>

      {/* Margin trends table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', background: C.navyDark }}>
          <span style={{ fontFamily: 'Lora', fontWeight: 700, fontSize: 15, color: 'white' }}>Margin Trends</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}`, background: C.bg }}>
              <th style={{ padding: '9px 16px', textAlign: 'left', color: C.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Margin</th>
              {sorted.map((d, i) => <th key={i} style={{ padding: '9px 16px', textAlign: 'right', color: C.navy, fontWeight: 700 }}>FY{d.year ?? d.y}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Gross Margin',     fn: d => d.grossProfit && d.revenue ? d.grossProfit / d.revenue : null },
              { label: 'Operating Margin', fn: d => d.operatingIncome && d.revenue ? d.operatingIncome / d.revenue : null },
              { label: 'Net Margin',       fn: d => d.netIncome && d.revenue ? d.netIncome / d.revenue : null },
              { label: 'EBITDA Margin',    fn: d => d.ebitda && d.revenue ? d.ebitda / d.revenue : null },
            ].map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? C.surface : C.bg, borderBottom: `1px solid ${C.borderLight}` }}>
                <td style={{ padding: '9px 16px', fontWeight: 500 }}>{row.label}</td>
                {sorted.map((d, ci) => {
                  const v = row.fn(d);
                  return <td key={ci} style={{ padding: '9px 16px', textAlign: 'right', fontFamily: 'monospace', color: C.textMid }}>{v != null ? fmtPct(v, false) : '—'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Accounting Ratios
// ══════════════════════════════════════════════════════════════════════════════
function RatiosTab({ data }) {
  const { ratios, company } = data;
  const bench = getBenchmark(company?.sector);
  if (!ratios) return <div style={{ color: C.muted, padding: 20 }}>No ratio data available.</div>;

  const flag = (v, b, hiGood = true) => {
    if (v == null || b == null) return 'neutral';
    const d = (v - b) / Math.abs(b);
    if (hiGood) return d > 0.18 ? 'positive' : d < -0.22 ? 'negative' : 'neutral';
    return d < -0.18 ? 'positive' : d > 0.22 ? 'negative' : 'neutral';
  };

  const GROUPS = [
    { title: 'Liquidity', rows: [
      { label: 'Current Ratio',   key: 'currentRatio',   bKey: 'currentRatio',   fmt: fmtRatio,              hiGood: true,  note: 'Current assets ÷ current liabilities' },
      { label: 'Quick Ratio',     key: 'quickRatio',     bKey: 'quickRatio',     fmt: fmtRatio,              hiGood: true,  note: '(Cash + receivables) ÷ current liabilities' },
    ]},
    { title: 'Leverage', rows: [
      { label: 'Debt / Equity',       key: 'debtToEquity',     bKey: 'debtToEquity',   fmt: fmtRatio,                            hiGood: false, note: 'Total debt ÷ shareholders equity' },
      { label: 'Interest Coverage',   key: 'interestCoverage', bKey: null,              fmt: n => fmtX(n, 1),                     hiGood: true,  note: 'EBIT ÷ interest expense · >3× healthy' },
    ]},
    { title: 'Profitability', rows: [
      { label: 'Return on Assets',   key: 'roa',             bKey: 'roa',            fmt: n => fmtPct(n, false), hiGood: true,  note: 'Net income ÷ total assets' },
      { label: 'Return on Equity',   key: 'roe',             bKey: 'roe',            fmt: n => fmtPct(n, false), hiGood: true,  note: 'Net income ÷ shareholders equity' },
      { label: 'Gross Margin',       key: 'grossMargin',     bKey: 'grossMargin',    fmt: n => fmtPct(n, false), hiGood: true,  note: 'Gross profit ÷ revenue' },
      { label: 'Operating Margin',   key: 'operatingMargin', bKey: 'operatingMargin',fmt: n => fmtPct(n, false), hiGood: true,  note: 'Operating income ÷ revenue' },
      { label: 'Net Margin',         key: 'netMargin',       bKey: 'netMargin',      fmt: n => fmtPct(n, false), hiGood: true,  note: 'Net income ÷ revenue' },
    ]},
    { title: 'Efficiency', rows: [
      { label: 'Asset Turnover',     key: 'assetTurnover',  bKey: 'assetTurnover',  fmt: fmtRatio,              hiGood: true,  note: 'Revenue ÷ total assets' },
      { label: 'Revenue Growth YoY', key: 'revenueGrowth',  bKey: null,             fmt: n => fmtPct(n),        hiGood: true,  note: 'Year-over-year revenue growth rate' },
    ]},
  ];

  const FC = {
    positive: { bg: C.successBg, color: C.success, icon: '↑' },
    negative: { bg: C.dangerBg,  color: C.danger,  icon: '↓' },
    neutral:  { bg: 'transparent', color: C.muted, icon: ''  },
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Legend */}
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: '9px 16px', fontSize: 12, color: C.muted, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span><span style={{ background: C.successBg, color: C.success, padding: '1px 7px', borderRadius: 3, fontWeight: 700, fontSize: 11 }}>↑</span> Significantly above industry avg</span>
        <span><span style={{ background: C.dangerBg,  color: C.danger,  padding: '1px 7px', borderRadius: 3, fontWeight: 700, fontSize: 11 }}>↓</span> Significantly below industry avg</span>
        <span style={{ marginLeft: 'auto' }}>Sector benchmark: <strong style={{ color: C.navy }}>{company?.sector || 'General'}</strong></span>
      </div>

      {GROUPS.map(group => (
        <div key={group.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ background: C.navyDark, padding: '9px 16px', color: 'white', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em' }}>{group.title}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Metric', 'Value', 'Industry Avg', 'Flag', 'Note'].map((h, i) => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: i === 0 || i === 4 ? 'left' : i === 3 ? 'center' : 'right', color: C.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', width: ['35%','16%','16%','10%','23%'][i] }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.rows.map((row, ri) => {
                const v = ratios[row.key];
                const b = row.bKey ? bench[row.bKey] : null;
                const f = (v != null && b != null) ? flag(v, b, row.hiGood) : 'neutral';
                const fc = FC[f];
                return (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? C.surface : C.bg, borderBottom: `1px solid ${C.borderLight}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: C.text }}>{row.label}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: C.navyDark }}>{v != null ? row.fmt(v) : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: C.muted }}>{b != null ? row.fmt(b) : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {f !== 'neutral' && (
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: fc.bg, color: fc.color, fontWeight: 800, fontSize: 13 }}>{fc.icon}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: C.muted, fontStyle: 'italic' }}>{row.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 5 — DCF Valuation
// ══════════════════════════════════════════════════════════════════════════════
function DCFTab({ data }) {
  const { dcf: d0, kpis, balanceSheet } = data;
  const latestBS = balanceSheet?.reduce((a, b) => (+(a.year ?? a.y) > +(b.year ?? b.y) ? a : b), balanceSheet?.[0] ?? {}) ?? {};

  const [a, setA] = React.useState({
    wacc:       d0?.wacc        ?? 0.09,
    tgr:        d0?.tgr         ?? d0?.terminalGrowthRate ?? 0.025,
    fcfGrowth:  d0?.fcfGrowth   ?? d0?.fcfGrowthRate      ?? 0.08,
    years:      d0?.years       ?? d0?.projectionYears     ?? 5,
    baseFCF:    d0?.baseFCF     ?? kpis?.freeCashFlow       ?? 0,
    cash:       latestBS?.cash  ?? kpis?.cash               ?? 0,
    debt:       latestBS?.totalDebt ?? kpis?.totalDebt      ?? 0,
    shares:     kpis?.sharesOutstanding ?? 1000,
    mktPrice:   0,
  });

  const set = (k, v) => setA(prev => ({ ...prev, [k]: v }));
  const res = computeDCF({ baseFCF: a.baseFCF, fcfGrowth: a.fcfGrowth, wacc: a.wacc, tgr: a.tgr, years: a.years, cash: a.cash, debt: a.debt, shares: a.shares });

  // Sensitivity: WACC rows ± 2%, FCF growth cols ± 2%
  const waccRange  = [-0.02, -0.01, 0, 0.01, 0.02].map(d => a.wacc + d);
  const growthRange = [-0.02, -0.01, 0, 0.01, 0.02].map(d => a.fcfGrowth + d);
  const sens = waccRange.map(w => growthRange.map(g => computeDCF({ ...a, wacc: w, fcfGrowth: g })?.iv));

  const upside = res?.iv && a.mktPrice > 0 ? (res.iv - a.mktPrice) / a.mktPrice : null;

  const Slider = ({ label, value, onChange, min, max, step, display, desc }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{label}</label>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.navy, fontFamily: 'monospace' }}>{display(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: C.navy }}/>
      {desc && <div style={{ fontSize: 11, color: C.mutedLight, marginTop: 1 }}>{desc}</div>}
    </div>
  );

  const NumberInput = ({ label, k }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <label style={{ fontSize: 12, color: C.muted }}>{label}</label>
      <input type="number" value={a[k]} onChange={e => set(k, parseFloat(e.target.value) || 0)}
        style={{ width: 120, border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 8px', fontFamily: 'monospace', fontSize: 13, textAlign: 'right', outline: 'none' }}/>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
      {/* ── Left: Assumptions ── */}
      <div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
          <div style={{ fontFamily: 'Lora', fontWeight: 700, fontSize: 15, color: C.navy, marginBottom: 16 }}>DCF Assumptions</div>
          <Slider label="WACC"               value={a.wacc}      onChange={v => set('wacc', v)}     min={0.04}  max={0.20}  step={0.005} display={v => fmtPct(v, false)} desc="Weighted average cost of capital"/>
          <Slider label="Terminal Growth"    value={a.tgr}       onChange={v => set('tgr', v)}      min={0.005} max={0.045} step={0.005} display={v => fmtPct(v, false)} desc="Long-run perpetual growth rate"/>
          <Slider label="FCF Growth Rate"    value={a.fcfGrowth} onChange={v => set('fcfGrowth', v)} min={-0.05} max={0.35} step={0.005} display={v => fmtPct(v, false)} desc="Projected annual free cash flow growth"/>
          <Slider label="Projection Period"  value={a.years}     onChange={v => set('years', v)}    min={3}     max={10}    step={1}     display={v => `${v} yrs`}       desc="Explicit forecast horizon"/>

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Model Inputs ($M)</div>
            <NumberInput label="Base FCF ($M)"   k="baseFCF"/>
            <NumberInput label="Cash ($M)"       k="cash"/>
            <NumberInput label="Total Debt ($M)" k="debt"/>
            <NumberInput label="Shares (M)"      k="shares"/>
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.textMid }}>Market Price ($/share)</label>
                <input type="number" value={a.mktPrice || ''} placeholder="e.g. 182.50"
                  onChange={e => set('mktPrice', parseFloat(e.target.value) || 0)}
                  style={{ width: 120, border: `1.5px solid ${C.gold}`, borderRadius: 5, padding: '4px 8px', fontFamily: 'monospace', fontSize: 13, textAlign: 'right', outline: 'none' }}/>
              </div>
              <div style={{ fontSize: 11, color: C.mutedLight, marginTop: 4, textAlign: 'right', fontStyle: 'italic' }}>Check current price at Yahoo Finance</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Results ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Intrinsic value hero card */}
        {res && (
          <div style={{ background: C.navyDark, color: 'white', borderRadius: 8, padding: 22 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'PV of FCFs',            val: fmtM(res.pvFCFs) },
                { label: 'PV of Terminal Value',  val: fmtM(res.pvTV) },
                { label: 'Enterprise Value',       val: fmtM(res.ev) },
                { label: 'Equity Value',           val: fmtM(res.equity) },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: 'Lora', fontSize: 19, fontWeight: 700 }}>{val}</div>
                </div>
              ))}
            </div>
            {res.iv != null && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 18, display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginBottom: 4 }}>INTRINSIC VALUE / SHARE</div>
                  <div style={{ fontFamily: 'Lora', fontSize: 40, fontWeight: 800, color: C.gold }}>${res.iv.toFixed(2)}</div>
                </div>
                {a.mktPrice > 0 && <>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginBottom: 4 }}>MARKET PRICE</div>
                    <div style={{ fontFamily: 'Lora', fontSize: 40, fontWeight: 800 }}>${a.mktPrice.toFixed(2)}</div>
                  </div>
                  {upside != null && (
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginBottom: 4 }}>UPSIDE / DOWNSIDE</div>
                      <div style={{ fontFamily: 'Lora', fontSize: 40, fontWeight: 800, color: upside > 0 ? '#4ade80' : '#f87171' }}>
                        {upside > 0 ? '+' : ''}{(upside * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </>}
              </div>
            )}
          </div>
        )}

        {/* Sensitivity table */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
          <div style={{ fontFamily: 'Lora', fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 3 }}>Sensitivity Analysis</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Intrinsic value ($/share) · rows = WACC · cols = FCF Growth</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '7px 12px', background: C.navyDark, color: 'rgba(255,255,255,.5)', fontSize: 10, textAlign: 'center' }}>WACC ↓ \ Growth →</th>
                  {growthRange.map((g, ci) => (
                    <th key={ci} style={{ padding: '7px 12px', background: C.navyDark, color: ci === 2 ? C.gold : 'rgba(255,255,255,.7)', textAlign: 'center', fontWeight: ci === 2 ? 800 : 400 }}>
                      {ci === 2 ? '★ ' : ''}{fmtPct(g, false)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {waccRange.map((w, ri) => (
                  <tr key={ri}>
                    <td style={{ padding: '7px 12px', background: C.navyDark, color: ri === 2 ? C.gold : 'rgba(255,255,255,.7)', textAlign: 'center', fontWeight: ri === 2 ? 800 : 400 }}>
                      {ri === 2 ? '★ ' : ''}{fmtPct(w, false)}
                    </td>
                    {sens[ri].map((v, ci) => {
                      const mp    = a.mktPrice;
                      const isBase = ri === 2 && ci === 2;
                      const above  = mp > 0 && v != null && v > mp;
                      const below  = mp > 0 && v != null && v < mp;
                      return (
                        <td key={ci} style={{
                          padding: '7px 12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: isBase ? 800 : 400,
                          background: isBase ? C.goldLight : above ? '#dcfce7' : below ? '#fee2e2' : (ri + ci) % 2 === 0 ? C.surface : C.bg,
                          color: isBase ? C.navyDark : above ? C.success : below ? C.danger : C.textMid,
                          outline: isBase ? `2px solid ${C.gold}` : 'none', outlineOffset: '-2px',
                        }}>
                          {v != null ? `$${v.toFixed(0)}` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Projected FCF breakdown */}
        {res?.projections && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
            <div style={{ fontFamily: 'Lora', fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 14 }}>Projected Free Cash Flows</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {res.projections.map((p, i) => (
                <div key={i} style={{ flex: '1 1 70px', textAlign: 'center', background: C.bg, borderRadius: 7, padding: '10px 8px' }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Year {p.year}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.navy }}>{fmtM(p.fcf)}</div>
                  <div style={{ fontSize: 11, color: C.mutedLight }}>PV: {fmtM(p.pv)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Compare Tab
// ══════════════════════════════════════════════════════════════════════════════
function CompareTab({ dataA, dataB }) {
  if (!dataA || !dataB) return <div style={{ color: C.muted, padding: 20 }}>Upload two 10-K PDFs to enable comparison.</div>;

  const METRICS = [
    { section: 'Revenue & Earnings', rows: [
      { label: 'Revenue',           fn: d => fmtM(d.kpis?.revenue) },
      { label: 'Revenue Growth',    fn: d => fmtPct(d.kpis?.revenueGrowth) },
      { label: 'Gross Profit',      fn: d => fmtM(d.incomeStatement?.[0]?.grossProfit) },
      { label: 'Net Income',        fn: d => fmtM(d.kpis?.netIncome) },
      { label: 'EPS',               fn: d => d.kpis?.eps != null ? `$${d.kpis.eps.toFixed(2)}` : '—' },
      { label: 'EBITDA',            fn: d => fmtM(d.incomeStatement?.[0]?.ebitda) },
    ]},
    { section: 'Cash & Balance Sheet', rows: [
      { label: 'Free Cash Flow',    fn: d => fmtM(d.kpis?.freeCashFlow) },
      { label: 'Cash',              fn: d => fmtM(d.kpis?.cash) },
      { label: 'Total Debt',        fn: d => fmtM(d.kpis?.totalDebt) },
    ]},
    { section: 'Margins', rows: [
      { label: 'Gross Margin',      fn: d => fmtPct(d.ratios?.grossMargin, false) },
      { label: 'Operating Margin',  fn: d => fmtPct(d.ratios?.operatingMargin, false) },
      { label: 'Net Margin',        fn: d => fmtPct(d.ratios?.netMargin, false) },
    ]},
    { section: 'Ratios', rows: [
      { label: 'Current Ratio',     fn: d => fmtRatio(d.ratios?.currentRatio) },
      { label: 'Debt / Equity',     fn: d => fmtRatio(d.ratios?.debtToEquity) },
      { label: 'Return on Equity',  fn: d => fmtPct(d.ratios?.roe, false) },
      { label: 'Return on Assets',  fn: d => fmtPct(d.ratios?.roa, false) },
    ]},
  ];

  return (
    <div className="fade-in">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.navyDark }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,.5)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', width: '36%' }}>Metric</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', color: C.gold, fontWeight: 800, fontSize: 14 }}>{dataA.company?.name || 'Company A'}</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', color: '#93c5fd', fontWeight: 800, fontSize: 14 }}>{dataB.company?.name || 'Company B'}</th>
          </tr>
        </thead>
        <tbody>
          {METRICS.map(({ section, rows }) => (
            <React.Fragment key={section}>
              <tr style={{ background: C.bg }}>
                <td colSpan={3} style={{ padding: '9px 16px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: C.navy }}>{section}</td>
              </tr>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? C.surface : C.bg, borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500, paddingLeft: 28 }}>{row.label}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: C.navyDark }}>{row.fn(dataA)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: C.navy }}>{row.fn(dataB)}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Result Tabs container
// ══════════════════════════════════════════════════════════════════════════════
function ResultTabs({ dataA, dataB, compareMode, onExportPDF }) {
  const [tab, setTab]         = React.useState('summary');
  const [csvToast, setCsvToast] = React.useState(false);

  const TABS = [
    { id: 'summary',    label: 'Summary' },
    { id: 'statements', label: 'Financial Statements' },
    { id: 'trends',     label: 'Trend Analysis' },
    { id: 'ratios',     label: 'Accounting Ratios' },
    { id: 'dcf',        label: 'DCF Valuation' },
    ...(compareMode && dataB ? [{ id: 'compare', label: '⚡ Compare' }] : []),
  ];

  const onCSV = () => { setCsvToast(true); setTimeout(() => setCsvToast(false), 2500); };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ background: C.navyDark, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 14 }}>
        <div style={{ display: 'flex', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '13px 17px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? C.gold : 'rgba(255,255,255,.5)',
              borderBottom: tab === t.id ? `2.5px solid ${C.gold}` : '2.5px solid transparent',
              whiteSpace: 'nowrap', transition: 'all .15s',
            }}>{t.label}</button>
          ))}
        </div>
        <button onClick={onExportPDF} style={{ ...btn('ghost'), fontSize: 12, padding: '5px 12px', flexShrink: 0 }}>⬇ Export PDF</button>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }} id="analysis-content">
        {tab === 'summary'    && <SummaryTab    data={dataA}/>}
        {tab === 'statements' && <StatementsTab data={dataA} onCSVCopied={onCSV}/>}
        {tab === 'trends'     && <TrendsTab     data={dataA}/>}
        {tab === 'ratios'     && <RatiosTab     data={dataA}/>}
        {tab === 'dcf'        && <DCFTab        data={dataA}/>}
        {tab === 'compare'    && <CompareTab    dataA={dataA} dataB={dataB}/>}
      </div>

      {/* CSV toast */}
      {csvToast && (
        <div className="fade-in no-print" style={{ position: 'fixed', bottom: 28, right: 28, background: C.success, color: 'white', padding: '11px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}>
          ✓ CSV copied to clipboard
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ResultTabs, computeDCF, getBenchmark, BENCHMARKS, BarChart, YoYBadge, FootnotesSection, SummaryTab, StatementsTab, TrendsTab, RatiosTab, DCFTab, CompareTab });
