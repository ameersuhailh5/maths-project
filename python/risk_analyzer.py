#!/usr/bin/env python3
"""
YieldRisk - Quantitative Stock Volatility & Interest Rate Risk Analyzer (Python Edition)
Calculates historical volatility, Value at Risk (VaR), interest rate sensitivity,
and checks real-time volatility threshold alert triggers.
"""

import math
import sys
from typing import List, Dict, Any, Tuple

class StockPricePoint:
    def __init__(self, date: str, price: float, interest_rate: float = 4.25):
        self.date = date
        self.price = price
        self.interest_rate = interest_rate

class RiskMetrics:
    def __init__(self):
        self.volatility_30d: float = 0.0
        self.volatility_90d: float = 0.0
        self.volatility_1y: float = 0.0
        self.max_drawdown: float = 0.0
        self.var_95_daily: float = 0.0
        self.var_99_daily: float = 0.0
        self.cvar_95_daily: float = 0.0
        self.rate_beta: float = 0.0
        self.duration_proxy: float = 0.0
        self.sharpe_ratio: float = 0.0
        self.overall_risk_level: str = "Moderate"
        self.is_volatility_alert: bool = False
        self.alert_message: str = ""

def calculate_risk_metrics(history: List[StockPricePoint], vol_threshold_percent: float = 25.0) -> RiskMetrics:
    """Computes quantitative risk metrics and evaluates volatility threshold alerts."""
    metrics = RiskMetrics()
    if not history or len(history) < 5:
        return metrics

    # Daily Returns & Interest Rate Changes
    daily_returns: List[float] = []
    rate_changes: List[float] = []

    for i in range(1, len(history)):
        prev_price = history[i - 1].price
        curr_price = history[i].price
        if prev_price > 0:
            daily_returns.append((curr_price - prev_price) / prev_price)

        rate_diff = (history[i].interest_rate - history[i - 1].interest_rate) * 100.0
        rate_changes.append(rate_diff)

    N = len(daily_returns)
    if N == 0:
        return metrics

    # Annualized Volatility Function
    def calc_vol(returns_slice: List[float]) -> float:
        if len(returns_slice) < 2:
            return 0.15
        mean_r = sum(returns_slice) / len(returns_slice)
        variance = sum((r - mean_r) ** 2 for r in returns_slice) / (len(returns_slice) - 1)
        return math.sqrt(variance * 252.0)

    metrics.volatility_30d = calc_vol(daily_returns[-30:]) if N >= 30 else calc_vol(daily_returns)
    metrics.volatility_90d = calc_vol(daily_returns[-90:]) if N >= 90 else calc_vol(daily_returns)
    metrics.volatility_1y = calc_vol(daily_returns)

    # Max Drawdown
    peak = history[0].price
    max_dd = 0.0
    for pt in history:
        if pt.price > peak:
            peak = pt.price
        else:
            dd = (peak - pt.price) / peak
            if dd > max_dd:
                max_dd = dd
    metrics.max_drawdown = max_dd

    # Value at Risk (VaR 95% & 99%)
    sorted_returns = sorted(daily_returns)
    idx_95 = max(0, int(N * 0.05))
    idx_99 = max(0, int(N * 0.01))

    metrics.var_95_daily = abs(sorted_returns[idx_95])
    metrics.var_99_daily = abs(sorted_returns[idx_99])

    cvar_slice = sorted_returns[:max(1, idx_95)]
    metrics.cvar_95_daily = abs(sum(cvar_slice) / len(cvar_slice))

    # Interest Rate Sensitivity (Rate Beta)
    mean_ret = sum(daily_returns) / N
    mean_rate = sum(rate_changes) / N
    cov_stock_rate = sum((daily_returns[i] - mean_ret) * (rate_changes[i] - mean_rate) for i in range(N))
    var_rate = sum((rate_changes[i] - mean_rate) ** 2 for i in range(N))

    metrics.rate_beta = (cov_stock_rate / var_rate) * 100.0 if var_rate > 0 else -0.18
    metrics.duration_proxy = abs(metrics.rate_beta * 2.5)

    # Sharpe Ratio (4.25% Risk Free Rate)
    annual_return = ((1.0 + mean_ret) ** 252.0) - 1.0
    metrics.sharpe_ratio = (annual_return - 0.0425) / metrics.volatility_1y if metrics.volatility_1y > 0 else 0.0

    # Risk Level
    vol_pct = metrics.volatility_1y * 100.0
    if vol_pct > 35.0:
        metrics.overall_risk_level = "High"
    elif vol_pct > 22.0:
        metrics.overall_risk_level = "Moderate"
    else:
        metrics.overall_risk_level = "Low"

    # Threshold Check
    short_vol_pct = metrics.volatility_30d * 100.0
    if short_vol_pct >= vol_threshold_percent:
        metrics.is_volatility_alert = True
        metrics.alert_message = (
            f"ALERT: 30-Day Historical Volatility ({short_vol_pct:.2f}%) "
            f"exceeds user threshold ({vol_threshold_percent:.2f}%)."
        )

    return metrics

def run_demo(symbol: str = "AAPL", threshold: float = 25.0):
    import random
    print(f"=== YieldRisk Python Terminal Analysis for {symbol} ===")
    print(f"User Volatility Threshold: {threshold:.2f}%\n")

    # Generate synthetic price series
    history = []
    price = 150.0
    rate = 4.10
    for day in range(252):
        price *= 1.0 + random.uniform(-0.02, 0.02)
        rate += random.uniform(-0.02, 0.02)
        history.append(StockPricePoint(f"2025-Day-{day+1}", price, rate))

    metrics = calculate_risk_metrics(history, vol_threshold_percent=threshold)

    print(f"Current Stock Price:        ${history[-1].price:.2f}")
    print(f"30-Day Volatility (HV):      {metrics.volatility_30d * 100:.2f}%")
    print(f"1-Year Volatility (HV):      {metrics.volatility_1y * 100:.2f}%")
    print(f"Max Drawdown:               -{metrics.max_drawdown * 100:.2f}%")
    print(f"95% Daily VaR:              -{metrics.var_95_daily * 100:.2f}%")
    print(f"Interest Rate Duration:     {metrics.duration_proxy:.2f} years")
    print(f"Sharpe Ratio:                {metrics.sharpe_ratio:.2f}")
    print(f"Overall Risk Rating:         {metrics.overall_risk_level}")

    if metrics.is_volatility_alert:
        print(f"\n[!] THRESHOLD ALERT: {metrics.alert_message}")
    else:
        print(f"\n[OK] Volatility within normal threshold ({threshold:.2f}%).")

if __name__ == "__main__":
    ticker = sys.argv[1] if len(sys.argv) > 1 else "AAPL"
    thresh = float(sys.argv[2]) if len(sys.argv) > 2 else 25.0
    run_demo(ticker, thresh)
