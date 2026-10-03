import {
  StockPricePoint,
  RiskMetrics,
  RollingVolatilityPoint,
  ReturnDistributionBucket,
  MonteCarloPath,
  StressScenarioResult,
  PortfolioItem,
  StockQuote,
  PortfolioRiskMetrics,
  FiveFactorRiskModel
} from '../types/stock';

const RISK_FREE_RATE = 0.0425;

export interface PriceProjectionPoint {
  date: string;
  actualPrice?: number;
  sma30?: number;
  projectedPrice?: number;
  upperConfidence?: number;
  lowerConfidence?: number;
  isForecast: boolean;
}

export function calculatePriceProjection(history: StockPricePoint[], annualizedVol: number): PriceProjectionPoint[] {
  if (!history || history.length < 30) return [];

  const points: PriceProjectionPoint[] = [];
  const N = history.length;

  for (let i = 0; i < N; i++) {
    let sma: number | undefined = undefined;
    if (i >= 29) {
      const slice = history.slice(i - 29, i + 1);
      const sum = slice.reduce((acc, p) => acc + p.price, 0);
      sma = Number((sum / 30).toFixed(2));
    }

    points.push({
      date: history[i].date,
      actualPrice: history[i].price,
      sma30: sma,
      isForecast: false,
    });
  }

  const lastPrice = history[N - 1].price;
  const lastSma = points[N - 1].sma30 || lastPrice;
  const prevSma = points[N - 15]?.sma30 || lastSma;

  const dailySmaSlope = (lastSma - prevSma) / 15;
  const lastDate = new Date(history[N - 1].date);

  for (let d = 1; d <= 30; d++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + Math.floor(d * 1.4));

    const projectedSma = Math.max(1.0, lastSma + dailySmaSlope * d);
    const projectedPrice = Math.max(1.0, lastPrice + dailySmaSlope * d * 0.8);

    const volExpansion = annualizedVol * Math.sqrt(d / 252);
    const upperConfidence = projectedPrice * (1 + volExpansion);
    const lowerConfidence = Math.max(1.0, projectedPrice * (1 - volExpansion));

    points.push({
      date: nextDate.toISOString().split('T')[0],
      projectedPrice: Number(projectedPrice.toFixed(2)),
      sma30: Number(projectedSma.toFixed(2)),
      upperConfidence: Number(upperConfidence.toFixed(2)),
      lowerConfidence: Number(lowerConfidence.toFixed(2)),
      isForecast: true,
    });
  }

  return points.slice(-75);
}

