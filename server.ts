import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getStockData, POPULAR_STOCKS } from './src/data/stockDatabase';
import {
  fetchIndianStockQuote,
  searchIndianStocks,
  fetchIndianStockHistory,
  getIndianStockQuoteWithRisk,
  POPULAR_INDIAN_SYMBOLS,
} from './src/services/indianStockService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// ============================================================================
// INDIAN STOCK MARKET API (0xramm/Indian-Stock-Market-API specification)
// ============================================================================

// GET /api/indian/stock - Live price, change, volume, metrics (res=num or res=val)
app.get('/api/indian/stock', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'RELIANCE';
    const resType = (req.query.res as 'num' | 'val') || 'num';
    const quote = await fetchIndianStockQuote(symbol, resType);
    res.json(quote);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch Indian stock quote' });
  }
});

// GET /api/indian/search - Search Indian stocks by company name or symbol (NSE & BSE)
app.get('/api/indian/search', async (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    const results = await searchIndianStocks(query);
    res.json({ query, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to search Indian stocks' });
  }
});

// GET /api/indian/history - Historical OHLCV bars for TradingView Lightweight Charts
app.get('/api/indian/history', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'RELIANCE';
    const range = (req.query.range as string) || '1y';
    const interval = (req.query.interval as string) || '1d';
    const history = await fetchIndianStockHistory(symbol, range, interval);
    res.json({ symbol, count: history.length, history });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch historical series' });
  }
});

// GET /api/indian/symbols - List of popular pre-cached Indian NSE/BSE symbols
app.get('/api/indian/symbols', (req, res) => {
  res.json({ symbols: POPULAR_INDIAN_SYMBOLS });
});

// ============================================================================
// CORE APPLICATION API ROUTES
// ============================================================================

// GET /api/stocks - Get list of stocks with 5-factor risk model
app.get('/api/stocks', (req, res) => {
  res.json({
    stocks: POPULAR_STOCKS.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      market: s.market,
      price: s.price,
      changePercent: s.changePercent,
      annualizedVolatility: s.stats.annualizedVolatility,
      riskScore: s.fiveFactorModel.totalScore,
      riskBand: s.fiveFactorModel.riskBand,
    })),
  });
});

// GET /api/stock/:symbol - Get detailed quote & 5-factor model (supports live Indian API)
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const isIndian =
      symbol.endsWith('.NS') ||
      symbol.endsWith('.BO') ||
      symbol === 'NIFTY50' ||
      symbol === '^NSEI' ||
      POPULAR_INDIAN_SYMBOLS.some((s) => s.symbol.replace(/\.NS|\.BO/, '') === symbol);

    if (isIndian) {
      const stock = await getIndianStockQuoteWithRisk(symbol);
      return res.json(stock);
    }

    // US or default fallback
    const stock = getStockData(symbol);
    res.json(stock);
  } catch (error: any) {
    console.warn(`[API] Fallback for ${req.params.symbol}:`, error.message);
    const stock = getStockData(req.params.symbol);
    res.json(stock);
  }
});

// Vite Integration in Development / Static Files in Production
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`ANNRIYA RISK FINDER server with Indian Stock Market API running at http://localhost:${PORT}`);
  });
}

setupVite();
