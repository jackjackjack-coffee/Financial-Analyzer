# 10-K Financial Analyzer — Project Context

## What this is
A standalone web app that lets users upload a 10-K SEC filing PDF and get an AI-powered financial analysis. Built as a single HTML file + React (no build step).

## Tech stack
- Vanilla HTML + React 18 (loaded via CDN, JSX compiled by Babel in-browser)
- PDF.js for text extraction
- Claude API (claude-haiku-4-5-20251001) for analysis
- Vercel for hosting (static site + serverless function)

## File structure
```
index.html                  # Entry point (root, for Vercel)
api/
  analyze.js                # Vercel serverless proxy to Anthropic API
project/
  Financial Analyzer.html   # Original design file (same as index.html)
  fa-app.jsx                # Main app: state, PDF extraction, Claude calls
  fa-components.jsx         # Shared UI components (Header, Upload, etc.)
  fa-results.jsx            # Result tabs (Summary, Statements, Trends, Ratios, DCF)
```

## How it works
1. User enters a ticker → generates EDGAR URL to find the 10-K PDF
2. User uploads the PDF → PDF.js extracts text
3. Text is sliced into targeted windows (front, financials, cashflows, mda)
4. Three Claude API calls analyze different sections (income, balance/ratios, DCF)
5. Results shown in 5 tabs: Summary, Financial Statements, Trend Analysis, Accounting Ratios, DCF Valuation

## Key architecture decisions
- **Serverless proxy** (`api/analyze.js`): frontend calls `/api/analyze`, which calls Anthropic server-side. Users never need their own API key. Anthropic API key stored as `ANTHROPIC_API_KEY` env var in Vercel.
- **Three-pass analysis**: short targeted prompts (~5000 chars each) instead of one large blob, to stay within model context limits and get accurate numbers
- **null defaults**: Claude returns null (not 0) for missing values, displayed as `—`

## GitHub
- Repo: https://github.com/jackjackjack-coffee/Financial-Analyzer
- Branch: main
- To push: `git push https://<TOKEN>@github.com/jackjackjack-coffee/Financial-Analyzer.git main`

## Vercel setup
- Root directory: `/` (index.html at repo root)
- Environment variable required: `ANTHROPIC_API_KEY`
- Serverless function: `api/analyze.js`

## Known issues / future work
- No rate limiting — all users share the owner's Anthropic API key
- Could add password protection or per-IP rate limiting if usage grows
- Works best with text-based PDFs (not scanned/image PDFs)