export function calculateRiskMetrics(
  history: StockPricePoint[],
  userVolatilityThresholdPercent: number = 25.0,
  customDebtRatio: number = 0.35,
  customCreditRatingNorm: number = 25.0
): RiskMetrics {
  if (!history || history.length < 10) {
    return getDefaultRiskMetrics(userVolatilityThresholdPercent);
  }

  const dailyReturns: number[] = [];
  const rateChanges: number[] = [];
  const sp500Returns: number[] = [];

  for (let i = 1; i < history.length; i++) {
    const prevPrice = history[i - 1].price;
    const currPrice = history[i].price;
    if (prevPrice > 0) {
      dailyReturns.push((currPrice - prevPrice) / prevPrice);
    }

    if (history[i].interestRate !== undefined && history[i - 1].interestRate !== undefined) {
      rateChanges.push((history[i].interestRate! - history[i - 1].interestRate!) * 100);
    } else {
      rateChanges.push(0);
    }

    if (history[i].sp500Price && history[i - 1].sp500Price) {
      sp500Returns.push((history[i].sp500Price! - history[i - 1].sp500Price!) / history[i - 1].sp500Price!);
    } else {
      sp500Returns.push((dailyReturns[dailyReturns.length - 1] || 0) * 0.7);
    }
  }

  const N = dailyReturns.length;
  if (N === 0) return getDefaultRiskMetrics(userVolatilityThresholdPercent);

  const meanDailyReturn = dailyReturns.reduce((acc, val) => acc + val, 0) / N;
  const annualizedReturn = Math.pow(1 + meanDailyReturn, 252) - 1;

  const calcVol = (returnsSlice: number[]) => {
    if (returnsSlice.length < 2) return 0.15;
    const mean = returnsSlice.reduce((a, b) => a + b, 0) / returnsSlice.length;
    const variance = returnsSlice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returnsSlice.length - 1);
    return Math.sqrt(variance * 252);
  };

  const vol30d = calcVol(dailyReturns.slice(-30));
  const vol90d = calcVol(dailyReturns.slice(-90));
  const vol1y = calcVol(dailyReturns);

  const isAlertTriggered = (vol30d * 100) >= userVolatilityThresholdPercent;

  // Downside Volatility
  const negativeReturns = dailyReturns.filter(r => r < 0);
  const downsideVariance = negativeReturns.length > 0
    ? negativeReturns.reduce((acc, r) => acc + Math.pow(r, 2), 0) / N
    : 0.0001;
  const downsideVolatility = Math.sqrt(downsideVariance * 252);

  // Max Drawdown
  let maxDrawdown = 0;
  let currentDrawdown = 0;
  let maxDrawdownDays = 0;
  let tempDrawdownDays = 0;
  let peak = history[0].price;

  for (let i = 0; i < history.length; i++) {
    const p = history[i].price;
    if (p > peak) {
      peak = p;
      tempDrawdownDays = 0;
    } else {
      tempDrawdownDays++;
      const dd = (peak - p) / peak;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
        maxDrawdownDays = tempDrawdownDays;
      }
    }
  }

  const lastPrice = history[history.length - 1].price;
  currentDrawdown = (peak - lastPrice) / peak;

  // Value at Risk
  const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
  const index95 = Math.floor(N * 0.05);
  const index99 = Math.floor(N * 0.01);

  const var95Daily = Math.abs(sortedReturns[index95] || -0.02);
  const var99Daily = Math.abs(sortedReturns[index99] || -0.035);

  const cvar95Slice = sortedReturns.slice(0, Math.max(1, index95));
  const cvar95Daily = Math.abs(cvar95Slice.reduce((a, b) => a + b, 0) / cvar95Slice.length);

  // Rate Beta
  let covStockRate = 0;
  let varRate = 0;
  const meanRateChange = rateChanges.reduce((a, b) => a + b, 0) / N;

  for (let i = 0; i < N; i++) {
    covStockRate += (dailyReturns[i] - meanDailyReturn) * (rateChanges[i] - meanRateChange);
    varRate += Math.pow(rateChanges[i] - meanRateChange, 2);
  }

  const rateBeta = varRate > 0 ? (covStockRate / varRate) * 100 : -0.18;
  const rateImpactPlus100bps = rateBeta * 1.0;
  const rateImpactMinus100bps = -rateBeta * 1.0;
  const durationProxy = Math.abs(rateBeta * 2.5);

  let interestRiskCategory: RiskMetrics['interestRiskCategory'] = 'Moderate Sensitivity';
  if (Math.abs(rateBeta) > 0.4 || durationProxy > 8) {
    interestRiskCategory = 'Extreme Sensitivity';
  } else if (Math.abs(rateBeta) > 0.25 || durationProxy > 5) {
    interestRiskCategory = 'High Sensitivity';
  } else if (Math.abs(rateBeta) < 0.1 && durationProxy < 2) {
    interestRiskCategory = 'Low Sensitivity';
  }

  // Market Ratios
  let covStockMarket = 0;
  let varMarket = 0;
  const meanSP = sp500Returns.reduce((a, b) => a + b, 0) / (sp500Returns.length || 1);

  for (let i = 0; i < Math.min(N, sp500Returns.length); i++) {
    covStockMarket += (dailyReturns[i] - meanDailyReturn) * (sp500Returns[i] - meanSP);
    varMarket += Math.pow(sp500Returns[i] - meanSP, 2);
  }

  const betaToMarket = varMarket > 0 ? covStockMarket / varMarket : 1.0;
  const alpha = annualizedReturn - (RISK_FREE_RATE + betaToMarket * (0.09 - RISK_FREE_RATE));

  const sharpeRatio = vol1y > 0 ? (annualizedReturn - RISK_FREE_RATE) / vol1y : 0;
  const sortinoRatio = downsideVolatility > 0 ? (annualizedReturn - RISK_FREE_RATE) / downsideVolatility : 0;

  const stdDaily = vol1y / Math.sqrt(252);
  let skewSum = 0;
  let kurtSum = 0;
  for (let i = 0; i < N; i++) {
    const z = (dailyReturns[i] - meanDailyReturn) / (stdDaily || 0.01);
    skewSum += Math.pow(z, 3);
    kurtSum += Math.pow(z, 4);
  }
  const skewness = skewSum / N;
  const kurtosis = (kurtSum / N) - 3;

  // PPT FIVE-FACTOR MODEL
  const f_vol_score = Math.min(100, Math.max(0, ((vol1y - 0.05) / (0.50 - 0.05)) * 100));
  const c_vol = f_vol_score * 0.30;

  const f_liq_score = Math.min(100, Math.max(0, (var95Daily / 0.04) * 100));
  const c_liq = f_liq_score * 0.20;

  const f_corr_score = Math.min(100, Math.max(0, ((betaToMarket - 0.3) / (2.0 - 0.3)) * 100));
  const c_corr = f_corr_score * 0.20;

  const f_lev_score = Math.min(100, Math.max(0, ((customDebtRatio - 0.1) / (0.8 - 0.1)) * 100));
  const c_lev = f_lev_score * 0.15;

  const f_track_score = Math.min(100, Math.max(0, customCreditRatingNorm));
  const c_track = f_track_score * 0.15;

  const totalFiveFactorScore = Number((c_vol + c_liq + c_corr + c_lev + c_track).toFixed(1));

  let riskBand: FiveFactorRiskModel['riskBand'] = 'Moderate Risk';
  let colorBandHex = '#f59e0b';

  if (totalFiveFactorScore <= 30.0) {
    riskBand = 'Low Risk';
    colorBandHex = '#10b981';
  } else if (totalFiveFactorScore <= 60.0) {
    riskBand = 'Moderate Risk';
    colorBandHex = '#f59e0b';
  } else if (totalFiveFactorScore <= 80.0) {
    riskBand = 'High Risk';
    colorBandHex = '#f97316';
  } else {
    riskBand = 'Very High Risk';
    colorBandHex = '#ef4444';
  }

  const fiveFactorModel: FiveFactorRiskModel = {
    volatility: {
      name: 'Volatility',
      normalizedScore: Number(f_vol_score.toFixed(1)),
      weight: 0.30,
      weightPercent: '30%',
      contribution: Number(c_vol.toFixed(2)),
      description: 'Historical standard deviation of price returns annualized.',
    },
    liquidity: {
      name: 'Liquidity Risk',
      normalizedScore: Number(f_liq_score.toFixed(1)),
      weight: 0.20,
      weightPercent: '20%',
      contribution: Number(c_liq.toFixed(2)),
      description: 'Average turnover & price impact during selloffs.',
    },
    marketCorrelation: {
      name: 'Market/Sector Correlation',
      normalizedScore: Number(f_corr_score.toFixed(1)),
      weight: 0.20,
      weightPercent: '20%',
      contribution: Number(c_corr.toFixed(2)),
      description: 'Sensitivity to systemic benchmark moves (Beta).',
    },
    leverageDebt: {
      name: 'Leverage / Debt Ratio',
      normalizedScore: Number(f_lev_score.toFixed(1)),
      weight: 0.15,
      weightPercent: '15%',
      contribution: Number(c_lev.toFixed(2)),
      description: 'Financial debt obligation relative to asset capital.',
    },
    trackRecordCredit: {
      name: 'Track Record / Credit Rating',
      normalizedScore: Number(f_track_score.toFixed(1)),
      weight: 0.15,
      weightPercent: '15%',
      contribution: Number(c_track.toFixed(2)),
      description: 'Corporate stability and balance sheet credit history.',
    },
    totalScore: totalFiveFactorScore,
    riskBand,
    colorBandHex,
  };

  let overallRiskLevel: RiskMetrics['overallRiskLevel'] = 'Moderate';
  if (totalFiveFactorScore > 80) overallRiskLevel = 'Very High';
  else if (totalFiveFactorScore > 60) overallRiskLevel = 'High';
  else if (totalFiveFactorScore < 31) overallRiskLevel = 'Low';

  return {
    volatility30d: vol30d,
    volatility90d: vol90d,
    volatility1y: vol1y,
    downsideVolatility,
    maxDrawdown,
    maxDrawdownDays,
    currentDrawdown,
    var95Daily,
    var99Daily,
    cvar95Daily,
    rateBeta,
    durationProxy,
    rateImpactPlus100bps,
    rateImpactMinus100bps,
    interestRiskCategory,
    sharpeRatio,
    sortinoRatio,
    betaToMarket,
    alpha,
    annualizedReturn,
    skewness,
    kurtosis,
    isAlertTriggered,
    alertMetric: '30d',
    fiveFactorModel,
    overallRiskLevel,
    overallRiskScore: Math.round(totalFiveFactorScore),
  };
}

