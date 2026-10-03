import React, { useState } from 'react';
import { X, Copy, Check, Code2, Terminal } from 'lucide-react';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PYTHON_CODE = `#!/usr/bin/env python3
"""
Quantitative Risk Assessments of Investment Opportunities
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
  -  0 – 30 : Low Risk (Green)
  - 31 – 60 : Moderate Risk (Yellow/Orange)
  - 61 – 80 : High Risk (Orange/Coral)
  - 81 – 100: Very High Risk (Red/Crimson)
"""

import math
import sys
import numpy as np
import pandas as pd

WEIGHT_VOLATILITY = 0.30
WEIGHT_LIQUIDITY = 0.20
WEIGHT_CORRELATION = 0.20
WEIGHT_LEVERAGE = 0.15
WEIGHT_TRACK_RECORD = 0.15

class WeightedRiskModel:
    def __init__(self, symbol: str, prices: np.ndarray, volumes: np.ndarray = None, debt_ratio: float = 0.35, credit_score_norm: float = 25.0):
        self.symbol = symbol
        self.prices = np.array(prices, dtype=float)
        self.volumes = np.array(volumes, dtype=float) if volumes is not None else np.random.uniform(1e6, 5e6, size=len(prices))
        self.debt_ratio = debt_ratio
        self.credit_score_norm = credit_score_norm

    def calculate_returns(self) -> np.ndarray:
        if len(self.prices) < 2:
            return np.array([0.0])
        return np.diff(self.prices) / self.prices[:-1]

    def factor_volatility(self) -> float:
        returns = self.calculate_returns()
        daily_std = np.std(returns, ddof=1) if len(returns) > 1 else 0.01
        annual_vol = daily_std * math.sqrt(252)
        score = np.clip((annual_vol - 0.05) / (0.50 - 0.05) * 100.0, 0.0, 100.0)
        return float(score)

    def factor_liquidity(self) -> float:
        avg_dollar_volume = np.mean(self.prices * self.volumes)
        log_vol = math.log10(max(10000.0, avg_dollar_volume))
        score = np.clip((9.0 - log_vol) / (9.0 - 6.0) * 100.0, 0.0, 100.0)
        return float(score)

    def factor_correlation(self) -> float:
        returns = self.calculate_returns()
        np.random.seed(42)
        market_returns = np.random.normal(0.0005, 0.01, size=len(returns))
        cov = np.cov(returns, market_returns)[0, 1] if len(returns) > 1 else 0.0001
        var_m = np.var(market_returns, ddof=1) if len(market_returns) > 1 else 0.0001
        beta = cov / var_m if var_m > 0 else 1.0
        score = np.clip((beta - 0.3) / (2.0 - 0.3) * 100.0, 0.0, 100.0)
        return float(score)

    def factor_leverage(self) -> float:
        score = np.clip((self.debt_ratio - 0.1) / (0.8 - 0.1) * 100.0, 0.0, 100.0)
        return float(score)

    def factor_track_record(self) -> float:
        return float(np.clip(self.credit_score_norm, 0.0, 100.0))

    def evaluate_model(self) -> dict:
        f_vol = self.factor_volatility()
        f_liq = self.factor_liquidity()
        f_corr = self.factor_correlation()
        f_lev = self.factor_leverage()
        f_track = self.factor_track_record()

        c_vol = f_vol * WEIGHT_VOLATILITY
        c_liq = f_liq * WEIGHT_LIQUIDITY
        c_corr = f_corr * WEIGHT_CORRELATION
        c_lev = f_lev * WEIGHT_LEVERAGE
        c_track = f_track * WEIGHT_TRACK_RECORD

        total_score = float(np.round(c_vol + c_liq + c_corr + c_lev + c_track, 1))

        if total_score <= 30.0:
            risk_band = "Low Risk"
        elif total_score <= 60.0:
            risk_band = "Moderate Risk"
        elif total_score <= 80.0:
            risk_band = "High Risk"
        else:
            risk_band = "Very High Risk"

        return {
            "symbol": self.symbol,
            "overall_risk_score": total_score,
            "risk_band": risk_band,
            "factor_breakdown": {
                "volatility": {"normalized_score": round(f_vol, 1), "weight": WEIGHT_VOLATILITY, "contribution": round(c_vol, 2)},
                "liquidity": {"normalized_score": round(f_liq, 1), "weight": WEIGHT_LIQUIDITY, "contribution": round(c_liq, 2)},
                "market_correlation": {"normalized_score": round(f_corr, 1), "weight": WEIGHT_CORRELATION, "contribution": round(c_corr, 2)},
                "leverage_debt": {"normalized_score": round(f_lev, 1), "weight": WEIGHT_LEVERAGE, "contribution": round(c_lev, 2)},
                "track_record_credit": {"normalized_score": round(f_track, 1), "weight": WEIGHT_TRACK_RECORD, "contribution": round(c_track, 2)}
            }
        }

if __name__ == "__main__":
    sym = sys.argv[1] if len(sys.argv) > 1 else "AAPL"
    dates = pd.date_range(start="2025-01-01", periods=252, freq="B")
    np.random.seed(101)
    daily_returns = np.random.normal(0.0008, 0.018, size=252)
    price_path = 150.0 * np.cumprod(1.0 + daily_returns)
    volume_path = np.random.uniform(2e6, 8e6, size=252)

    df = pd.DataFrame({"Date": dates, "Close": price_path, "Volume": volume_path})
    model = WeightedRiskModel(symbol=sym, prices=df["Close"].values, volumes=df["Volume"].values)
    res = model.evaluate_model()

    print(f"Overall Risk Score : {res['overall_risk_score']} / 100")
    print(f"Risk Band          : {res['risk_band']}")
`;

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#001f3f] border border-[#00509e] rounded-2xl w-full max-w-3xl p-6 space-y-4 shadow-2xl text-white">
        
        <div className="flex items-center justify-between pb-3 border-b border-[#00509e]">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#007acc]" />
            <h3 className="font-bold text-base">Python Risk Engine (Pandas / NumPy / Matplotlib)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#66a3ff] hover:text-white p-1 rounded-lg hover:bg-[#003366]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#66a3ff] font-mono">
            File Location: <strong className="text-white">/python/weighted_risk_model.py</strong>
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#00509e] hover:bg-[#007acc] text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#cce0ff]" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Viewport */}
        <pre className="bg-[#001429] border border-[#003366] rounded-xl p-4 text-xs font-mono text-[#cce0ff] max-h-96 overflow-y-auto leading-relaxed select-all scrollbar-thin">
          <code>{PYTHON_CODE}</code>
        </pre>

        <div className="text-[11px] text-[#66a3ff] font-mono flex items-center gap-2 pt-1">
          <Terminal className="w-3.5 h-3.5 text-[#007acc]" />
          <span>Calculates 5-factor weighted sum score using NumPy arrays and Pandas DataFrames.</span>
        </div>

      </div>
    </div>
  );
};
