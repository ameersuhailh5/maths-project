import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getStockData, POPULAR_STOCKS } from './src/data/stockDatabase';
import { calculatePortfolioRisk } from './src/services/financialMath';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// GET /api/stocks - Get list of stocks with calculated metrics
app.get('/api/stocks', (req, res) => {
  res.json({
    stocks: POPULAR_STOCKS.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      price: s.price,
      changePercent: s.changePercent,
      overallRiskLevel: s.metrics.overallRiskLevel,
      volatility30d: s.metrics.volatility30d,
      volatility1y: s.metrics.volatility1y,
      maxDrawdown: s.metrics.maxDrawdown,
    })),
  });
});

// GET /api/stock/:symbol - Get detailed quote & history
app.get('/api/stock/:symbol', (req, res) => {
  try {
    const symbol = req.params.symbol;
    const stock = getStockData(symbol);
    res.json(stock);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch stock data' });
  }
});

// POST /api/portfolio/analyze - Portfolio risk evaluation
app.post('/api/portfolio/analyze', (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array required' });
    }

    const availableStocks = items.map((it: { symbol: string }) => getStockData(it.symbol));
    const result = calculatePortfolioRisk(items, availableStocks);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to analyze portfolio' });
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
    console.log(`YieldRisk Real-Time Monitor running at http://localhost:${PORT}`);
  });
}

setupVite();
