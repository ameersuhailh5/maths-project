import {
  StockPricePoint,
  StatisticalFoundations,
  FactorDetail,
  FiveFactorRiskModel,
  PriceProjectionPoint,
} from '../types/stock';

/**
 * Slide 4 Weights Definition:
 * Volatility: 30%
 * Liquidity: 20%
 * Market/Sector Correlation: 20%
 * Leverage/Debt Ratio: 15%
 * Track Record/Credit Rating: 15%
 * Total = 100%
 */
export const WEIGHT_VOLATILITY = 0.30;
export const WEIGHT_LIQUIDITY = 0.20;
export const WEIGHT_CORRELATION = 0.20;
export const WEIGHT_LEVERAGE = 0.15;
export const WEIGHT_TRACK_RECORD = 0.15;

/**
 * Concept 1 & 2 (Slide 3): Statistics and Probability
 * - Statistics: Past daily returns, standard deviation, annualized volatility
 * - Probability: Likelihood of uncertain risk events (downside days, severe slumps)
 */
export function calculateStatisticalFoundations(history: StockPricePoint[]): {
  stats: StatisticalFoundations;
  returns: number[];
} {
  if (!history || history.length < 2) {
    return {
      stats: {
        sampleSize: 0,
        meanDailyReturn: 0,
        dailyStandardDeviation: 0.015,
        annualizedVolatility: 0.24,
        probabilityDownsideDay: 48.0,
        probabilitySevereSlump: 4.5,
        maxDrawdownPercent: 18.0,
      },
      returns: [],
    };
  }

  const returns: number[] = [];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1].price;
    const curr = history[i].price;
    if (prev > 0) {
      returns.push((curr - prev) / prev);
    }
  }

  const N = returns.length;
  if (N === 0) {
    return {
      stats: {
        sampleSize: 0,
        meanDailyReturn: 0,
        dailyStandardDeviation: 0.015,
        annualizedVolatility: 0.24,
        probabilityDownsideDay: 48.0,
        probabilitySevereSlump: 4.5,
        maxDrawdownPercent: 18.0,
      },
      returns: [],
    };
  }

  // 1. Statistics: Mean and Standard Deviation
  const meanDailyReturn = returns.reduce((a, b) => a + b, 0) / N;
  const variance = returns.reduce((acc, r) => acc + Math.pow(r - meanDailyReturn, 2), 0) / Math.max(1, N - 1);
  const dailyStandardDeviation = Math.sqrt(variance);
  const annualizedVolatility = dailyStandardDeviation * Math.sqrt(252);

  // 2. Probability: Likelihood of negative day and severe slump (< -2%)
  const negativeDays = returns.filter((r) => r < 0).length;
  const severeSlumpDays = returns.filter((r) => r <= -0.02).length;
  const probabilityDownsideDay = Number(((negativeDays / N) * 100).toFixed(1));
  const probabilitySevereSlump = Number(((severeSlumpDays / N) * 100).toFixed(1));

  // Max Drawdown
  let peak = history[0].price;
  let maxDrawdown = 0;
  for (let i = 0; i < history.length; i++) {
    const p = history[i].price;
    if (p > peak) peak = p;
    const dd = (peak - p) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return {
    stats: {
      sampleSize: N,
      meanDailyReturn: Number(meanDailyReturn.toFixed(4)),
      dailyStandardDeviation: Number(dailyStandardDeviation.toFixed(4)),
      annualizedVolatility: Number((annualizedVolatility * 100).toFixed(1)),
      probabilityDownsideDay,
      probabilitySevereSlump,
      maxDrawdownPercent: Number((maxDrawdown * 100).toFixed(1)),
    },
    returns,
  };
}

/**
 * Concept 3 (Slide 3): Normalization
 * Converts different raw units into a common 0–100 scale:
 * 0 = very low risk, 100 = very high risk
 */
