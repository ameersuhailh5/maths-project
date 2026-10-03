export interface StockPricePoint {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  interestRate?: number;
  sp500Price?: number;
}

export interface RollingVolatilityPoint {
  date: string;
  volatility30d: number;
  volatility90d: number;
  drawdown: number;
  price: number;
  interestRate: number;
}

export interface ReturnDistributionBucket {
  rangeLabel: string;
  minReturn: number;
  maxReturn: number;
  actualCount: number;
  normalCount: number;
}

export interface MonteCarloPath {
  day: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface VolThresholdAlert {
  id: string;
  symbol: string;
  stockName: string;
  timestamp: string;
  thresholdValue: number;
  actualVolatility: number;
  metricType: '30d' | '90d' | '1y';
  severity: 'Warning' | 'Critical';
  priceAtAlert: number;
  read: boolean;
}

// 5-Factor Weighted Sum Model from Presentation (0-100 Scale)
export interface FactorDetail {
  name: string;
  normalizedScore: number; // 0 - 100
  weight: number;          // e.g. 0.30
  weightPercent: string;   // "30%"
  contribution: number;    // normalizedScore * weight
  description: string;
}

export interface FiveFactorRiskModel {
  volatility: FactorDetail;
  liquidity: FactorDetail;
  marketCorrelation: FactorDetail;
  leverageDebt: FactorDetail;
  trackRecordCredit: FactorDetail;
  totalScore: number; // 0 - 100
  riskBand: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Very High Risk';
  colorBandHex: string;
}

export interface RiskMetrics {
  // Volatility
  volatility30d: number;
  volatility90d: number;
  volatility1y: number;
  downsideVolatility: number;
  
  // Drawdown
  maxDrawdown: number;
  maxDrawdownDays: number;
  currentDrawdown: number;
  
  // Value at Risk
  var95Daily: number;
  var99Daily: number;
  cvar95Daily: number;
  
  // Interest Rate Sensitivity
  rateBeta: number;
  durationProxy: number;
  rateImpactPlus100bps: number;
  rateImpactMinus100bps: number;
  interestRiskCategory: 'Low Sensitivity' | 'Moderate Sensitivity' | 'High Sensitivity' | 'Extreme Sensitivity';
  
  // Market Ratios
  sharpeRatio: number;
  sortinoRatio: number;
  betaToMarket: number;
  alpha: number;
  annualizedReturn: number;
  skewness: number;
  kurtosis: number;
  
  // Threshold Alert
  isAlertTriggered: boolean;
  alertMetric: '30d' | '90d' | '1y';
  
  // PPT 5-Factor Model
  fiveFactorModel: FiveFactorRiskModel;

  // Aggregate Risk Score
  overallRiskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  overallRiskScore: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  peRatio?: number;
  dividendYield?: number;
  description: string;
  history: StockPricePoint[];
  metrics: RiskMetrics;
}

export interface StressScenarioResult {
  scenarioName: string;
  description: string;
  interestRateShiftBps: number;
  marketShockPercent: number;
  estimatedStockImpact: number;
  riskLevel: 'Manageable' | 'Severe' | 'Critical';
}

export interface PortfolioItem {
  symbol: string;
  weight: number;
}

export interface PortfolioRiskMetrics {
  totalReturn1y: number;
  portfolioVolatility: number;
  portfolioVar95: number;
  portfolioRateBeta: number;
  sharpeRatio: number;
  diversificationScore: number;
  stressTestResults: StressScenarioResult[];
}
