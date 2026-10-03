#!/usr/bin/env python3
"""
Quantitative Risk Assessment of Investment Opportunities
Five-Factor Weighted-Sum Risk Model (0-100 Scale)
Implemented with Python, Pandas, NumPy, and Matplotlib.

Risk Score Formula:
  Risk Score = Σ (Factor_Value * Weight)
  
Five Factors & Weights:
  1. Volatility (30% weight)
  2. Liquidity Risk (20% weight)
  3. Market/Sector Correlation (20% weight)
  4. Leverage / Debt Ratio (15% weight)
  5. Track Record / Credit Rating (15% weight)

Risk Bands:
  -  0 – 30 : Low Risk
  - 31 – 60 : Moderate Risk
  - 61 – 80 : High Risk
  - 81 – 100: Very High Risk
"""

import math
import sys
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

# Define Model Weights
WEIGHT_VOLATILITY = 0.30
WEIGHT_LIQUIDITY = 0.20
WEIGHT_CORRELATION = 0.20
WEIGHT_LEVERAGE = 0.15
WEIGHT_TRACK_RECORD = 0.15

class WeightedRiskModel:
    def __init__(self, symbol: str, prices: np.ndarray, volumes: np.ndarray = None, debt_ratio: float = 0.4, credit_score_norm: float = 25.0):
        self.symbol = symbol
        self.prices = np.array(prices, dtype=float)
        self.volumes = np.array(volumes, dtype=float) if volumes is not None else np.random.uniform(1e6, 5e6, size=len(prices))
        self.debt_ratio = debt_ratio
        self.credit_score_norm = credit_score_norm

    def calculate_returns(self) -> np.ndarray:
        """Calculate daily percentage returns using NumPy."""
        if len(self.prices) < 2:
            return np.array([0.0])
        return np.diff(self.prices) / self.prices[:-1]

    def factor_volatility(self) -> float:
        """
        Factor 1: Volatility (Weight: 30%)
        Annualized standard deviation normalized to 0-100 scale.
        30% annualized vol maps to ~60 score, 50%+ maps to 100 score.
        """
        returns = self.calculate_returns()
        daily_std = np.std(returns, ddof=1) if len(returns) > 1 else 0.01
        annual_vol = daily_std * math.sqrt(252)
        
        # Min-max normalization: 0.05 vol = 0 score, 0.50 vol = 100 score
        score = np.clip((annual_vol - 0.05) / (0.50 - 0.05) * 100.0, 0.0, 100.0)
        return float(score)

    def factor_liquidity(self) -> float:
        """
        Factor 2: Liquidity Risk (Weight: 20%)
        Lower volume/turnover = higher liquidity risk score (0-100).
        """
        avg_dollar_volume = np.mean(self.prices * self.volumes)
        # Higher turnover = lower risk
        # $50M+ daily volume = 10 risk, < $2M daily volume = 90 risk
        log_vol = math.log10(max(10000.0, avg_dollar_volume))
        # log_vol usually between 6 ($1M) and 9 ($1B)
        score = np.clip((9.0 - log_vol) / (9.0 - 6.0) * 100.0, 0.0, 100.0)
        return float(score)

    def factor_correlation(self) -> float:
        """
        Factor 3: Market/Sector Correlation (Weight: 20%)
        Beta / Market correlation normalized to 0-100.
        """
        returns = self.calculate_returns()
        # Synthetic market returns proxy
        np.random.seed(42)
        market_returns = np.random.normal(0.0005, 0.01, size=len(returns))
        
        cov = np.cov(returns, market_returns)[0, 1] if len(returns) > 1 else 0.0001
        var_m = np.var(market_returns, ddof=1) if len(market_returns) > 1 else 0.0001
        beta = cov / var_m if var_m > 0 else 1.0
        
        # Beta 0.5 = 20 risk, Beta 2.0 = 90 risk
        score = np.clip((beta - 0.3) / (2.0 - 0.3) * 100.0, 0.0, 100.0)
        return float(score)

    def factor_leverage(self) -> float:
        """
        Factor 4: Leverage / Debt Ratio (Weight: 15%)
        Debt-to-Asset ratio mapped to 0-100 scale.
        """
        # Debt ratio 0.1 = 10 risk, Debt ratio 0.8 = 90 risk
        score = np.clip((self.debt_ratio - 0.1) / (0.8 - 0.1) * 100.0, 0.0, 100.0)
        return float(score)

    def factor_track_record(self) -> float:
        """
        Factor 5: Track Record / Credit Rating (Weight: 15%)
        Inverted credit score (AAA = 5 risk, CCC = 90 risk).
        """
        return float(np.clip(self.credit_score_norm, 0.0, 100.0))

    def evaluate_model(self) -> Dict[str, Any]:
        """
        Computes weighted sum of the 5 factors and classifies into risk band.
        """
        f_vol = self.factor_volatility()
        f_liq = self.factor_liquidity()
        f_corr = self.factor_correlation()
        f_lev = self.factor_leverage()
        f_track = self.factor_track_record()

        # Weighted Sum Calculation
        weighted_vol = f_vol * WEIGHT_VOLATILITY
        weighted_liq = f_liq * WEIGHT_LIQUIDITY
        weighted_corr = f_corr * WEIGHT_CORRELATION
        weighted_lev = f_lev * WEIGHT_LEVERAGE
        weighted_track = f_track * WEIGHT_TRACK_RECORD

        total_risk_score = weighted_vol + weighted_liq + weighted_corr + weighted_lev + weighted_track
        total_risk_score = float(np.round(total_risk_score, 1))

        # Classify into Risk Bands (Slide 5)
        if total_risk_score <= 30.0:
            risk_band = "Low Risk"
            color_code = "Green"
        elif total_risk_score <= 60.0:
            risk_band = "Moderate Risk"
            color_code = "Yellow/Orange"
        elif total_risk_score <= 80.0:
            risk_band = "High Risk"
            color_code = "Orange/Red"
        else:
            risk_band = "Very High Risk"
            color_code = "Red"

        return {
            "symbol": self.symbol,
            "overall_risk_score": total_risk_score,
            "risk_band": risk_band,
            "color_code": color_code,
            "factor_breakdown": {
                "volatility": {"normalized_score": round(f_vol, 1), "weight": WEIGHT_VOLATILITY, "contribution": round(weighted_vol, 2)},
                "liquidity": {"normalized_score": round(f_liq, 1), "weight": WEIGHT_LIQUIDITY, "contribution": round(weighted_liq, 2)},
                "market_correlation": {"normalized_score": round(f_corr, 1), "weight": WEIGHT_CORRELATION, "contribution": round(weighted_corr, 2)},
                "leverage_debt": {"normalized_score": round(f_lev, 1), "weight": WEIGHT_LEVERAGE, "contribution": round(weighted_lev, 2)},
                "track_record_credit": {"normalized_score": round(f_track, 1), "weight": WEIGHT_TRACK_RECORD, "contribution": round(weighted_track, 2)}
            }
        }

