import { StockQuote, StockPricePoint } from '../types/stock';
import { calculateRiskMetrics } from '../services/financialMath';

/**
 * Generates historical sequences of prices and yields
 */
function generateHistory(
  basePrice: number,
  volatility: number,
  trend: number,
  interestRateSensitivity: number
): StockPricePoint[] {
  const points: StockPricePoint[] = [];
  const totalDays = 500;
  const startDate = new Date(2024, 0, 2);

  let currentPrice = basePrice;
  let currentYield = 4.10;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + Math.floor(i * 1.4));

    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const timeRatio = i / totalDays;
    currentYield = 4.10 + Math.sin(timeRatio * Math.PI * 2) * 0.45 + (Math.random() - 0.5) * 0.04;

    const yieldDeltaBps = (currentYield - 4.10) * 100;
    
    const randomReturn = (Math.random() - 0.49) * volatility;
    const rateImpact = (yieldDeltaBps / 100) * (interestRateSensitivity / 100);
    const dailyReturn = trend / 252 + randomReturn + rateImpact / 252;

    currentPrice = Math.max(2.0, currentPrice * (1 + dailyReturn));

    points.push({
      date: d.toISOString().split('T')[0],
      price: Number(currentPrice.toFixed(2)),
      interestRate: Number(currentYield.toFixed(2)),
      sp500Price: Number((4800 + i * 2.1 + Math.sin(i / 10) * 80).toFixed(2)),
    });
  }

  return points;
}

const RAW_STOCKS = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Information Technology',
    industry: 'Consumer Electronics',
    price: 232.40,
    change: 1.85,
    changePercent: 0.80,
    marketCap: '$3.55 Trillion',
    peRatio: 33.8,
    dividendYield: 0.43,
    description: 'Tech giant with strong cash balance sheets, high consumer pricing power, and moderate valuation sensitivity to high interest rates.',
    history: generateHistory(180, 0.016, 0.16, -0.15),
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Information Technology',
    industry: 'Semiconductors & AI',
    price: 128.50,
    change: -2.30,
    changePercent: -1.76,
    marketCap: '$3.15 Trillion',
    peRatio: 48.2,
    dividendYield: 0.03,
    description: 'High-growth AI semiconductor leader. High equity valuation multiples make it sensitive to yield spikes and tech liquidity crunches.',
    history: generateHistory(50, 0.028, 0.65, -0.38),
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Information Technology',
    industry: 'Systems Software & AI Cloud',
    price: 448.20,
    change: 3.10,
    changePercent: 0.70,
    marketCap: '$3.33 Trillion',
    peRatio: 35.1,
    dividendYield: 0.67,
    description: 'Enterprise AI and cloud infrastructure powerhouse with massive free cash flow, acting as a defensive mega-cap anchor in volatile yield regimes.',
    history: generateHistory(370, 0.015, 0.18, -0.12),
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    sector: 'Consumer Discretionary',
    industry: 'Automobile & Clean Energy',
    price: 245.80,
    change: -5.40,
    changePercent: -2.15,
    marketCap: '$780 Billion',
    peRatio: 68.4,
    dividendYield: 0.00,
    description: 'High-beta electric vehicle and robotics pioneer. High rate environments directly increase auto financing costs and compress growth multiples.',
    history: generateHistory(210, 0.034, 0.10, -0.48),
  },
  {
    symbol: 'O',
    name: 'Realty Income Corporation',
    sector: 'Real Estate (REIT)',
    industry: 'Triple-Net Retail REIT',
    price: 58.20,
    change: 0.45,
    changePercent: 0.78,
    marketCap: '$51 Billion',
    peRatio: 18.5,
    dividendYield: 5.60,
    description: 'Monthly dividend paying REIT. Functions as a bond proxy: highly inversely correlated with 10-Yr Treasury yields due to capital cost refinancing.',
    history: generateHistory(68, 0.012, -0.04, -0.62),
  },
  {
    symbol: 'TLT',
    name: 'iShares 20+ Year Treasury Bond ETF',
    sector: 'Fixed Income',
    industry: 'US Government Sovereign Debt',
    price: 94.30,
    change: 0.60,
    changePercent: 0.64,
    marketCap: '$58 Billion ETF',
    peRatio: 0,
    dividendYield: 4.10,
    description: 'Pure duration fixed income ETF tracking long-term US Treasuries. Extreme inverse sensitivity to interest rate movements (~16 year duration).',
    history: generateHistory(105, 0.011, -0.08, -0.85),
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Financials',
    industry: 'Diversified Banking & Investment',
    price: 218.60,
    change: 2.10,
    changePercent: 0.97,
    marketCap: '$620 Billion',
    peRatio: 12.8,
    dividendYield: 2.25,
    description: 'Global banking leader. Benefits from higher interest rates via Net Interest Margin (NIM) expansion, up to the point of credit contraction.',
    history: generateHistory(170, 0.014, 0.22, 0.25),
  },
  {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    sector: 'Healthcare',
    industry: 'Pharmaceuticals & MedTech',
    price: 162.10,
    change: 0.20,
    changePercent: 0.12,
    marketCap: '$388 Billion',
    peRatio: 22.4,
    dividendYield: 3.10,
    description: 'Defensive AAA-rated healthcare giant with low economic sensitivity, steady dividend payouts, and low rate volatility.',
    history: generateHistory(155, 0.010, 0.05, -0.05),
  },
  {
    symbol: 'ARKK',
    name: 'ARK Innovation ETF',
    sector: 'Thematic Growth ETF',
    industry: 'Disruptive Innovation',
    price: 48.90,
    change: -1.20,
    changePercent: -2.39,
    marketCap: '$6.2 Billion ETF',
    peRatio: 0,
    dividendYield: 0.00,
    description: 'Speculative hyper-growth innovation ETF. Highly sensitive to discount rates and liquidity conditions; steep drawdowns during rate hike cycles.',
    history: generateHistory(75, 0.038, -0.02, -0.55),
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    sector: 'Index Benchmark',
    industry: 'Broad Market ETF',
    price: 565.10,
    change: 3.20,
    changePercent: 0.57,
    marketCap: '$580 Billion ETF',
    peRatio: 26.5,
    dividendYield: 1.25,
    description: 'Core benchmark tracking 500 largest US equities. Serves as market baseline for calculating Beta and relative risk.',
    history: generateHistory(470, 0.011, 0.15, -0.15),
  },
];