export function calculateRollingVolatility(history: StockPricePoint[]): RollingVolatilityPoint[] {
  const result: RollingVolatilityPoint[] = [];
  if (history.length < 30) return result;

  let peak = history[0].price;

  for (let i = 30; i < history.length; i++) {
    const slice30 = history.slice(i - 30, i);
    const slice90 = history.slice(Math.max(0, i - 90), i);

    const calcVol = (slice: StockPricePoint[]) => {
      const returns: number[] = [];
      for (let j = 1; j < slice.length; j++) {
        returns.push((slice[j].price - slice[j - 1].price) / slice[j - 1].price);
      }
      if (returns.length < 2) return 0.15;
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
      return Math.sqrt(variance * 252);
    };

    const currentPrice = history[i].price;
    if (currentPrice > peak) peak = currentPrice;
    const drawdown = (peak - currentPrice) / peak;

    result.push({
      date: history[i].date,
      volatility30d: Number((calcVol(slice30) * 100).toFixed(2)),
      volatility90d: Number((calcVol(slice90) * 100).toFixed(2)),
      drawdown: Number((-drawdown * 100).toFixed(2)),
      price: currentPrice,
      interestRate: history[i].interestRate || 4.25,
    });
  }

  return result;
}

export function calculateReturnDistribution(history: StockPricePoint[]): ReturnDistributionBucket[] {
  if (history.length < 10) return [];

  const returns: number[] = [];
  for (let i = 1; i < history.length; i++) {
    returns.push((history[i].price - history[i - 1].price) / history[i - 1].price);
  }

  const N = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / N;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / N;
  const std = Math.sqrt(variance);

  const step = 0.01;
  const buckets: ReturnDistributionBucket[] = [];

  for (let b = -5; b <= 5; b++) {
    const minR = b * step;
    const maxR = (b + 1) * step;
    const label = `${b > 0 ? '+' : ''}${b}% to ${b + 1 > 0 ? '+' : ''}${b + 1}%`;

    const actualCount = returns.filter(r => r >= minR && r < maxR).length;

    const xMid = (minR + maxR) / 2;
    const normalProb = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((xMid - mean) / std, 2));
    const normalCount = Math.round(normalProb * step * N);

    buckets.push({
      rangeLabel: label,
      minReturn: minR,
      maxReturn: maxR,
      actualCount,
      normalCount,
    });
  }

  return buckets;
}