def run_cli_demo(symbol: str = "AAPL"):
    print(f"============================================================")
    print(f" Quantitative Risk Assessment of Investment Opportunities   ")
    print(f" 5-Factor Weighted-Sum Model (0-100 Score Scale)             ")
    print(f" Asset Analyzed: {symbol}                                  ")
    print(f"============================================================\n")

    # Synthetic price series with Pandas
    dates = pd.date_range(start="2025-01-01", periods=252, freq="B")
    np.random.seed(101)
    daily_returns = np.random.normal(0.0008, 0.018, size=252)
    price_path = 150.0 * np.cumprod(1.0 + daily_returns)
    volume_path = np.random.uniform(2e6, 8e6, size=252)

    df = pd.DataFrame({"Date": dates, "Close": price_path, "Volume": volume_path})
    
    model = WeightedRiskModel(symbol=symbol, prices=df["Close"].values, volumes=df["Volume"].values, debt_ratio=0.35, credit_score_norm=20.0)
    res = model.evaluate_model()

    print(f"Overall Risk Score : {res['overall_risk_score']} / 100")
    print(f"Risk Band          : {res['risk_band']} ({res['color_code']})\n")

    print(f"{'Factor':<25} | {'Raw Score (0-100)':<18} | {'Weight':<8} | {'Contribution':<12}")
    print("-" * 72)
    for factor_name, f_data in res['factor_breakdown'].items():
        print(f"{factor_name:<25} | {f_data['normalized_score']:<18} | {f_data['weight']*100:>5.0f}%   | {f_data['contribution']:>10.2f}")

    print("-" * 72)
    print(f"{'TOTAL WEIGHTED RISK SCORE':<25} | {'':<18} | {'100%':<8} | {res['overall_risk_score']:>10.1f}")

if __name__ == "__main__":
    sym = sys.argv[1] if len(sys.argv) > 1 else "AAPL"
    run_cli_demo(sym)
