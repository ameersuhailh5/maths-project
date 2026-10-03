import React from 'react';
import { StockQuote } from '../types/stock';
import { TrendingUp, Percent, Scale, ArrowRight } from 'lucide-react';

interface FromRawDataToRiskValuesProps {
  stock: StockQuote;
}

export const FromRawDataToRiskValues: React.FC<FromRawDataToRiskValuesProps> = ({ stock }) => {
  const { stats, fiveFactorModel } = stock;

  return (
    <div className="bg-white border border-[#cddfe2] rounded-lg p-5 space-y-6 shadow-xs">
      
      {/* Title & Description */}
      <div className="pb-3 border-b border-[#cddfe2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#042F34] tracking-tight">
            From Raw Data to Risk Values
          </h2>
          <p className="text-xs text-[#16232B]/70 mt-0.5">
            Converting heterogeneous market metrics into normalized risk values for <strong className="text-[#042F34] font-mono">{stock.symbol}</strong> ({stock.name}).
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1 bg-[#E4EEF0] border border-[#cddfe2] rounded-md text-[#042F34] self-start sm:self-auto font-bold">
          Scale: 0 = very low risk · 100 = very high risk
        </div>
      </div>

      {/* 3 Core Cards: Statistics, Probability, Normalization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Statistics Card */}
        <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#042F34] text-[#B5F2DB] flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#042F34]">Statistics</h3>
              <p className="text-[11px] text-[#16232B]/65">Historical return behavior</p>
            </div>
          </div>

          <p className="text-xs text-[#16232B]/80 leading-relaxed">
            Historical data shows past price behavior. A higher standard deviation means higher volatility, which converts into a higher risk value.
          </p>

          <div className="pt-2 border-t border-[#cddfe2] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-[#16232B]/75">
              <span>Sample History:</span>
              <strong className="text-[#042F34]">{stats.sampleSize} Trading Days</strong>
            </div>
            <div className="flex justify-between text-[#16232B]/75">
              <span>Daily Std Dev (σ):</span>
              <strong className="text-[#042F34]">{(stats.dailyStandardDeviation * 100).toFixed(2)}%</strong>
            </div>
            <div className="flex justify-between text-[#16232B]/75">
              <span>Annualized Volatility:</span>
              <strong className="text-[#042F34] font-bold">{stats.annualizedVolatility}%</strong>
            </div>
          </div>
        </div>

        {/* Probability Card */}
        <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#FFC933] text-[#042F34] flex items-center justify-center shadow-xs">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#042F34]">Probability</h3>
              <p className="text-[11px] text-[#16232B]/65">Likelihood of uncertain events</p>
            </div>
          </div>

          <p className="text-xs text-[#16232B]/80 leading-relaxed">
            Investing inherently involves uncertainty. Probability measures how likely events like a price drop or a sector slump are to occur.
          </p>

          <div className="pt-2 border-t border-[#cddfe2] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-[#16232B]/75">
              <span>P(Daily Price Drop &lt; 0):</span>
              <strong className="text-[#042F34]">{stats.probabilityDownsideDay}%</strong>
            </div>
            <div className="flex justify-between text-[#16232B]/75">
              <span>P(Severe Slump &le; -2%):</span>
              <strong className="text-[#042F34]">{stats.probabilitySevereSlump}%</strong>
            </div>
            <div className="flex justify-between text-[#16232B]/75">
              <span>Max Historical Drawdown:</span>
              <strong className="text-rose-600 font-bold">-{stats.maxDrawdownPercent}%</strong>
            </div>
          </div>
        </div>

        {/* Normalization Card */}
        <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#B5F2DB] text-[#042F34] flex items-center justify-center shadow-xs border border-[#8ee3c2]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#042F34]">Normalization</h3>
              <p className="text-[11px] text-[#16232B]/65">Standardizing to 0–100</p>
            </div>
          </div>

          <p className="text-xs text-[#16232B]/80 leading-relaxed">
            Volatility, debt ratio, and credit ratings use different measurement units. Normalization converts them all into one common scale.
          </p>

          <div className="pt-2 border-t border-[#cddfe2] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-[#16232B]/75">
              <span>Volatility Risk Value:</span>
              <strong className="text-[#042F34]">{fiveFactorModel.volatility.normalizedScore} / 100</strong>
            </div>
            <div className="flex justify-between text-[#16232B]/75">
              <span>Liquidity Risk Value:</span>
              <strong className="text-[#042F34]">{fiveFactorModel.liquidity.normalizedScore} / 100</strong>
            </div>
            <div className="flex justify-between text-[#16232B]/75">
              <span>Leverage Risk Value:</span>
              <strong className="text-[#042F34]">{fiveFactorModel.leverageDebt.normalizedScore} / 100</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Common Scale Bar */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#042F34] font-bold">
          Common Scale Representation
        </span>
        <div className="h-10 rounded-lg bg-[#042F34] border border-[#16232B] px-4 flex items-center justify-between text-xs font-mono font-bold text-white shadow-xs">
          <span className="text-[#B5F2DB] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B5F2DB]" />
            0 = Very Low Risk
          </span>
          <div className="hidden sm:flex items-center gap-1.5 text-[#E4EEF0]/60 text-[11px]">
            <span>Normalized Mapping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <span className="text-[#FFC933] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFC933]" />
            100 = Very High Risk
          </span>
        </div>
      </div>

    </div>
  );
};
