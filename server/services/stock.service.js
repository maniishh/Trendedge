const axios = require('axios');

const BASE_URL  = 'https://www.alphavantage.co/query';
const CACHE     = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 min — generous to stay within free-tier daily limit

function getCache(key) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL) { CACHE.delete(key); return null; }
  return hit.data;
}
function setCache(key, data) { CACHE.set(key, { data, at: Date.now() }); }

// Small delay helper — keeps requests within Alpha Vantage 5 req/min limit
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── Demo data ────────────────────────────────────────────────────────────────
const DEMO_BASE = {
  AAPL:  { base: 189.30, dma20: 185.10 },
  MSFT:  { base: 415.20, dma20: 408.50 },
  GOOGL: { base: 175.80, dma20: 172.30 },
  TSLA:  { base: 248.60, dma20: 261.40 },
  AMZN:  { base: 195.10, dma20: 190.80 },
  NVDA:  { base: 875.40, dma20: 832.20 },
  META:  { base: 505.30, dma20: 495.60 },
  NFLX:  { base: 625.80, dma20: 618.40 },
  JPM:   { base: 198.20, dma20: 194.50 },
  AMD:   { base: 165.70, dma20: 170.20 },
};

function buildDemoStock(symbol) {
  const seed      = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng       = (s) => ((Math.sin(s) * 43758.5453) % 1 + 1) / 2;
  const info      = DEMO_BASE[symbol] || { base: 100 + rng(seed) * 400, dma20: 100 + rng(seed + 1) * 400 };
  const jitter    = (rng(seed + Date.now() / 86400000 | 0) - 0.5) * 0.04;
  const current   = parseFloat((info.base * (1 + jitter)).toFixed(2));
  const prev      = parseFloat((current * (1 + (rng(seed + 7) - 0.5) * 0.03)).toFixed(2));
  const dma20     = parseFloat(info.dma20.toFixed(2));
  const change    = parseFloat((current - prev).toFixed(2));
  const changePct = parseFloat(((change / prev) * 100).toFixed(2));
  const dmaPct    = parseFloat(((current - dma20) / dma20 * 100).toFixed(2));
  let signal = 'Neutral';
  if (dmaPct <= -2) signal = 'Buy';
  if (dmaPct >= 5)  signal = 'Sell';
  const history = Array.from({ length: 30 }, (_, i) => {
    const d   = new Date(Date.now() - (29 - i) * 86400000);
    const base = info.base * (1 + (rng(seed + i * 3) - 0.5) * 0.06);
    return {
      date:   d.toISOString().slice(0, 10),
      open:   parseFloat((base * (1 + (rng(seed + i) - 0.5) * 0.01)).toFixed(2)),
      high:   parseFloat((base * 1.015).toFixed(2)),
      low:    parseFloat((base * 0.985).toFixed(2)),
      close:  parseFloat(base.toFixed(2)),
      volume: Math.floor(rng(seed + i * 7) * 80000000 + 10000000),
    };
  });
  return { symbol, current, prev, change, changePct, dma20, dmaPct, signal, history, isDemo: true };
}

function isApiKeyMissing() {
  const key = process.env.ALPHA_API_KEY;
  return !key || key === 'your_alpha_vantage_key' || key === 'demo' || key.trim() === '';
}

/**
 * Alpha Vantage rate-limit detection.
 * When rate-limited the response contains "Information" or "Note" instead of data.
 */
function isRateLimited(data) {
  return !!(data['Information'] || data['Note']);
}

function calc20DMA(priceValues) {
  const closes = priceValues.slice(0, 20).map(p => parseFloat(p['4. close']));
  return closes.reduce((a, b) => a + b, 0) / closes.length;
}

