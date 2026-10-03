import React from 'react';
import { StockQuote } from '../types/stock';
import { TrendingUp, Percent, Scale, ArrowRight } from 'lucide-react';

interface FromRawDataToRiskValuesProps {
  stock: StockQuote;
}

export const FromRawDataToRiskValues: React.FC<FromRawDataToRiskValuesProps> = ({ stock }) => {
  const { stats, fiveFactorModel } = stock;

  return (
    <div className="bg-[#001f3f] border border-[#00509e] rounded-xl p-5 sm:p-6 space-y-6 text-white shadow-xl">
      
      {/* Title directly from Slide 3 */}
      <div className="pb-3 border-b border-[#00509e] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            From Raw Data to Risk Values
          </h2>
          <p className="text-xs text-[#66a3ff] mt-0.5">
            Converting heterogeneous financial units into normalized risk values for <strong className="text-white font-mono">{stock.symbol}</strong>.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1 bg-[#00264d] border border-[#00509e] rounded-lg text-[#cce0ff]">
          Scale: 0 = very low risk · 100 = very high risk
        </div>
      </div>

      {/* 3 Core Cards from Slide 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Statistics */}
        <div className="bg-[#00264d] border border-[#00509e] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#007acc] text-white flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Statistics</h3>
          </div>

          <p className="text-xs text-[#cce0ff] leading-relaxed">
            Historical data shows past behavior. A higher standard deviation means higher volatility, which becomes a higher risk value.
          </p>

          <div className="pt-2 border-t border-[#00509e]/60 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-[#66a3ff]">
              <span>Sample Size:</span>
              <strong className="text-white">{stats.sampleSize} Days</strong>
            </div>
            <div className="flex justify-between text-[#66a3ff]">
              <span>Daily Std Dev (σ):</span>
              <strong className="text-white">{(stats.dailyStandardDeviation * 100).toFixed(2)}%</strong>
            </div>
            <div className="flex justify-between text-[#66a3ff]">
              <span>Annualized Volatility:</span>
              <strong className="text-amber-400 font-bold">{stats.annualizedVolatility}%</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Probability */}
        <div className="bg-[#00264d] border border-[#00509e] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#e5633c] text-white flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Probability</h3>
          </div>

          <p className="text-xs text-[#cce0ff] leading-relaxed">
            Investing involves uncertainty. Probability represents how likely events like a price fall or a sector slump are.
          </p>

          <div className="pt-2 border-t border-[#00509e]/60 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-[#66a3ff]">
              <span>P(Price Fall &lt; 0):</span>
              <strong className="text-white">{stats.probabilityDownsideDay}%</strong>
            </div>
            <div className="flex justify-between text-[#66a3ff]">
              <span>P(Severe Slump &le; -2%):</span>
              <strong className="text-white">{stats.probabilitySevereSlump}%</strong>
            </div>
            <div className="flex justify-between text-[#66a3ff]">
              <span>Max Historical Drawdown:</span>
              <strong className="text-rose-400 font-bold">-{stats.maxDrawdownPercent}%</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Normalization */}
        <div className="bg-[#00264d] border border-[#00509e] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00509e] text-white flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Normalization</h3>
          </div>

          <p className="text-xs text-[#cce0ff] leading-relaxed">
            Volatility, debt ratio and credit ratings use different units. Normalization converts them to one common scale.
          </p>

          <div className="pt-2 border-t border-[#00509e]/60 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-[#66a3ff]">
              <span>Volatility Risk Value:</span>
              <strong className="text-white">{fiveFactorModel.volatility.normalizedScore} / 100</strong>
            </div>
            <div className="flex justify-between text-[#66a3ff]">
              <span>Liquidity Risk Value:</span>
              <strong className="text-white">{fiveFactorModel.liquidity.normalizedScore} / 100</strong>
            </div>
            <div className="flex justify-between text-[#66a3ff]">
              <span>Leverage Risk Value:</span>
              <strong className="text-white">{fiveFactorModel.leverageDebt.normalizedScore} / 100</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Common Scale Banner (Slide 3 bottom bar) */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#66a3ff] font-semibold">
          Common Scale
        </span>
        <div className="h-10 rounded-lg bg-[#001429] border border-[#00509e] px-4 flex items-center justify-between text-xs font-mono font-bold">
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            0 = very low risk
          </span>
          <div className="hidden sm:flex items-center gap-2 text-[#66a3ff]/40 text-[10px]">
            <span>Normalized Mapping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <span className="text-rose-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            100 = very high risk
          </span>
        </div>
      </div>

    </div>
  );
};
