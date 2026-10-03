import { StockQuote, StockPricePoint } from '../types/stock';
import {
  calculateStatisticalFoundations,
  calculateFiveFactorRiskModel,
} from '../services/financialMath';

/**
 * Generates realistic historical daily price sequences with volatility and trend
 */
function generateDailyHistory(
  basePrice: number,
  volatility: number,
  trend: number,
  seedNum: number = 42
): StockPricePoint[] {
  const points: StockPricePoint[] = [];
  const totalDays = 252; // 1 trading year
  const startDate = new Date(2025, 0, 2);

  let currentPrice = basePrice;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + Math.floor(i * 1.4));

    if (d.getDay() === 0 || d.getDay() === 6) continue;

    // Deterministic pseudo-random using seed and index
    const pseudoRandom = Math.sin(seedNum * 997 + i * 13) * 10000;
    const randNorm = (pseudoRandom - Math.floor(pseudoRandom)) - 0.49;

    const dailyReturn = trend / 252 + randNorm * volatility;
    currentPrice = Math.max(1.0, currentPrice * (1 + dailyReturn));

    points.push({
      date: d.toISOString().split('T')[0],
      price: Number(currentPrice.toFixed(2)),
      volume: Math.round(1e6 + Math.abs(Math.sin(i)) * 6e6),
    });
  }

  return points;
}

interface RawStockConfig {
  symbol: string;
  name: string;
  sector: string;
  market: 'IN' | 'US';
  currency: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  peRatio?: number;
  debtRatio: number;          // Leverage factor (e.g. 0.35)
  avgDollarVolume: number;    // Liquidity factor
  beta: number;               // Market correlation factor
  creditRatingRisk: number;   // Track record risk 0-100
  history: StockPricePoint[];
}