export const POPULAR_STOCKS: StockQuote[] = RAW_STOCKS.map((s) => {
  const metrics = calculateRiskMetrics(s.history, 25.0);
  return {
    ...s,
    metrics,
  };
});

/**
 * Searches or generates realistic stock quote and historical risk data with threshold parameter.
 */
export function getStockData(querySymbol: string, thresholdPercent: number = 25.0): StockQuote {
  const cleanSymbol = querySymbol.trim().toUpperCase();
  const existing = RAW_STOCKS.find((s) => s.symbol === cleanSymbol);

  if (existing) {
    const metrics = calculateRiskMetrics(existing.history, thresholdPercent);
    return {
      ...existing,
      metrics,
    };
  }

  // Generate dynamic stock quote for custom ticker
  const seed = cleanSymbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = 40 + (seed % 300);
  const volatility = 0.012 + ((seed % 25) / 1000);
  const trend = ((seed % 30) - 10) / 100;
  const rateSens = -0.6 + ((seed % 100) / 100);

  const history = generateHistory(basePrice, volatility, trend, rateSens);
  const metrics = calculateRiskMetrics(history, thresholdPercent);

  const mockSectors = [
    'Information Technology',
    'Financials',
    'Healthcare',
    'Consumer Discretionary',
    'Industrials',
    'Energy',
    'Real Estate',
  ];
  const sector = mockSectors[seed % mockSectors.length];

  return {
    symbol: cleanSymbol,
    name: `${cleanSymbol} Asset Holdings`,
    sector,
    industry: `${sector} Operations`,
    price: history[history.length - 1].price,
    change: Number(((Math.random() - 0.48) * 3).toFixed(2)),
    changePercent: Number(((Math.random() - 0.48) * 1.8).toFixed(2)),
    marketCap: `$${(20 + (seed % 250)).toFixed(1)} Billion`,
    peRatio: Number((14 + (seed % 40)).toFixed(1)),
    dividendYield: Number(((seed % 45) / 10).toFixed(2)),
    description: `Dynamic quantitative financial data compiled for ${cleanSymbol} based on historical price series, interest rate yield shifts, and volatility metrics.`,
    history,
    metrics,
  };
}
