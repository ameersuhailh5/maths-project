#!/usr/bin/env python3
"""
Quantitative Risk Assessments of Investment Opportunities
A weighted-sum model that combines five risk factors into one 0–100 score.
"""

import sys
import math
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from typing import Dict, Any

# Weights definition
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

    # Concept 1: Statistics
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

    # Concept 2: Probability
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

    # Concept 3: Normalization
    @staticmethod
    def normalize(value: float, min_val: float, max_val: float) -> float:
        if max_val == min_val:
            return 50.0
        scaled = ((value - min_val) / (max_val - min_val)) * 100.0
        return float(np.clip(scaled, 0.0, 100.0))

    def evaluate_factors(self) -> Dict[str, Dict[str, float]]:
        stats = self.compute_statistics()
        ann_vol = stats["annualized_vol"]
        val_vol = self.normalize(ann_vol, 0.05, 0.50)

        dollar_vol = float(np.mean(self.volumes) * self.prices[-1])
        log_v = math.log10(max(10000, dollar_vol))
        val_liq = self.normalize(9.0 - log_v, 0.0, 3.0)

        val_corr = self.normalize(1.05, 0.3, 2.0)
        val_lev = self.normalize(self.debt_ratio, 0.10, 0.80)
        val_track = float(np.clip(self.credit_rating_penalty, 0.0, 100.0))

        factors = {
            "volatility": {
                "name": "Volatility",
                "risk_value": round(val_vol, 1),
                "weight": WEIGHT_VOLATILITY,
                "weight_pct": "30%",
                "contribution": round(val_vol * WEIGHT_VOLATILITY, 2),
            },
            "liquidity": {
                "name": "Liquidity",
                "risk_value": round(val_liq, 1),
                "weight": WEIGHT_LIQUIDITY,
                "weight_pct": "20%",
                "contribution": round(val_liq * WEIGHT_LIQUIDITY, 2),
            },
            "market_correlation": {
                "name": "Market Correlation",
                "risk_value": round(val_corr, 1),
                "weight": WEIGHT_CORRELATION,
                "weight_pct": "20%",
                "contribution": round(val_corr * WEIGHT_CORRELATION, 2),
            },
            "leverage_debt": {
                "name": "Leverage / Debt",
                "risk_value": round(val_lev, 1),
                "weight": WEIGHT_LEVERAGE,
                "weight_pct": "15%",
                "contribution": round(val_lev * WEIGHT_LEVERAGE, 2),
            },
            "track_record": {
                "name": "Track Record",
                "risk_value": round(val_track, 1),
                "weight": WEIGHT_TRACK_RECORD,
                "weight_pct": "15%",
                "contribution": round(val_track * WEIGHT_TRACK_RECORD, 2),
            },
        }
        return factors

    # Concept 4 & 5: Percentages and Weighted Sum
    def calculate_risk_score(self) -> Dict[str, Any]:
        factors = self.evaluate_factors()
        total_score = round(sum(f["contribution"] for f in factors.values()), 1)

        # Concept 6: Risk Scoring & Classification
        if total_score <= 30.0:
            band = "Low"
            range_desc = "0–30"
        elif total_score <= 60.0:
            band = "Moderate"
            range_desc = "31–60"
        elif total_score <= 80.0:
            band = "High"
            range_desc = "61–80"
        else:
            band = "Very High"
            range_desc = "81–100"

        return {
            "symbol": self.symbol,
            "total_score": total_score,
            "risk_band": band,
            "risk_range": range_desc,
            "verdict": f"A score of {total_score} falls in the {band} Risk band",
            "factors": factors
        }

if __name__ == "__main__":
    np.random.seed(42)
    fake_prices = 100 * np.exp(np.cumsum(np.random.normal(0.0005, 0.015, 252)))
    model = WeightedRiskModel("RELIANCE", fake_prices)
    res = model.calculate_risk_score()
    print("Annriya Risk Finder Score:", res["total_score"], "|", res["verdict"])
