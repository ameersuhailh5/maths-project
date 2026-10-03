export interface StockPricePoint {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface PriceProjectionPoint {
  date: string;
  actualPrice?: number;
  sma30?: number;
  projectedPrice?: number;
  upperConfidence?: number;
  lowerConfidence?: number;
  isForecast: boolean;
}

// Factor Detail following Slide 4 of the PPT
export interface FactorDetail {
  id: 'volatility' | 'liquidity' | 'marketCorrelation' | 'leverageDebt' | 'trackRecordCredit';
  name: string;
  shortName: string;
  rawMetricValue: string;
  rawMetricUnit: string;
  normalizedScore: number; // 0 - 100
  weight: number;          // 0.30, 0.20, 0.20, 0.15, 0.15
  weightPercent: string;   // "30%", "20%", "20%", "15%", "15%"
  contribution: number;    // normalizedScore * weight
  color: string;
  description: string;
}

// 5-Factor Weighted-Sum Model (Slides 1, 3, 4, 5, 6)
export interface FiveFactorRiskModel {
  volatility: FactorDetail;
  liquidity: FactorDetail;
  marketCorrelation: FactorDetail;
  leverageDebt: FactorDetail;
  trackRecordCredit: FactorDetail;
  totalScore: number; // 0.0 - 100.0
  riskBand: 'Low' | 'Moderate' | 'High' | 'Very High';
  riskRange: string;  // "0–30", "31–60", "61–80", "81–100"
  colorBandHex: string;
  verdictText: string;
}

// Core Statistical & Probability Foundations (Slide 3)
export interface StatisticalFoundations {
  sampleSize: number;
  meanDailyReturn: number;
  dailyStandardDeviation: number;
  annualizedVolatility: number;
  probabilityDownsideDay: number;
  probabilitySevereSlump: number;
  maxDrawdownPercent: number;
}

export interface StockQuote {
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
  history: StockPricePoint[];
  stats: StatisticalFoundations;
  fiveFactorModel: FiveFactorRiskModel;
}