// ── Core fetch ───────────────────────────────────────────────────────────────
async function fetchSingleStock(symbol) {
  if (isApiKeyMissing()) return buildDemoStock(symbol);

  const cacheKey = `stock_${symbol}`;
  const cached   = getCache(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${process.env.ALPHA_API_KEY}`;
    const { data } = await axios.get(url, { timeout: 12000 });

    // Detect rate-limit response — do NOT cache, let next request retry
    if (isRateLimited(data)) {
      const reason = data['Information'] || data['Note'];
      console.warn(`[stock] Rate-limited for ${symbol}: ${reason?.slice(0, 100)}`);
      return buildDemoStock(symbol);
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      console.warn(`[stock] Unexpected response for ${symbol}:`, JSON.stringify(data).slice(0, 150));
      return buildDemoStock(symbol);
    }

    const entries   = Object.entries(timeSeries);
    const priceObjs = entries.map(([, v]) => v);

    const dma20      = calc20DMA(priceObjs);
    const todayClose = parseFloat(priceObjs[0]['4. close']);
    const prevClose  = parseFloat(priceObjs[1]['4. close']);
    const change     = todayClose - prevClose;
    const changePct  = ((change / prevClose) * 100).toFixed(2);
    const dmaPct     = ((todayClose - dma20) / dma20 * 100).toFixed(2);

    let signal = 'Neutral';
    if (parseFloat(dmaPct) <= -2) signal = 'Buy';
    if (parseFloat(dmaPct) >= 5)  signal = 'Sell';

    const history = entries.slice(0, 30).map(([date, v]) => ({
      date,
      open:   parseFloat(v['1. open']),
      high:   parseFloat(v['2. high']),
      low:    parseFloat(v['3. low']),
      close:  parseFloat(v['4. close']),
      volume: parseInt(v['5. volume'], 10),
    })).reverse();

    const result = {
      symbol,
      current:   todayClose,
      prev:      prevClose,
      change:    parseFloat(change.toFixed(2)),
      changePct: parseFloat(changePct),
      dma20:     parseFloat(dma20.toFixed(2)),
      dmaPct:    parseFloat(dmaPct),
      signal,
      history,
      isDemo:    false,
    };

    setCache(cacheKey, result);
    console.log(`[stock] Live data fetched & cached for ${symbol}`);
    return result;
  } catch (err) {
    console.error(`[stock] Network error for ${symbol}:`, err.message);
    return buildDemoStock(symbol);
  }
}

/**
 * Fetch multiple stocks SEQUENTIALLY with a 300ms gap between uncached requests.
 *
 * Root cause of the "always demo" bug: firing all requests simultaneously
 * via Promise.allSettled caused all calls to hit Alpha Vantage at once,
 * exceeding the 5 req/min free-tier limit — every response came back as a
 * rate-limit "Information" message with no time-series data, triggering the
 * demo fallback for every stock.
 *
 * Fix: fetch one at a time, 300ms apart. Cached stocks have zero delay.
 */
async function fetchMultipleStocks(symbols) {
  const results = [];
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const isCached = !!getCache(`stock_${symbol}`);

    // Only delay between live (uncached) API calls
    if (!isCached && !isApiKeyMissing() && i > 0) {
      await sleep(300);
    }

    const result = await fetchSingleStock(symbol);
    if (result) results.push(result);
  }
  return results;
}

async function searchSymbol(query) {
  if (isApiKeyMissing()) {
    const q = query.toLowerCase();
    return Object.keys(DEMO_BASE)
      .filter(s => s.toLowerCase().includes(q))
      .map(s => ({ symbol: s, name: `${s} Corp (Demo)`, type: 'Equity', region: 'United States', currency: 'USD' }));
  }

  const cacheKey = `search_${query.toLowerCase()}`;
  const cached   = getCache(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${process.env.ALPHA_API_KEY}`;
    const { data } = await axios.get(url, { timeout: 10000 });

    if (isRateLimited(data)) {
      console.warn('[stock] Search rate-limited');
      return [];
    }

    const results = (data['bestMatches'] || []).slice(0, 8).map(m => ({
      symbol:   m['1. symbol'],
      name:     m['2. name'],
      type:     m['3. type'],
      region:   m['4. region'],
      currency: m['8. currency'],
    }));
    setCache(cacheKey, results);
    return results;
  } catch (err) {
    console.error('[stock] Search error:', err.message);
    return [];
  }
}

module.exports = { fetchSingleStock, fetchMultipleStocks, searchSymbol, isApiKeyMissing };