const RAW_STOCKS: RawStockConfig[] = [
  // ==========================================
  // INDIAN STOCKS (NSE / BSE)
  // ==========================================
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    sector: 'Energy & Conglomerate',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 2985.40,
    change: 24.80,
    changePercent: 0.84,
    marketCap: '₹20.2 Lakh Cr',
    peRatio: 28.4,
    debtRatio: 0.34,
    avgDollarVolume: 1.8e8, // High liquidity
    beta: 1.05,
    creditRatingRisk: 14.0, // Domestic AAA
    history: generateDailyHistory(2650, 0.015, 0.16, 101),
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd.',
    sector: 'Information Technology',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 4192.50,
    change: 38.10,
    changePercent: 0.92,
    marketCap: '₹15.1 Lakh Cr',
    peRatio: 31.6,
    debtRatio: 0.08, // Debt-free balance sheet
    avgDollarVolume: 9.5e7,
    beta: 0.78, // Defensive IT
    creditRatingRisk: 8.0, // AAA Highest Tier
    history: generateDailyHistory(3750, 0.013, 0.14, 202),
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    sector: 'Banking & Financials',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 1756.80,
    change: 14.60,
    changePercent: 0.84,
    marketCap: '₹13.4 Lakh Cr',
    peRatio: 19.5,
    debtRatio: 0.52, // Banking leverage
    avgDollarVolume: 1.4e8,
    beta: 1.10,
    creditRatingRisk: 15.0, // Systemic bank
    history: generateDailyHistory(1520, 0.014, 0.18, 404),
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    sector: 'Information Technology',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 1918.20,
    change: -12.40,
    changePercent: -0.64,
    marketCap: '₹7.95 Lakh Cr',
    peRatio: 27.2,
    debtRatio: 0.12,
    avgDollarVolume: 1.1e8,
    beta: 0.95,
    creditRatingRisk: 12.0,
    history: generateDailyHistory(1580, 0.017, 0.22, 303),
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Limited',
    sector: 'Banking & Financials',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 1278.30,
    change: 11.20,
    changePercent: 0.88,
    marketCap: '₹8.98 Lakh Cr',
    peRatio: 18.2,
    debtRatio: 0.50,
    avgDollarVolume: 1.05e8,
    beta: 1.12,
    creditRatingRisk: 16.0,
    history: generateDailyHistory(1050, 0.015, 0.22, 606),
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Limited',
    sector: 'Automobile & EV',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 968.75,
    change: -15.80,
    changePercent: -1.61,
    marketCap: '₹3.55 Lakh Cr',
    peRatio: 16.4,
    debtRatio: 0.45,
    avgDollarVolume: 1.2e8,
    beta: 1.38,
    creditRatingRisk: 28.0,
    history: generateDailyHistory(790, 0.024, 0.25, 505),
  },
  {
    symbol: 'ITC',
    name: 'ITC Limited',
    sector: 'Consumer Goods (FMCG)',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 512.40,
    change: 2.10,
    changePercent: 0.41,
    marketCap: '₹6.38 Lakh Cr',
    peRatio: 29.1,
    debtRatio: 0.04, // Low debt
    avgDollarVolume: 8.5e7,
    beta: 0.58, // Low volatility
    creditRatingRisk: 10.0,
    history: generateDailyHistory(440, 0.011, 0.16, 707),
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Limited',
    sector: 'Telecommunications',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 1712.50,
    change: 18.40,
    changePercent: 1.09,
    marketCap: '₹9.8 Lakh Cr',
    peRatio: 52.8,
    debtRatio: 0.42,
    avgDollarVolume: 9.0e7,
    beta: 0.88,
    creditRatingRisk: 22.0,
    history: generateDailyHistory(1320, 0.016, 0.30, 808),
  },
  {
    symbol: 'LT',
    name: 'Larsen & Toubro Ltd.',
    sector: 'Infrastructure & Defense',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 3645.00,
    change: 42.50,
    changePercent: 1.18,
    marketCap: '₹5.01 Lakh Cr',
    peRatio: 33.4,
    debtRatio: 0.38,
    avgDollarVolume: 8.8e7,
    beta: 1.02,
    creditRatingRisk: 18.0,
    history: generateDailyHistory(3200, 0.016, 0.16, 909),
  },
  {
    symbol: 'SBIN',
    name: 'State Bank of India',
    sector: 'Public Sector Banking',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 789.20,
    change: 6.40,
    changePercent: 0.82,
    marketCap: '₹7.04 Lakh Cr',
    peRatio: 11.2,
    debtRatio: 0.58,
    avgDollarVolume: 1.3e8,
    beta: 1.20,
    creditRatingRisk: 18.0,
    history: generateDailyHistory(620, 0.018, 0.28, 888),
  },
  {
    symbol: 'BAJFINANCE',
    name: 'Bajaj Finance Limited',
    sector: 'Financial Services (NBFC)',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 6920.00,
    change: -45.00,
    changePercent: -0.65,
    marketCap: '₹4.28 Lakh Cr',
    peRatio: 28.6,
    debtRatio: 0.55,
    avgDollarVolume: 9.2e7,
    beta: 1.25,
    creditRatingRisk: 16.0,
    history: generateDailyHistory(6400, 0.019, 0.12, 777),
  },
  {
    symbol: 'SUNPHARMA',
    name: 'Sun Pharmaceutical Industries',
    sector: 'Healthcare & Pharma',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 1835.40,
    change: 14.20,
    changePercent: 0.78,
    marketCap: '₹4.40 Lakh Cr',
    peRatio: 38.5,
    debtRatio: 0.15,
    avgDollarVolume: 7.2e7,
    beta: 0.65,
    creditRatingRisk: 12.0,
    history: generateDailyHistory(1500, 0.013, 0.24, 666),
  },
  {
    symbol: 'NIFTY50',
    name: 'NIFTY 50 Benchmark Index',
    sector: 'Benchmark Index',
    market: 'IN',
    currency: '₹',
    exchange: 'NSE',
    price: 25420.50,
    change: 115.30,
    changePercent: 0.46,
    marketCap: '₹420 Lakh Cr',
    peRatio: 23.5,
    debtRatio: 0.25,
    avgDollarVolume: 3.5e8,
    beta: 1.00,
    creditRatingRisk: 10.0,
    history: generateDailyHistory(21800, 0.010, 0.18, 999),
  },

  // ==========================================
  // US & GLOBAL STOCKS
  // ==========================================
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Information Technology',
    market: 'US',
    currency: '$',
    exchange: 'NASDAQ',
    price: 232.40,
    change: 1.85,
    changePercent: 0.80,
    marketCap: '$3.55T',
    peRatio: 33.8,
    debtRatio: 0.28,
    avgDollarVolume: 9.8e7,
    beta: 1.08,
    creditRatingRisk: 15.0,
    history: generateDailyHistory(185, 0.016, 0.18, 111),
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Information Technology',
    market: 'US',
    currency: '$',
    exchange: 'NASDAQ',
    price: 128.50,
    change: -2.30,
    changePercent: -1.76,
    marketCap: '$3.15T',
    peRatio: 48.2,
    debtRatio: 0.18,
    avgDollarVolume: 1.5e8,
    beta: 1.72,
    creditRatingRisk: 30.0,
    history: generateDailyHistory(60, 0.030, 0.55, 222),
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Information Technology',
    market: 'US',
    currency: '$',
    exchange: 'NASDAQ',
    price: 448.20,
    change: 3.10,
    changePercent: 0.70,
    marketCap: '$3.33T',
    peRatio: 35.1,
    debtRatio: 0.24,
    avgDollarVolume: 8.5e7,
    beta: 0.95,
    creditRatingRisk: 10.0,
    history: generateDailyHistory(380, 0.015, 0.16, 333),
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    sector: 'Consumer Discretionary',
    market: 'US',
    currency: '$',
    exchange: 'NASDAQ',
    price: 245.80,
    change: -5.40,
    changePercent: -2.15,
    marketCap: '$780B',
    peRatio: 68.4,
    debtRatio: 0.32,
    avgDollarVolume: 1.1e8,
    beta: 1.95,
    creditRatingRisk: 52.0,
    history: generateDailyHistory(210, 0.036, 0.12, 444),
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    sector: 'Index Benchmark',
    market: 'US',
    currency: '$',
    exchange: 'NYSE',
    price: 565.10,
    change: 3.20,
    changePercent: 0.57,
    marketCap: '$580B',
    peRatio: 26.5,
    debtRatio: 0.20,
    avgDollarVolume: 2.2e8,
    beta: 1.00,
    creditRatingRisk: 10.0,
    history: generateDailyHistory(480, 0.012, 0.14, 555),
  },
];