export function runMonteCarloSimulation(currentPrice: number, annualizedVol: number, annualizedReturn: number): MonteCarloPath[] {
  const days = 252;
  const numSimulations = 200;
  const dailyMu = (annualizedReturn - 0.5 * Math.pow(annualizedVol, 2)) / 252;
  const dailySigma = annualizedVol / Math.sqrt(252);

  const simPrices: number[][] = Array.from({ length: days }, () => []);

  for (let sim = 0; sim < numSimulations; sim++) {
    let price = currentPrice;
    for (let day = 0; day < days; day++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);

      price = price * Math.exp(dailyMu + dailySigma * z);
      simPrices[day].push(price);
    }
  }

  const result: MonteCarloPath[] = [];
  for (let day = 0; day < days; day += 5) {
    const prices = simPrices[day].sort((a, b) => a - b);
    const p5 = prices[Math.floor(numSimulations * 0.05)];
    const p25 = prices[Math.floor(numSimulations * 0.25)];
    const p50 = prices[Math.floor(numSimulations * 0.50)];
    const p75 = prices[Math.floor(numSimulations * 0.75)];
    const p95 = prices[Math.floor(numSimulations * 0.95)];

    result.push({
      day,
      p5: Number(p5.toFixed(2)),
      p25: Number(p25.toFixed(2)),
      p50: Number(p50.toFixed(2)),
      p75: Number(p75.toFixed(2)),
      p95: Number(p95.toFixed(2)),
    });
  }

  return result;
}

