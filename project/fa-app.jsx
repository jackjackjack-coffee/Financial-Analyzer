// fa-app.jsx — Main App: state, PDF extraction, Claude API, render

const PROGRESS_STEPS = [
  { label: 'Extracting text from PDF',          detail: 'Reading financial data from document pages…' },
  { label: 'Analyzing company & income statement', detail: 'Extracting revenue, earnings, KPIs, and highlights…' },
  { label: 'Analyzing balance sheet & ratios',  detail: 'Processing assets, liabilities, and financial ratios…' },
  { label: 'Running DCF valuation',             detail: 'Projecting free cash flows, computing intrinsic value…' },
];

// ── JSON parsing (resilient) ─────────────────────────────────────────────────
function parseJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (m) try { return JSON.parse(m[1]); } catch {}
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s !== -1 && e > s) try { return JSON.parse(text.slice(s, e + 1)); } catch {}
  return null;
}

// ── PDF text extraction ──────────────────────────────────────────────────────
// Returns { front, financials, notes } — targeted short slices for each Claude call
async function extractPDFText(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const total = Math.min(pdf.numPages, 150);
  let full = '';
  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const ct   = await page.getTextContent();
    full += ct.items.map(it => it.str).join(' ') + '\n';
  }

  // Find income statement / financial statements section
  const fsPatterns = [
    /CONSOLIDATED\s+STATEMENTS?\s+OF\s+(OPERATIONS|INCOME|EARNINGS|COMPREHENSIVE)/i,
    /STATEMENTS?\s+OF\s+(CONSOLIDATED\s+)?(OPERATIONS|INCOME|EARNINGS)/i,
    /CONSOLIDATED\s+BALANCE\s+SHEETS?/i,
    /FINANCIAL\s+STATEMENTS?\s+AND\s+SUPPLEMENTARY/i,
  ];
  let fsIdx = -1;
  for (const pat of fsPatterns) {
    const m = full.search(pat);
    if (m > -1) { fsIdx = m; break; }
  }

  // Find cash flow section
  const cfIdx = full.search(/STATEMENTS?\s+OF\s+(CONSOLIDATED\s+)?CASH\s+FLOWS?/i);

  // Slice strategy: send focused 5000-char windows to each Claude call
  const front      = full.slice(0, 5000);                                          // business description, highlights
  const financials = fsIdx > -1 ? full.slice(Math.max(0, fsIdx - 500), fsIdx + 6000) : full.slice(Math.floor(full.length * 0.3), Math.floor(full.length * 0.3) + 6000);
  const cashflows  = cfIdx > -1 ? full.slice(Math.max(0, cfIdx - 200), cfIdx + 4000) : financials.slice(3000);
  const mda        = (() => {
    const mdaIdx = full.search(/MANAGEMENT.S\s+DISCUSSION\s+AND\s+ANALYSIS/i);
    return mdaIdx > -1 ? full.slice(mdaIdx, mdaIdx + 4000) : full.slice(0, 4000);
  })();

  return { front, financials, cashflows, mda };
}

// ── Claude API call with retry ───────────────────────────────────────────────
async function claudeCall(prompt) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await window.claude.complete({
        messages: [{ role: 'user', content: prompt }],
      });
      const parsed = parseJSON(text);
      if (parsed) return parsed;
    } catch (err) {
      if (attempt === 1) throw err;
    }
  }
  throw new Error('Could not parse a valid JSON response from Claude after retry.');
}

