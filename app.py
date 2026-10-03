#!/usr/bin/env python3
"""
===============================================================================
                     ANNRIYA RISK FINDER (Python Edition)
         Quantitative Risk Assessments of Investment Opportunities
===============================================================================

A weighted-sum model that combines five risk factors into one 0–100 score.

Technical Tools (Slide 2):
  - Python     : Model implementation
  - Pandas     : Data handling
  - NumPy      : Mathematical calculations
  - Matplotlib : Risk visualization

Mathematical Foundations (Slide 3 & Slide 6):
  1. Statistics   : Analyses investment data and measures factors like volatility
  2. Probability  : Represents the likelihood of uncertain risk events
  3. Normalization: Puts different factors on a common 0–100 scale (0 = very low risk, 100 = very high risk)
  4. Percentages  : Represent the weight given to each risk factor (Weights total 100%)
  5. Weighted Sum : Combines all factors by importance into overall risk:
                    Risk Score = Σ (Risk Value × Weight)
  6. Risk Scoring : Turns the result into one 0–100 score, then classifies it into:
                    - Low       (0–30)
                    - Moderate  (31–60)
                    - High      (61–80)
                    - Very High (81–100)
"""

import sys
import json
import math
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple

# Slide 4: Weights Definition (Sum = 100%)
WEIGHT_VOLATILITY = 0.30
WEIGHT_LIQUIDITY = 0.20
WEIGHT_CORRELATION = 0.20
WEIGHT_LEVERAGE = 0.15
WEIGHT_TRACK_RECORD = 0.15

INDIAN_STOCKS_PRESETS = {
    "RELIANCE": {"name": "Reliance Industries Ltd.", "price": 2985.40, "vol": 0.015, "debt": 0.34, "credit": 14.0, "currency": "₹", "exchange": "NSE"},
    "TCS": {"name": "Tata Consultancy Services Ltd.", "price": 4192.50, "vol": 0.013, "debt": 0.08, "credit": 8.0, "currency": "₹", "exchange": "NSE"},
    "INFY": {"name": "Infosys Limited", "price": 1918.20, "vol": 0.017, "debt": 0.12, "credit": 12.0, "currency": "₹", "exchange": "NSE"},
    "HDFCBANK": {"name": "HDFC Bank Limited", "price": 1756.80, "vol": 0.014, "debt": 0.52, "credit": 15.0, "currency": "₹", "exchange": "NSE"},
    "TATAMOTORS": {"name": "Tata Motors Limited", "price": 968.75, "vol": 0.024, "debt": 0.45, "credit": 28.0, "currency": "₹", "exchange": "NSE"},
    "ICICIBANK": {"name": "ICICI Bank Limited", "price": 1278.30, "vol": 0.015, "debt": 0.50, "credit": 16.0, "currency": "₹", "exchange": "NSE"},
    "ITC": {"name": "ITC Limited", "price": 512.40, "vol": 0.011, "debt": 0.04, "credit": 10.0, "currency": "₹", "exchange": "NSE"},
    "BHARTIARTL": {"name": "Bharti Airtel Limited", "price": 1712.50, "vol": 0.016, "debt": 0.42, "credit": 22.0, "currency": "₹", "exchange": "NSE"},
    "LT": {"name": "Larsen & Toubro Ltd.", "price": 3645.00, "vol": 0.016, "debt": 0.38, "credit": 18.0, "currency": "₹", "exchange": "NSE"},
    "NIFTY50": {"name": "NIFTY 50 Benchmark Index", "price": 25420.50, "vol": 0.010, "debt": 0.25, "credit": 10.0, "currency": "₹", "exchange": "NSE"},
}

