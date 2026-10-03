import {
  StockPricePoint,
  StatisticalFoundations,
  FactorDetail,
  FiveFactorRiskModel,
  PriceProjectionPoint,
} from '../types/stock';

/**
 * 5-Factor Model Weights:
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
 * Statistics and Probability Foundations
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

  // Mean Daily Return: r_bar = (1/N) * Σ r_t
  const sumReturns = returns.reduce((acc, r) => acc + r, 0);
  const meanDailyReturn = sumReturns / N;

  // Daily Standard Deviation (Sample Volatility): σ = sqrt( (1 / (N - 1)) * Σ (r_t - r_bar)^2 )
  let varianceSum = 0;
  for (const r of returns) {
    varianceSum += Math.pow(r - meanDailyReturn, 2);
  }
  const dailyVariance = N > 1 ? varianceSum / (N - 1) : 0;
  const dailyStandardDeviation = Math.sqrt(dailyVariance);

  // Annualized Volatility: σ_annual = σ_daily * sqrt(252)
  const annualizedVolatility = dailyStandardDeviation * Math.sqrt(252);

  // Downside Probability: P(r_t < 0) = Count(r_t < 0) / N
  const downsideDaysCount = returns.filter((r) => r < 0).length;
  const probabilityDownsideDay = Number(((downsideDaysCount / N) * 100).toFixed(1));

  // Severe Slump Probability: P(r_t <= -2%)
  const severeSlumpDays = returns.filter((r) => r <= -0.02).length;
  const probabilitySevereSlump = Number(((severeSlumpDays / N) * 100).toFixed(1));

  // Max Drawdown calculation
  let peak = history[0].price;
  let maxDrawdown = 0;
  for (const p of history) {
    if (p.price > peak) {
      peak = p.price;
    }
    const dd = (peak - p.price) / peak;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }
  }

  return {
    stats: {
      sampleSize: N,
      meanDailyReturn,
      dailyStandardDeviation,
      annualizedVolatility: Number((annualizedVolatility * 100).toFixed(1)),
      probabilityDownsideDay,
      probabilitySevereSlump,
      maxDrawdownPercent: Number((maxDrawdown * 100).toFixed(1)),
    },
    returns,
  };
}

/**
 * Normalization: Converts raw financial units into a common 0–100 scale:
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
 * 5-Factor Risk Model Calculation:
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
  const logVol = Math.log10(Math.max(10000, params.avgDollarVolume));
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

  // Weighted Sum -> Risk Score = Σ (Risk Value × Weight)
  const totalScore = Number(
    (volContribution + liqContribution + corrContribution + levContribution + trackContribution).toFixed(1)
  );

  // Risk Scoring & Classification
  // 0–30: Low
  // 31–60: Moderate
  // 61–80: High
  // 81–100: Very High
  let riskBand: FiveFactorRiskModel['riskBand'] = 'Moderate';
  let riskRange = '31–60';
  let colorBandHex = '#f59e0b'; // Amber

  if (totalScore <= 30.0) {
    riskBand = 'Low';
    riskRange = '0–30';
    colorBandHex = '#10b981'; // Emerald
  } else if (totalScore <= 60.0) {
    riskBand = 'Moderate';
    riskRange = '31–60';
    colorBandHex = '#f59e0b'; // Amber
  } else if (totalScore <= 80.0) {
    riskBand = 'High';
    riskRange = '61–80';
    colorBandHex = '#f97316'; // Orange
  } else {
    riskBand = 'Very High';
    riskRange = '81–100';
    colorBandHex = '#ef4444'; // Red
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
    color: '#3b82f6',
    description: 'Historical price fluctuation based on standard deviation of daily returns',
  };

  const liquidity: FactorDetail = {
    id: 'liquidity',
    name: 'Liquidity',
    shortName: 'Liq',
    rawMetricValue: `$${(params.avgDollarVolume / 1e6).toFixed(1)}M/day`,
    rawMetricUnit: 'Avg Daily Volume',
    normalizedScore: liqRiskValue,
    weight: WEIGHT_LIQUIDITY,
    weightPercent: '20%',
    contribution: liqContribution,
    color: '#06b6d4',
    description: 'Ease of buying/selling shares without causing severe price slippage',
  };

  const marketCorrelation: FactorDetail = {
    id: 'marketCorrelation',
    name: 'Market / Sector Correlation',
    shortName: 'Corr',
    rawMetricValue: `${params.beta.toFixed(2)} Beta`,
    rawMetricUnit: 'Beta relative to index',
    normalizedScore: corrRiskValue,
    weight: WEIGHT_CORRELATION,
    weightPercent: '20%',
    contribution: corrContribution,
    color: '#6366f1',
    description: 'Sensitivity of asset returns to broad equity market and sector swings',
  };

  const leverageDebt: FactorDetail = {
    id: 'leverageDebt',
    name: 'Leverage / Debt Ratio',
    shortName: 'Lev',
    rawMetricValue: `${(params.debtRatio * 100).toFixed(0)}% Debt/Cap`,
    rawMetricUnit: 'Total Debt to Capitalization',
    normalizedScore: levRiskValue,
    weight: WEIGHT_LEVERAGE,
    weightPercent: '15%',
    contribution: levContribution,
    color: '#f97316',
    description: 'Financial solvency and exposure to interest obligations or refinancing risk',
  };

  const trackRecordCredit: FactorDetail = {
    id: 'trackRecordCredit',
    name: 'Track Record / Credit Rating',
    shortName: 'Credit',
    rawMetricValue: params.creditRatingRisk < 20 ? 'AAA / Strong' : params.creditRatingRisk < 45 ? 'BBB / Investment' : 'Speculative',
    rawMetricUnit: 'Credit Quality Tier',
    normalizedScore: trackRiskValue,
    weight: WEIGHT_TRACK_RECORD,
    weightPercent: '15%',
    contribution: trackContribution,
    color: '#8b5cf6',
    description: 'Operational history, management stability, and bondholder default probability',
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
 * 30-Day Simple Moving Average (SMA) and Forecast Projection
 */