export function getStressTestingScenarios(metrics: RiskMetrics): StressScenarioResult[] {
  return [
    {
      scenarioName: "Fed Interest Rate Hike (+150 bps)",
      description: "Federal Reserve hikes interest rates by 150 bps to curb inflation pressures.",
      interestRateShiftBps: 150,
      marketShockPercent: -8.5,
      estimatedStockImpact: Number((metrics.rateImpactPlus100bps * 1.5 + metrics.betaToMarket * -8.5).toFixed(2)),
      riskLevel: metrics.durationProxy > 6 ? "Severe" : "Manageable",
    },
    {
      scenarioName: "Fed Rate Cut Pivot (-100 bps)",
      description: "Central bank cuts rates by 100 bps following economic cooling.",
      interestRateShiftBps: -100,
      marketShockPercent: 5.0,
      estimatedStockImpact: Number((metrics.rateImpactMinus100bps * 1.0 + metrics.betaToMarket * 5.0).toFixed(2)),
      riskLevel: "Manageable",
    },
    {
      scenarioName: "Macro Recession & Credit Contraction",
      description: "Economic recession accompanied by debt refinancing cost escalation.",
      interestRateShiftBps: -50,
      marketShockPercent: -22.0,
      estimatedStockImpact: Number((-metrics.maxDrawdown * 0.7 - metrics.betaToMarket * 15.0).toFixed(2)),
      riskLevel: "Critical",
    },
    {
      scenarioName: "Stagflation Shock (High Yields + Margin Compression)",
      description: "Persistent elevated yields (10Y yield > 5.25%) paired with contracting corporate margins.",
      interestRateShiftBps: 100,
      marketShockPercent: -14.0,
      estimatedStockImpact: Number((metrics.rateImpactPlus100bps * 1.2 - 12.5).toFixed(2)),
      riskLevel: metrics.overallRiskScore > 60 ? "Critical" : "Severe",
    },
  ];
}