class AnnriyaRiskFinder:
    def __init__(
        self,
        symbol: str = "RELIANCE",
        prices: List[float] = None,
        volumes: List[float] = None,
        debt_ratio: float = None,
        credit_rating_penalty: float = None
    ):
        self.symbol = symbol.upper()
        
        preset = INDIAN_STOCKS_PRESETS.get(self.symbol, None)
        if preset:
            self.currency = preset["currency"]
            self.exchange = preset["exchange"]
            self.debt_ratio = debt_ratio if debt_ratio is not None else preset["debt"]
            self.credit_rating_penalty = credit_rating_penalty if credit_rating_penalty is not None else preset["credit"]
            self.base_price = preset["price"]
            self.base_vol = preset["vol"]
        else:
            self.currency = "$"
            self.exchange = "NASDAQ"
            self.debt_ratio = debt_ratio if debt_ratio is not None else 0.28
            self.credit_rating_penalty = credit_rating_penalty if credit_rating_penalty is not None else 15.0
            self.base_price = 150.0
            self.base_vol = 0.018

        if prices and len(prices) > 2:
            self.prices = prices
            self.volumes = volumes if volumes else [5e6] * len(prices)
            self.dates = [f"Day-{i+1}" for i in range(len(prices))]
        else:
            self.dates, self.prices, self.volumes = self._generate_sample_series()

    def _generate_sample_series(self) -> Tuple[List[str], List[float], List[float]]:
        """Generates 252 trading days of price and volume data."""
        random.seed(abs(hash(self.symbol)) % 10000)
        start_date = datetime(2025, 1, 2)
        dates, prices, volumes = [], [], []

        current_price = self.base_price
        vol = self.base_vol

        for i in range(252):
            d = start_date + timedelta(days=int(i * 1.4))
            dates.append(d.strftime("%Y-%m-%d"))

            daily_return = random.gauss(0.0006, vol)
            current_price = max(2.0, current_price * (1.0 + daily_return))
            prices.append(round(current_price, 2))
            volumes.append(round(random.uniform(2e6, 8e6), 0))

        return dates, prices, volumes

    # =========================================================================
    # Concept 1: STATISTICS (Slide 3 & Slide 6)
    # =========================================================================
    def calculate_returns(self) -> List[float]:
        """Calculates daily returns: r_t = (P_t - P_{t-1}) / P_{t-1}."""
        returns = []
        for i in range(1, len(self.prices)):
            p0 = self.prices[i - 1]
            p1 = self.prices[i]
            if p0 > 0:
                returns.append((p1 - p0) / p0)
        return returns if returns else [0.0]

    def compute_statistics(self) -> Dict[str, float]:
        returns = self.calculate_returns()
        n = len(returns)
        if n < 2:
            return {"mean": 0.0, "daily_std": 0.015, "annualized_vol": 0.238}

        mean_ret = sum(returns) / n
        variance = sum((r - mean_ret) ** 2 for r in returns) / (n - 1)
        daily_std = math.sqrt(variance)
        annualized_vol = daily_std * math.sqrt(252.0)

        return {
            "mean": mean_ret,
            "daily_std": daily_std,
            "annualized_vol": annualized_vol
        }

    # =========================================================================
    # Concept 2: PROBABILITY (Slide 3 & Slide 6)
    # =========================================================================
    def compute_probabilities(self) -> Dict[str, float]:
        returns = self.calculate_returns()
        n = len(returns)
        if n == 0:
            return {"prob_downside_day": 50.0, "prob_severe_slump": 5.0}

        downside_count = sum(1 for r in returns if r < 0)
        severe_count = sum(1 for r in returns if r <= -0.02)

        return {
            "prob_downside_day": round((downside_count / n) * 100.0, 1),
            "prob_severe_slump": round((severe_count / n) * 100.0, 1)
        }

    # =========================================================================
    # Concept 3: NORMALIZATION (Slide 3 & Slide 6)
    # =========================================================================
    @staticmethod
    def normalize(value: float, min_val: float, max_val: float) -> float:
        if max_val == min_val:
            return 50.0
        scaled = ((value - min_val) / (max_val - min_val)) * 100.0
        return max(0.0, min(100.0, round(scaled, 1)))

    def factor_volatility(self) -> float:
        stats = self.compute_statistics()
        return self.normalize(stats["annualized_vol"], 0.05, 0.50)

    def factor_liquidity(self) -> float:
        dollar_vols = [p * v for p, v in zip(self.prices, self.volumes)]
        avg_dv = sum(dollar_vols) / len(dollar_vols) if dollar_vols else 1e7
        log_dv = math.log10(max(10000.0, avg_dv))
        return self.normalize(9.0 - log_dv, 0.0, 3.0)

    def factor_market_correlation(self) -> float:
        returns = self.calculate_returns()
        n = len(returns)
        if n < 2:
            return 45.0

        random.seed(42)
        market_returns = [random.gauss(0.0005, 0.01) for _ in range(n)]
        mean_stock = sum(returns) / n
        mean_mkt = sum(market_returns) / n

        cov = sum((returns[i] - mean_stock) * (market_returns[i] - mean_mkt) for i in range(n)) / (n - 1)
        var_mkt = sum((m - mean_mkt) ** 2 for m in market_returns) / (n - 1)
        beta = cov / var_mkt if var_mkt > 0 else 1.0

        return self.normalize(beta, 0.3, 2.0)

    def factor_leverage(self) -> float:
        return self.normalize(self.debt_ratio, 0.10, 0.80)

    def factor_track_record(self) -> float:
        return max(0.0, min(100.0, float(self.credit_rating_penalty)))

    # =========================================================================
    # Concept 4 & 5: PERCENTAGES & WEIGHTED SUM (Slide 4)
    # =========================================================================
    def calculate_weighted_sum(self) -> Dict[str, Any]:
        val_vol = self.factor_volatility()
        val_liq = self.factor_liquidity()
        val_corr = self.factor_market_correlation()
        val_lev = self.factor_leverage()
        val_track = self.factor_track_record()

        contrib_vol = round(val_vol * WEIGHT_VOLATILITY, 2)
        contrib_liq = round(val_liq * WEIGHT_LIQUIDITY, 2)
        contrib_corr = round(val_corr * WEIGHT_CORRELATION, 2)
        contrib_lev = round(val_lev * WEIGHT_LEVERAGE, 2)
        contrib_track = round(val_track * WEIGHT_TRACK_RECORD, 2)

        total_score = round(contrib_vol + contrib_liq + contrib_corr + contrib_lev + contrib_track, 1)

        # Concept 6: RISK SCORING AND RISK BANDS (Slide 5)
        if total_score <= 30.0:
            risk_band = "Low"
            risk_range = "0–30"
            color_hex = "#2E9D64"
        elif total_score <= 60.0:
            risk_band = "Moderate"
            risk_range = "31–60"
            color_hex = "#E5A93C"
        elif total_score <= 80.0:
            risk_band = "High"
            risk_range = "61–80"
            color_hex = "#E5633C"
        else:
            risk_band = "Very High"
            risk_range = "81–100"
            color_hex = "#D9453B"

        verdict = f"A score of {total_score} falls in the {risk_band} Risk band"
        stats = self.compute_statistics()
        probs = self.compute_probabilities()

        return {
            "title": "Quantitative Risk Assessments of Investment Opportunities",
            "model": "A weighted-sum model that combines five risk factors into one 0–100 score",
            "symbol": self.symbol,
            "currency": self.currency,
            "exchange": self.exchange,
            "current_price": self.prices[-1],
            "formula": "Risk Score = Σ (Risk Value × Weight)",
            "statistics": {
                "annualized_volatility_pct": round(stats["annualized_vol"] * 100.0, 1),
                "daily_std_pct": round(stats["daily_std"] * 100.0, 2),
            },
            "probability": probs,
            "five_factors": [
                {
                    "factor": "Volatility",
                    "risk_value": val_vol,
                    "weight": WEIGHT_VOLATILITY,
                    "weight_pct": "30%",
                    "contribution": contrib_vol,
                    "formula_example": f"{val_vol:.0f} × 0.30 = {contrib_vol:.1f}"
                },
                {
                    "factor": "Liquidity",
                    "risk_value": val_liq,
                    "weight": WEIGHT_LIQUIDITY,
                    "weight_pct": "20%",
                    "contribution": contrib_liq,
                    "formula_example": f"{val_liq:.0f} × 0.20 = {contrib_liq:.1f}"
                },
                {
                    "factor": "Market/Sector Correlation",
                    "risk_value": val_corr,
                    "weight": WEIGHT_CORRELATION,
                    "weight_pct": "20%",
                    "contribution": contrib_corr,
                    "formula_example": f"{val_corr:.0f} × 0.20 = {contrib_corr:.1f}"
                },
                {
                    "factor": "Leverage/Debt Ratio",
                    "risk_value": val_lev,
                    "weight": WEIGHT_LEVERAGE,
                    "weight_pct": "15%",
                    "contribution": contrib_lev,
                    "formula_example": f"{val_lev:.0f} × 0.15 = {contrib_lev:.1f}"
                },
                {
                    "factor": "Track Record/Credit Rating",
                    "risk_value": val_track,
                    "weight": WEIGHT_TRACK_RECORD,
                    "weight_pct": "15%",
                    "contribution": contrib_track,
                    "formula_example": f"{val_track:.0f} × 0.15 = {contrib_track:.1f}"
                }
            ],
            "total_score": total_score,
            "risk_band": risk_band,
            "risk_range": risk_range,
            "color_hex": color_hex,
            "verdict": verdict,
        }