export function calculatePriceProjection(
  history: StockPricePoint[],
  annualizedVolPercent: number
): PriceProjectionPoint[] {
  if (!history || history.length === 0) return [];

  const points: PriceProjectionPoint[] = [];
  const windowSize = 30;

  // Calculate 30-day SMA for historical points
  for (let i = 0; i < history.length; i++) {
    const pt = history[i];
    let sma: number | undefined = undefined;

    if (i >= windowSize - 1) {
      let sum = 0;
      for (let j = i - windowSize + 1; j <= i; j++) {
        sum += history[j].price;
      }
      sma = Number((sum / windowSize).toFixed(2));
    }

    points.push({
      date: pt.date,
      actualPrice: pt.price,
      sma30: sma,
      isForecast: false,
    });
  }

  // 30-Day Forward Forecast
  const lastPoint = history[history.length - 1];
  const lastPrice = lastPoint.price;
  const lastDate = new Date(lastPoint.date);
  const dailyVol = (annualizedVolPercent / 100.0) / Math.sqrt(252);

  let currentForecast = lastPrice;

  // Last known 30 prices for rolling SMA into forecast
  const rollingWindow: number[] = history.slice(-windowSize).map((p) => p.price);

  for (let step = 1; step <= 30; step++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + Math.floor(step * 1.4));
    if (forecastDate.getDay() === 0 || forecastDate.getDay() === 6) continue;

    const pseudoRand = Math.sin(step * 12.9898) * 0.5;
    const projectedChange = pseudoRand * dailyVol;
    currentForecast = Math.max(1.0, currentForecast * (1 + projectedChange));

    rollingWindow.shift();
    rollingWindow.push(currentForecast);
    const rollingSma = rollingWindow.reduce((a, b) => a + b, 0) / rollingWindow.length;

    const zScore = 1.96; // 95% Confidence Interval
    const timeFactor = Math.sqrt(step);
    const margin = lastPrice * dailyVol * timeFactor * zScore;

    points.push({
      date: forecastDate.toISOString().split('T')[0],
      projectedPrice: Number(currentForecast.toFixed(2)),
      sma30: Number(rollingSma.toFixed(2)),
      upperConfidence: Number((currentForecast + margin).toFixed(2)),
      lowerConfidence: Number(Math.max(0.1, currentForecast - margin).toFixed(2)),
      isForecast: true,
    });
  }

  return points;
}
