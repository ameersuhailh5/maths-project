import React from 'react';
import { RiskMetrics } from '../types/stock';
import { Zap, Activity, ShieldAlert, Award } from 'lucide-react';

interface RiskMetricsGridProps {
  metrics: RiskMetrics;
  symbol: string;
}

export const RiskMetricsGrid: React.FC<RiskMetricsGridProps> = ({ metrics, symbol }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-white">
      
      {/* CARD 1: Interest Rate Sensitivity */}
      <div className="bg-[#001f3f] border border-[#00509e]/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#00509e]">
          <span className="text-xs font-semibold text-[#007acc] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Rate Duration
          </span>
          <span className="text-[10px] font-mono text-[#cce0ff]">
            {metrics.interestRiskCategory}
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">Rate Beta (100bps)</span>
            <span className={`font-bold ${metrics.rateBeta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.rateBeta > 0 ? '+' : ''}{metrics.rateBeta.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">Duration Proxy</span>
            <span className="font-bold text-amber-300">
              {metrics.durationProxy.toFixed(1)} Yrs
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">+100bps Rate Shift</span>
            <span className={`font-bold ${metrics.rateImpactPlus100bps >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.rateImpactPlus100bps > 0 ? '+' : ''}{metrics.rateImpactPlus100bps.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* CARD 2: Historical Volatility */}
      <div className="bg-[#001f3f] border border-[#00509e]/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#00509e]">
          <span className="text-xs font-semibold text-[#007acc] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Historical Volatility
          </span>
          <span className="text-[10px] font-mono text-[#cce0ff]">
            Annualized
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">1-Year Volatility (HV)</span>
            <span className="font-bold text-white">
              {(metrics.volatility1y * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">30-Day Volatility</span>
            <span className="font-bold text-white">
              {(metrics.volatility30d * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">Max Historical Drawdown</span>
            <span className="font-bold text-rose-400">
              -{(metrics.maxDrawdown * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: Value at Risk (VaR) */}
      <div className="bg-[#001f3f] border border-[#00509e]/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#00509e]">
          <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Value at Risk (VaR)
          </span>
          <span className="text-[10px] font-mono text-[#cce0ff]">
            Daily Tail Loss
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">95% Daily VaR</span>
            <span className="font-bold text-rose-400">
              -{(metrics.var95Daily * 100).toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">99% Extreme VaR</span>
            <span className="font-bold text-rose-400">
              -{(metrics.var99Daily * 100).toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">Expected Shortfall (CVaR)</span>
            <span className="font-bold text-rose-400">
              -{(metrics.cvar95Daily * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* CARD 4: Risk-Adjusted Return */}
      <div className="bg-[#001f3f] border border-[#00509e]/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#00509e]">
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> Market Ratios
          </span>
          <span className="text-[10px] font-mono text-[#cce0ff]">
            Performance
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">Sharpe Ratio</span>
            <span className="font-bold text-emerald-400">
              {metrics.sharpeRatio.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">Beta vs S&amp;P 500</span>
            <span className="font-bold text-white">
              {metrics.betaToMarket.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#00264d]">
            <span className="text-[#66a3ff] font-sans">Annualized Return</span>
            <span className={`font-bold ${metrics.annualizedReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.annualizedReturn > 0 ? '+' : ''}{(metrics.annualizedReturn * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