def main():
    ticker = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "RELIANCE"
    app = AnnriyaRiskFinder(symbol=ticker)
    result = app.calculate_weighted_sum()

    if "--json" in sys.argv:
        print(json.dumps(result, indent=2))
        return

    print("=" * 75)
    print(f"               ANNRIYA RISK FINDER - 5-FACTOR RISK MODEL")
    print(f"             {result['title']}")
    print(f" Asset Analyzed: {result['symbol']} ({result['exchange']}) | Price: {result['currency']}{result['current_price']:.2f}")
    print("=" * 75)
    print(f" Formula: {result['formula']}\n")
    print(f" {'Risk Factor':<28} | {'Risk Value':<10} | {'Weight':<8} | {'Contribution':<12}")
    print("-" * 75)
    for f in result["five_factors"]:
        print(f" {f['factor']:<28} | {f['risk_value']:>8.1f}   | {f['weight_pct']:>6}   | {f['formula_example']:>12}")
    print("-" * 75)
    print(f" TOTAL WEIGHTED RISK SCORE   | {'':<10} | {'100%':<8} | {result['total_score']:>12.1f} / 100")
    print("=" * 75)
    print(f" VERDICT: {result['verdict']}")
    print(f" CLASSIFICATION BAND: {result['risk_band']} Risk ({result['risk_range']})")
    print("=" * 75)

if __name__ == "__main__":
    main()