function buildStockQuote(raw: RawStockConfig): StockQuote {
  const { stats } = calculateStatisticalFoundations(raw.history);
  const annualizedVolDecimal = stats.annualizedVolatility / 100.0;

  const fiveFactorModel = calculateFiveFactorRiskModel({
    annualizedVolDecimal,
    avgDollarVolume: raw.avgDollarVolume,
    beta: raw.beta,
    debtRatio: raw.debtRatio,
    creditRatingRisk: raw.creditRatingRisk,
  });

  return {
    symbol: raw.symbol,
    name: raw.name,
    sector: raw.sector,
    market: raw.market,
    currency: raw.currency,
    exchange: raw.exchange,
    price: raw.price,
    change: raw.change,
    changePercent: raw.changePercent,
    marketCap: raw.marketCap,
    peRatio: raw.peRatio,
    history: raw.history,
    stats,
    fiveFactorModel,
  };
}

export const POPULAR_STOCKS: StockQuote[] = RAW_STOCKS.map(buildStockQuote);

export function getStockData(querySymbol: string): StockQuote {
  const cleanSymbol = querySymbol.trim().toUpperCase();
  const existing = RAW_STOCKS.find((s) => s.symbol === cleanSymbol);

  if (existing) {
    return buildStockQuote(existing);
  }

  // Dynamic generator for custom symbols
  const seed = cleanSymbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isIndianFormat = ['TATA', 'RELI', 'INFY', 'HDFC', 'ICICI', 'BHARTI', 'WIPRO', 'ADANI', 'SBIN', 'ITC', 'BAJAJ'].some(p => cleanSymbol.includes(p));
  
  const currency = isIndianFormat ? '₹' : '$';
  const exchange = isIndianFormat ? 'NSE' : 'NASDAQ';
  const basePrice = isIndianFormat ? (500 + (seed % 3500)) : (40 + (seed % 280));
  const volatility = 0.014 + ((seed % 20) / 1000);
  const trend = ((seed % 30) - 8) / 100;

  const history = generateDailyHistory(basePrice, volatility, trend, seed);
  const mockSectors = [
    'Information Technology',
    'Financials & Banking',
    'Automobile & Manufacturing',
    'Energy & Power',
    'Consumer Goods (FMCG)',
    'Infrastructure & Defense',
  ];
  const sector = mockSectors[seed % mockSectors.length];

  const rawConfig: RawStockConfig = {
    symbol: cleanSymbol,
    name: `${cleanSymbol} Corp`,
    sector,
    market: isIndianFormat ? 'IN' : 'US',
    currency,
    exchange,
    price: history[history.length - 1].price,
    change: Number(((Math.random() - 0.48) * (isIndianFormat ? 25 : 3)).toFixed(2)),
    changePercent: Number(((Math.random() - 0.48) * 1.8).toFixed(2)),
    marketCap: isIndianFormat ? `₹${(1.5 + (seed % 15)).toFixed(1)} Lakh Cr` : `$${(15 + (seed % 180)).toFixed(1)}B`,
    peRatio: Number((15 + (seed % 35)).toFixed(1)),
    debtRatio: 0.15 + ((seed % 50) / 100),
    avgDollarVolume: (5 + (seed % 80)) * 1e6,
    beta: 0.6 + ((seed % 120) / 100),
    creditRatingRisk: 15 + (seed % 65),
    history,
  };

  return buildStockQuote(rawConfig);
}
