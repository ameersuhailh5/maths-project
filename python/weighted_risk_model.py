#!/usr/bin/env python3
"""
Quantitative Risk Assessments of Investment Opportunities
A weighted-sum model that combines five risk factors into one 0–100 score.
Format matches the exact 6 slides of the project presentation.
"""

import sys
import math
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from typing import Dict, Any

# Slide 4: Weights definition
WEIGHT_VOLATILITY = 0.30
WEIGHT_LIQUIDITY = 0.20
WEIGHT_CORRELATION = 0.20
WEIGHT_LEVERAGE = 0.15
WEIGHT_TRACK_RECORD = 0.15

class WeightedRiskModel:
    def __init__(
        self,
        symbol: str,
        prices: np.ndarray,
        volumes: np.ndarray = None,
        debt_ratio: float = 0.28,
        credit_rating_penalty: float = 15.0
    ):
        self.symbol = symbol.upper()
        self.prices = np.array(prices, dtype=float)
        self.volumes = np.array(volumes, dtype=float) if volumes is not None else np.random.uniform(2e6, 8e6, size=len(prices))
        self.debt_ratio = debt_ratio
        self.credit_rating_penalty = credit_rating_penalty

    # Slide 3 & 6: Concept 1 - Statistics
    def compute_statistics(self) -> Dict[str, float]:
        if len(self.prices) < 2:
            return {"mean": 0.0, "daily_std": 0.015, "annualized_vol": 0.238}
        returns = np.diff(self.prices) / self.prices[:-1]
        mean_ret = float(np.mean(returns))
        daily_std = float(np.std(returns, ddof=1))
        annualized_vol = daily_std * math.sqrt(252.0)
        return {
            "mean": mean_ret,
            "daily_std": daily_std,
            "annualized_vol": annualized_vol
        }

    # Slide 3 & 6: Concept 2 - Probability
    def compute_probability(self) -> Dict[str, float]:
        returns = np.diff(self.prices) / self.prices[:-1]
        n = len(returns)
        if n == 0:
            return {"prob_downside": 50.0, "prob_severe_slump": 5.0}
        downside_count = np.sum(returns < 0)
        severe_count = np.sum(returns <= -0.02)
        return {
            "prob_downside": float(np.round((downside_count / n) * 100.0, 1)),
            "prob_severe_slump": float(np.round((severe_count / n) * 100.0, 1))
        }

    # Slide 3 & 6: Concept 3 - Normalization (0 = very low risk, 100 = very high risk)
    @staticmethod
    def normalize(val: float, min_val: float, max_val: float) -> float:
        if max_val == min_val:
            return 50.0
        scaled = ((val - min_val) / (max_val - min_val)) * 100.0
        return float(np.clip(round(scaled, 1), 0.0, 100.0))

    def factor_volatility(self) -> float:
        stats = self.compute_statistics()
        # 5% annual vol -> 0 risk; 50% annual vol -> 100 risk
        return self.normalize(stats["annualized_vol"], 0.05, 0.50)

    def factor_liquidity(self) -> float:
        avg_dv = float(np.mean(self.prices * self.volumes))
        log_dv = math.log10(max(10000.0, avg_dv))
        return self.normalize(9.0 - log_dv, 0.0, 3.0)

    def factor_correlation(self) -> float:
        returns = np.diff(self.prices) / self.prices[:-1]
        np.random.seed(42)
        market_returns = np.random.normal(0.0005, 0.01, size=len(returns))
        cov = np.cov(returns, market_returns)[0, 1] if len(returns) > 1 else 0.0001
        var_m = np.var(market_returns, ddof=1) if len(market_returns) > 1 else 0.0001
        beta = float(cov / var_m) if var_m > 0 else 1.0
        return self.normalize(beta, 0.3, 2.0)

    def factor_leverage(self) -> float:
        return self.normalize(self.debt_ratio, 0.10, 0.80)

    def factor_track_record(self) -> float:
        return float(np.clip(self.credit_rating_penalty, 0.0, 100.0))

    # Slide 4: Concept 4 & 5 - Percentages & Weighted Sum
    # Formula: Risk Score = Σ (Risk Value × Weight)
    def evaluate(self) -> Dict[str, Any]:
        val_vol = self.factor_volatility()
        val_liq = self.factor_liquidity()
        val_corr = self.factor_correlation()
        val_lev = self.factor_leverage()
        val_track = self.factor_track_record()

        contrib_vol = round(val_vol * WEIGHT_VOLATILITY, 2)
        contrib_liq = round(val_liq * WEIGHT_LIQUIDITY, 2)
        contrib_corr = round(val_corr * WEIGHT_CORRELATION, 2)
        contrib_lev = round(val_lev * WEIGHT_LEVERAGE, 2)
        contrib_track = round(val_track * WEIGHT_TRACK_RECORD, 2)

        total_score = round(contrib_vol + contrib_liq + contrib_corr + contrib_lev + contrib_track, 1)

        # Slide 5: Concept 6 - Risk Scoring & Risk Bands
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

        return {
            "symbol": self.symbol,
            "total_score": total_score,
            "risk_band": risk_band,
            "risk_range": risk_range,
            "color_hex": color_hex,
            "verdict": verdict,
            "factors": [
                {"name": "Volatility", "value": val_vol, "weight": 0.30, "contrib": contrib_vol, "example": f"{val_vol:.0f} × 0.30 = {contrib_vol:.1f}"},
                {"name": "Liquidity", "value": val_liq, "weight": 0.20, "contrib": contrib_liq, "example": f"{val_liq:.0f} × 0.20 = {contrib_liq:.1f}"},
                {"name": "Market/Sector Correlation", "value": val_corr, "weight": 0.20, "contrib": contrib_corr, "example": f"{val_corr:.0f} × 0.20 = {contrib_corr:.1f}"},
                {"name": "Leverage/Debt Ratio", "value": val_lev, "weight": 0.15, "contrib": contrib_lev, "example": f"{val_lev:.0f} × 0.15 = {contrib_lev:.1f}"},
                {"name": "Track Record/Credit Rating", "value": val_track, "weight": 0.15, "contrib": contrib_track, "example": f"{val_track:.0f} × 0.15 = {contrib_track:.1f}"}
            ]
        }

if __name__ == "__main__":
    sym = sys.argv[1] if len(sys.argv) > 1 else "AAPL"
    dates = pd.date_range(start="2025-01-01", periods=252, freq="B")
    np.random.seed(101)
    daily_returns = np.random.normal(0.0007, 0.018, size=252)
    prices = 150.0 * np.cumprod(1.0 + daily_returns)
    volumes = np.random.uniform(2e6, 8e6, size=252)

    model = WeightedRiskModel(symbol=sym, prices=prices, volumes=volumes)
    res = model.evaluate()

    print("=" * 65)
    print(f"      ANNRIYA RISK FINDER - 5-FACTOR WEIGHTED RISK MODEL")
    print(f" Asset: {res['symbol']} | Score: {res['total_score']} / 100")
    print(f" {res['verdict']}")
    print("=" * 65)
    for f in res["factors"]:
        print(f" {f['name']:<28} | Value: {f['value']:>5.1f} | Weight: {int(f['weight']*100)}% | {f['example']}")
    print("-" * 65)
    print(f" TOTAL WEIGHTED SCORE       | {res['total_score']:>5.1f} / 100 (100% weights)")
    print("=" * 65)