// ── Three-pass analysis (short, targeted prompts) ────────────────────────────
async function analyzeDocument(slices, onStep) {
  const { front, financials, cashflows, mda } = slices;

  // ── Pass 1: Company overview + income statement ──
  onStep(1);
  const res1 = await claudeCall(
`Extract financial data from this 10-K filing text. Return ONLY a JSON object, no markdown, no explanation.
Use null for any value you cannot find. All dollar amounts in millions USD. Decimals for ratios/percentages (0.15 not 15%).

JSON structure to fill:
{"company":{"name":"","ticker":"","sector":"","fiscalYear":"","description":""},"kpis":{"revenue":null,"revenueGrowth":null,"netIncome":null,"netMargin":null,"eps":null,"freeCashFlow":null,"totalDebt":null,"cash":null,"sharesOutstanding":null},"incomeStatement":[{"year":"","revenue":null,"grossProfit":null,"operatingIncome":null,"netIncome":null,"ebitda":null},{"year":"","revenue":null,"grossProfit":null,"operatingIncome":null,"netIncome":null,"ebitda":null},{"year":"","revenue":null,"grossProfit":null,"operatingIncome":null,"netIncome":null,"ebitda":null}],"summary":{"headline":"","keyPoints":["",""],"risks":["",""],"opportunities":["",""]}}

FILING TEXT:
${front}

FINANCIAL STATEMENTS:
${financials.slice(0, 3000)}`
  );

  // ── Pass 2: Balance sheet + cash flow + ratios ──
  onStep(2);
  const res2 = await claudeCall(
`Extract balance sheet, cash flow, and ratio data from this 10-K text. Return ONLY a JSON object, no markdown.
All dollar amounts in millions USD. Ratios/margins as decimals (0.25 = 25%).

JSON structure to fill:
{"balanceSheet":[{"year":"","totalAssets":null,"currentAssets":null,"totalLiabilities":null,"currentLiabilities":null,"equity":null,"cash":null,"totalDebt":null},{"year":"","totalAssets":null,"currentAssets":null,"totalLiabilities":null,"currentLiabilities":null,"equity":null,"cash":null,"totalDebt":null},{"year":"","totalAssets":null,"currentAssets":null,"totalLiabilities":null,"currentLiabilities":null,"equity":null,"cash":null,"totalDebt":null}],"cashFlow":[{"year":"","operatingCF":null,"investingCF":null,"financingCF":null,"freeCashFlow":null,"capex":null},{"year":"","operatingCF":null,"investingCF":null,"financingCF":null,"freeCashFlow":null,"capex":null},{"year":"","operatingCF":null,"investingCF":null,"financingCF":null,"freeCashFlow":null,"capex":null}],"ratios":{"currentRatio":null,"quickRatio":null,"debtToEquity":null,"interestCoverage":null,"roa":null,"roe":null,"grossMargin":null,"operatingMargin":null,"netMargin":null,"assetTurnover":null,"revenueGrowth":null}}

BALANCE SHEET + FINANCIALS:
${financials.slice(2000, 5000)}

CASH FLOW:
${cashflows.slice(0, 2500)}`
  );

  // ── Pass 3: DCF + flags + footnotes ──
  onStep(3);
  const res3 = await claudeCall(
`Based on this 10-K filing, provide DCF assumptions, qualitative flags, and source footnotes. Return ONLY a JSON object, no markdown.
wacc: 0.07–0.14 based on sector/risk. tgr: 0.02–0.03. fcfGrowth: expected 5-yr CAGR. baseFCF: latest FCF in $M.

JSON structure:
{"dcf":{"wacc":null,"tgr":null,"fcfGrowth":null,"years":5,"baseFCF":null},"flags":{"strengths":["","",""],"weaknesses":["","",""]},"footnotes":{"revenue":"","netIncome":"","totalDebt":"","freeCashFlow":""}}

FILING TEXT:
${mda.slice(0, 3000)}

FINANCIALS:
${financials.slice(0, 2000)}`
  );

  return {
    ...(res1 || {}),
    ...(res2 || {}),
    dcf:       res3?.dcf,
    flags:     res3?.flags || res1?.flags,
    footnotes: res3?.footnotes,
  };
}

// ── localStorage helpers ─────────────────────────────────────────────────────
const STORE_KEY = 'fin-analyzer-v4-saved';
const loadSaved    = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; } };
const persistSaved = (arr) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch {} };