export function calculatePortfolioRisk(items: PortfolioItem[], availableStocks: StockQuote[]): PortfolioRiskMetrics {
  const activeItems = items.filter(it => it.weight > 0);
  if (activeItems.length === 0) {
    return {
      totalReturn1y: 0,
      portfolioVolatility: 0,
      portfolioVar95: 0,
      portfolioRateBeta: 0,
      sharpeRatio: 0,
      diversificationScore: 0,
      stressTestResults: [],
    };
  }

  const totalWeight = activeItems.reduce((sum, item) => sum + item.weight, 0);

  let weightedReturn = 0;
  let weightedVolSum = 0;
  let weightedVarSum = 0;
  let weightedRateBetaSum = 0;

  activeItems.forEach(item => {
    const stock = availableStocks.find(s => s.symbol === item.symbol);
    if (stock) {
      const normWeight = item.weight / totalWeight;
      weightedReturn += normWeight * stock.metrics.annualizedReturn;
      weightedVolSum += normWeight * stock.metrics.volatility1y;
      weightedVarSum += normWeight * stock.metrics.var95Daily;
      weightedRateBetaSum += normWeight * stock.metrics.rateBeta;
    }
  });

  const numAssets = activeItems.length;
  const diversificationFactor = Math.max(0.72, 1 - (numAssets - 1) * 0.08);

  const portfolioVolatility = weightedVolSum * diversificationFactor;
  const portfolioVar95 = weightedVarSum * diversificationFactor;
  const sharpeRatio = portfolioVolatility > 0 ? (weightedReturn - RISK_FREE_RATE) / portfolioVolatility : 0;
  const diversificationScore = Math.min(100, Math.round(numAssets * 22 * (1 / diversificationFactor)));

  const mockMetrics: RiskMetrics = {
    ...getDefaultRiskMetrics(25.0),
    volatility1y: portfolioVolatility,
    var95Daily: portfolioVar95,
    rateImpactPlus100bps: weightedRateBetaSum,
    rateImpactMinus100bps: -weightedRateBetaSum,
    durationProxy: Math.abs(weightedRateBetaSum * 2.5),
    betaToMarket: 1.0,
    maxDrawdown: portfolioVolatility * 1.4,
  };

  return {
    totalReturn1y: Number((weightedReturn * 100).toFixed(2)),
    portfolioVolatility: Number((portfolioVolatility * 100).toFixed(2)),
    portfolioVar95: Number((portfolioVar95 * 100).toFixed(2)),
    portfolioRateBeta: Number(weightedRateBetaSum.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    diversificationScore,
    stressTestResults: getStressTestingScenarios(mockMetrics),
  };
}

function getDefaultRiskMetrics(threshold: number): RiskMetrics {
  const dummyFiveFactor: FiveFactorRiskModel = {
    volatility: { name: 'Volatility', normalizedScore: 60.0, weight: 0.30, weightPercent: '30%', contribution: 18.0, description: 'Std dev' },
    liquidity: { name: 'Liquidity Risk', normalizedScore: 40.0, weight: 0.20, weightPercent: '20%', contribution: 8.0, description: 'Turnover' },
    marketCorrelation: { name: 'Market/Sector Correlation', normalizedScore: 50.0, weight: 0.20, weightPercent: '20%', contribution: 10.0, description: 'Beta' },
    leverageDebt: { name: 'Leverage / Debt Ratio', normalizedScore: 35.0, weight: 0.15, weightPercent: '15%', contribution: 5.25, description: 'Debt' },
    trackRecordCredit: { name: 'Track Record / Credit Rating', normalizedScore: 25.0, weight: 0.15, weightPercent: '15%', contribution: 3.75, description: 'Credit' },
    totalScore: 45.0,
    riskBand: 'Moderate Risk',
    colorBandHex: '#f59e0b',
  };

  return {
    volatility30d: 0.18,
    volatility90d: 0.20,
    volatility1y: 0.22,
    downsideVolatility: 0.15,
    maxDrawdown: 0.25,
    maxDrawdownDays: 45,
    currentDrawdown: 0.05,
    var95Daily: 0.021,
    var99Daily: 0.034,
    cvar95Daily: 0.029,
    rateBeta: -0.18,
    durationProxy: 4.5,
    rateImpactPlus100bps: -0.18,
    rateImpactMinus100bps: 0.18,
    interestRiskCategory: 'Moderate Sensitivity',
    sharpeRatio: 1.1,
    sortinoRatio: 1.4,
    betaToMarket: 1.05,
    alpha: 0.03,
    annualizedReturn: 0.14,
    skewness: -0.2,
    kurtosis: 0.8,
    isAlertTriggered: (0.18 * 100) >= threshold,
    alertMetric: '30d',
    fiveFactorModel: dummyFiveFactor,
    overallRiskLevel: 'Moderate',
    overallRiskScore: 45,
  };
}