export function normalizeToCommonScale(
  rawValue: number,
  minBound: number,
  maxBound: number
): number {
  if (maxBound === minBound) return 50.0;
  const scaled = ((rawValue - minBound) / (maxBound - minBound)) * 100.0;
  const clamped = Math.max(0.0, Math.min(100.0, scaled));
  return Number(clamped.toFixed(1));
}

/**
 * Concept 4, 5 & 6 (Slides 4, 5, 6):
 * - Percentages (Weights: 30%, 20%, 20%, 15%, 15%)
 * - Weighted Sum: Risk Score = Σ (Risk Value × Weight)
 * - Risk Scoring: Classifies score into Low, Moderate, High, or Very High
 */
export function calculateFiveFactorRiskModel(params: {
  annualizedVolDecimal: number;
  avgDollarVolume: number;
  beta: number;
  debtRatio: number;
  creditRatingRisk: number;
}): FiveFactorRiskModel {
  // Factor 1: Volatility (30% weight)
  // 5% vol -> 0 score (low risk); 50% vol -> 100 score (high risk)
  const volRiskValue = normalizeToCommonScale(params.annualizedVolDecimal, 0.05, 0.50);
  const volContribution = Number((volRiskValue * WEIGHT_VOLATILITY).toFixed(2));

  // Factor 2: Liquidity (20% weight)
  // Higher turnover = lower liquidity risk.
  // $10M+ daily -> low risk, <$500k daily -> high risk
  const logVol = Math.log10(Math.max(10000, params.avgDollarVolume));
  // log10(10M) = 7.0, log10(1B) = 9.0, log10(1M) = 6.0
  const liqRiskValue = normalizeToCommonScale(9.0 - logVol, 0.0, 3.0);
  const liqContribution = Number((liqRiskValue * WEIGHT_LIQUIDITY).toFixed(2));

  // Factor 3: Market/Sector Correlation (20% weight)
  // Beta 0.3 -> 0 risk; Beta 2.0 -> 100 risk
  const corrRiskValue = normalizeToCommonScale(params.beta, 0.3, 2.0);
  const corrContribution = Number((corrRiskValue * WEIGHT_CORRELATION).toFixed(2));

  // Factor 4: Leverage / Debt Ratio (15% weight)
  // Debt ratio 0.10 -> 0 risk; Debt ratio 0.80 -> 100 risk
  const levRiskValue = normalizeToCommonScale(params.debtRatio, 0.10, 0.80);
  const levContribution = Number((levRiskValue * WEIGHT_LEVERAGE).toFixed(2));

  // Factor 5: Track Record / Credit Rating (15% weight)
  // Credit risk tier (AAA = 5 risk; CCC = 90 risk)
  const trackRiskValue = Math.max(0.0, Math.min(100.0, params.creditRatingRisk));
  const trackContribution = Number((trackRiskValue * WEIGHT_TRACK_RECORD).toFixed(2));

  // Concept 5: Weighted Sum -> Risk Score = Σ (Risk Value × Weight)
  const totalScore = Number(
    (volContribution + liqContribution + corrContribution + levContribution + trackContribution).toFixed(1)
  );

  // Concept 6: Risk Scoring & Classification (Slide 5)
  // 0–30: Low
  // 31–60: Moderate
  // 61–80: High
  // 81–100: Very High
  let riskBand: FiveFactorRiskModel['riskBand'] = 'Moderate';
  let riskRange = '31–60';
  let colorBandHex = '#E5A93C'; // Slide 5 Moderate Amber

  if (totalScore <= 30.0) {
    riskBand = 'Low';
    riskRange = '0–30';
    colorBandHex = '#2E9D64'; // Slide 5 Green
  } else if (totalScore <= 60.0) {
    riskBand = 'Moderate';
    riskRange = '31–60';
    colorBandHex = '#E5A93C'; // Slide 5 Yellow/Orange
  } else if (totalScore <= 80.0) {
    riskBand = 'High';
    riskRange = '61–80';
    colorBandHex = '#E5633C'; // Slide 5 Orange/Coral
  } else {
    riskBand = 'Very High';
    riskRange = '81–100';
    colorBandHex = '#D9453B'; // Slide 5 Red/Crimson
  }

  const verdictText = `A score of ${totalScore} falls in the ${riskBand} Risk band`;

  const volatility: FactorDetail = {
    id: 'volatility',
    name: 'Volatility',
    shortName: 'Vol',
    rawMetricValue: `${(params.annualizedVolDecimal * 100).toFixed(1)}%`,
    rawMetricUnit: 'Annualized Std Dev',
    normalizedScore: volRiskValue,
    weight: WEIGHT_VOLATILITY,
    weightPercent: '30%',
    contribution: volContribution,
    color: '#00264d', // Deep Navy
    description: 'Historical standard deviation of daily price returns.',
  };

  const liquidity: FactorDetail = {
    id: 'liquidity',
    name: 'Liquidity',
    shortName: 'Liq',
    rawMetricValue: `$${(params.avgDollarVolume / 1e6).toFixed(1)}M`,
    rawMetricUnit: 'Average Dollar Volume',
    normalizedScore: liqRiskValue,
    weight: WEIGHT_LIQUIDITY,
    weightPercent: '20%',
    contribution: liqContribution,
    color: '#00509e', // Royal Blue
    description: 'Turnover depth and market order execution capacity.',
  };

  const marketCorrelation: FactorDetail = {
    id: 'marketCorrelation',
    name: 'Market/Sector Correlation',
    shortName: 'Correlation',
    rawMetricValue: `${params.beta.toFixed(2)}x`,
    rawMetricUnit: 'Beta Sensitivity',
    normalizedScore: corrRiskValue,
    weight: WEIGHT_CORRELATION,
    weightPercent: '20%',
    contribution: corrContribution,
    color: '#007acc', // Azure Blue
    description: 'Co-movement with benchmark indices during shocks.',
  };

  const leverageDebt: FactorDetail = {
    id: 'leverageDebt',
    name: 'Leverage/Debt Ratio',
    shortName: 'Leverage',
    rawMetricValue: `${(params.debtRatio * 100).toFixed(0)}%`,
    rawMetricUnit: 'Debt-to-Asset Ratio',
    normalizedScore: levRiskValue,
    weight: WEIGHT_LEVERAGE,
    weightPercent: '15%',
    contribution: levContribution,
    color: '#e5633c', // Orange
    description: 'Balance sheet liability burden relative to capital.',
  };

  const trackRecordCredit: FactorDetail = {
    id: 'trackRecordCredit',
    name: 'Track Record/Credit Rating',
    shortName: 'Credit',
    rawMetricValue: `${(100 - params.creditRatingRisk).toFixed(0)}/100`,
    rawMetricUnit: 'Credit Quality Tier',
    normalizedScore: trackRiskValue,
    weight: WEIGHT_TRACK_RECORD,
    weightPercent: '15%',
    contribution: trackContribution,
    color: '#66a3ff', // Light Blue
    description: 'Historical financial stability and credit rating grade.',
  };

  return {
    volatility,
    liquidity,
    marketCorrelation,
    leverageDebt,
    trackRecordCredit,
    totalScore,
    riskBand,
    riskRange,
    colorBandHex,
    verdictText,
  };
}

/**
 * Price Projection & 30-Day SMA Forecast
 */
export function calculatePriceProjection(
  history: StockPricePoint[],
  annualizedVolPercent: number
): PriceProjectionPoint[] {
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
  const annualVolDecimal = annualizedVolPercent / 100.0;

  for (let d = 1; d <= 30; d++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + Math.floor(d * 1.4));

    const projectedSma = Math.max(1.0, lastSma + dailySmaSlope * d);
    const projectedPrice = Math.max(1.0, lastPrice + dailySmaSlope * d * 0.8);

    const volExpansion = annualVolDecimal * Math.sqrt(d / 252);
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