// ══════════════════════════════════════════════════════════════════════════════
// App
// ══════════════════════════════════════════════════════════════════════════════
function App() {
  const [ticker,      setTicker]      = React.useState('');
  const [files,       setFiles]       = React.useState([null, null]);
  const [phase,       setPhase]       = React.useState('idle');   // idle | analyzing | done | error
  const [progress,    setProgress]    = React.useState(0);
  const [dataA,       setDataA]       = React.useState(null);
  const [dataB,       setDataB]       = React.useState(null);
  const [error,       setError]       = React.useState(null);
  const [compareMode, setCompareMode] = React.useState(false);
  const [showSaved,   setShowSaved]   = React.useState(false);
  const [saved,       setSaved]       = React.useState(loadSaved);

  const handleFile = (file, idx) => setFiles(prev => { const n = [...prev]; n[idx] = file; return n; });

  const handleAnalyze = async () => {
    if (!files[0]) return;
    setPhase('analyzing');
    setProgress(0);
    setError(null);
    setDataA(null);
    setDataB(null);

    try {
      // Extract + analyze primary PDF
      const slicesA = await extractPDFText(files[0]);
      const resA    = await analyzeDocument(slicesA, setProgress);
      setDataA(resA);

      // Optionally extract + analyze secondary PDF
      if (compareMode && files[1]) {
        const slicesB = await extractPDFText(files[1]);
        const resB    = await analyzeDocument(slicesB, () => {});
        setDataB(resB);
      }

      setPhase('done');

      // Auto-save (keep last 10)
      if (resA.company?.name) {
        const updated = [
          { ...resA, savedAt: Date.now() },
          ...saved.filter(s => s.company?.name !== resA.company.name),
        ].slice(0, 10);
        setSaved(updated);
        persistSaved(updated);
      }
    } catch (err) {
      console.error('[10-K Analyzer]', err);
      setError(err.message || 'Analysis failed. Please check the PDF and try again.');
      setPhase('error');
    }
  };

  const handleNew = () => {
    setPhase('idle'); setFiles([null, null]);
    setDataA(null); setDataB(null);
    setError(null); setProgress(0);
  };

  const handleLoadSaved = (item) => { setDataA(item); setDataB(null); setPhase('done'); };
  const handleDeleteSaved = (i) => {
    const updated = saved.filter((_, idx) => idx !== i);
    setSaved(updated); persistSaved(updated);
  };
  const handleExportPDF = () => window.print();

  const canRun = !!files[0] && phase !== 'analyzing';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      <Header onNew={handleNew} onSaved={() => setShowSaved(s => !s)} savedCount={saved.length}/>

      {showSaved && (
        <SavedPanel saved={saved} onLoad={handleLoadSaved} onDelete={handleDeleteSaved} onClose={() => setShowSaved(false)}/>
      )}

      <main style={{ flex: 1, maxWidth: 1180, width: '100%', margin: '0 auto', padding: '28px 24px' }} id="printable">

        {/* ── Input screens ── */}
        {(phase === 'idle' || phase === 'error') && (
          <div className="fade-in">
            <TickerSection ticker={ticker} setTicker={setTicker}/>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 22, marginBottom: 18 }}>
              {/* Compare toggle */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textMid, cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={compareMode} onChange={e => setCompareMode(e.target.checked)} style={{ accentColor: C.navy, width: 15, height: 15 }}/>
                  Compare two companies side by side
                </label>
              </div>
              <UploadZone onFile={handleFile} compareMode={compareMode} files={files}/>
            </div>

            {/* Error banner */}
            {phase === 'error' && error && (
              <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}44`, borderRadius: 8, padding: '11px 16px', marginBottom: 16, color: C.danger, fontSize: 14 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Analyze button */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={handleAnalyze} disabled={!canRun}
                style={{
                  ...btn('primary'),
                  fontSize: 16, padding: '13px 44px', borderRadius: 8,
                  opacity: canRun ? 1 : 0.45, cursor: canRun ? 'pointer' : 'not-allowed',
                  boxShadow: canRun ? `0 4px 20px ${C.gold}44` : 'none',
                }}>
                {files[0]
                  ? `Analyze ${files[0].name.length > 35 ? files[0].name.slice(0, 35) + '…' : files[0].name}`
                  : 'Analyze 10-K PDF'}
              </button>
            </div>

            {/* Empty state hint */}
            {!files[0] && (
              <div style={{ marginTop: 48, textAlign: 'center', color: C.muted }}>
                <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.3 }}>📊</div>
                <div style={{ fontFamily: 'Lora', fontSize: 18, color: C.navy, marginBottom: 8 }}>AI-powered 10-K financial analysis</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
                  Upload any SEC 10-K annual report PDF to instantly generate financial statements, ratios with industry benchmarks, trend charts, and a full DCF valuation.
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 22, fontSize: 13, color: C.mutedLight }}>
                  {['📄 3-year financial statements', '📈 Trend & margin analysis', '⚖️ Ratio benchmarks', '💰 DCF with sensitivity table'].map(f => (
                    <span key={f}>{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Progress screen ── */}
        {phase === 'analyzing' && (
          <div className="fade-in" style={{ maxWidth: 520, margin: '60px auto' }}>
            <ProgressSteps steps={PROGRESS_STEPS} current={progress} error={error}/>
          </div>
        )}

        {/* ── Results screen ── */}
        {phase === 'done' && dataA && (
          <div className="fade-in">
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: C.muted }}>
                Analysis complete
                {dataA.company?.name && <> · <strong style={{ color: C.navy }}>{dataA.company.name}</strong></>}
                {dataA.company?.ticker && <> ({dataA.company.ticker})</>}
              </div>
              <button onClick={handleNew} style={{ ...btn('secondary'), fontSize: 13, padding: '6px 14px' }}>← New Analysis</button>
            </div>
            <ResultTabs dataA={dataA} dataB={dataB} compareMode={compareMode} onExportPDF={handleExportPDF}/>
          </div>
        )}
      </main>

      <footer className="no-print" style={{ background: C.navyDark, color: 'rgba(255,255,255,.3)', textAlign: 'center', padding: '13px 24px', fontSize: 12 }}>
        10-K Financial Analyzer · Powered by Claude AI · For informational purposes only — not financial advice
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
