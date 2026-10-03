import React, { useState } from 'react';
import { StockQuote } from '../types/stock';
import { Scale, Calculator, Sliders, Info, ShieldCheck, AlertCircle } from 'lucide-react';

interface WeightedRiskModelCardProps {
  stock: StockQuote;
}

export const WeightedRiskModelCard: React.FC<WeightedRiskModelCardProps> = ({ stock }) => {
  const model = stock.metrics.fiveFactorModel;

  // Factor Score Overrides
  const [volScore, setVolScore] = useState<number>(model.volatility.normalizedScore);
  const [liqScore, setLiqScore] = useState<number>(model.liquidity.normalizedScore);
  const [corrScore, setCorrScore] = useState<number>(model.marketCorrelation.normalizedScore);
  const [levScore, setLevScore] = useState<number>(model.leverageDebt.normalizedScore);
  const [trackScore, setTrackScore] = useState<number>(model.trackRecordCredit.normalizedScore);

  // Recalculate Weighted Sum
  const calcVolContrib = Number((volScore * 0.30).toFixed(2));
  const calcLiqContrib = Number((liqScore * 0.20).toFixed(2));
  const calcCorrContrib = Number((corrScore * 0.20).toFixed(2));
  const calcLevContrib = Number((levScore * 0.15).toFixed(2));
  const calcTrackContrib = Number((trackScore * 0.15).toFixed(2));

  const totalScore = Number((calcVolContrib + calcLiqContrib + calcCorrContrib + calcLevContrib + calcTrackContrib).toFixed(1));

  let riskBand = 'Moderate Risk';
  let bandColorClass = 'bg-amber-500 text-slate-950';

  if (totalScore <= 30.0) {
    riskBand = 'Low Risk';
    bandColorClass = 'bg-emerald-500 text-slate-950';
  } else if (totalScore <= 60.0) {
    riskBand = 'Moderate Risk';
    bandColorClass = 'bg-amber-500 text-slate-950';
  } else if (totalScore <= 80.0) {
    riskBand = 'High Risk';
    bandColorClass = 'bg-orange-500 text-white';
  } else {
    riskBand = 'Very High Risk';
    bandColorClass = 'bg-rose-600 text-white';
  }

  const factors = [
    {
      key: 'volatility',
      name: 'Volatility',
      weightStr: '30%',
      weightVal: 0.30,
      score: volScore,
      setScore: setVolScore,
      contrib: calcVolContrib,
      desc: 'Standard deviation of historical daily returns.',
    },
    {
      key: 'liquidity',
      name: 'Liquidity',
      weightStr: '20%',
      weightVal: 0.20,
      score: liqScore,
      setScore: setLiqScore,
      contrib: calcLiqContrib,
      desc: 'Trading turnover and market order depth.',
    },
    {
      key: 'correlation',
      name: 'Market/Sector Correlation',
      weightStr: '20%',
      weightVal: 0.20,
      score: corrScore,
      setScore: setCorrScore,
      contrib: calcCorrContrib,
      desc: 'Beta and systemic benchmark sensitivity.',
    },
    {
      key: 'leverage',
      name: 'Leverage/Debt Ratio',
      weightStr: '15%',
      weightVal: 0.15,
      score: levScore,
      setScore: setLevScore,
      contrib: calcLevContrib,
      desc: 'Debt-to-equity and total financial liabilities.',
    },
    {
      key: 'trackRecord',
      name: 'Track Record/Credit Rating',
      weightStr: '15%',
      weightVal: 0.15,
      score: trackScore,
      setScore: setTrackScore,
      contrib: calcTrackContrib,
      desc: 'Corporate stability and balance sheet rating.',
    },
  ];

  return (
    <div className="bg-[#001f3f] border border-[#00509e] rounded-xl p-5 space-y-6 text-white">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#00509e]">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#007acc]" />
            Quantitative Risk Assessment Model
          </h2>
          <p className="text-xs text-[#66a3ff]">
            Combines five normalized risk factors into one final 0–100 score for <strong className="text-white font-mono">{stock.symbol}</strong> ({stock.name}).
          </p>
        </div>

        <div className="font-mono text-xs px-3 py-1 rounded-lg bg-[#003366] border border-[#00509e] text-[#cce0ff] shrink-0">
          Risk Score = Σ (Risk Value × Weight)
        </div>
      </div>

      {/* Main Score & Risk Band Section (Matching Presentation Slide 5) */}
      <div className="bg-[#00264d] border border-[#00509e] p-5 rounded-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs text-[#66a3ff] font-mono font-semibold uppercase">Assessment Output Score</span>
            <div className="text-3xl font-extrabold font-mono text-white">
              {totalScore} <span className="text-lg text-[#66a3ff] font-normal">/ 100</span>
            </div>
          </div>

          <div className="sm:text-right">
            <span className={`inline-block px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider ${bandColorClass}`}>
              A score of {totalScore} falls in the {riskBand} band
            </span>
          </div>
        </div>

        {/* Slide 5 Risk Band Scale Bar */}
        <div className="space-y-1">
          <div className="relative h-7 rounded-lg overflow-hidden border border-[#00509e] grid grid-cols-4 text-[11px] font-bold font-mono text-center">
            <div className="bg-emerald-600 text-white flex items-center justify-center border-r border-[#00509e]">
              Low (0–30)
            </div>
            <div className="bg-amber-500 text-slate-950 flex items-center justify-center border-r border-[#00509e]">
              Moderate (31–60)
            </div>
            <div className="bg-orange-500 text-white flex items-center justify-center border-r border-[#00509e]">
              High (61–80)
            </div>
            <div className="bg-rose-600 text-white flex items-center justify-center">
              Very High (81–100)
            </div>
          </div>

          {/* Pointer Marker */}
          <div className="relative h-2">
            <div
              className="absolute -top-1 transition-all duration-300 transform -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-white"
              style={{ left: `${Math.min(98, Math.max(2, totalScore))}%` }}
            />
          </div>
        </div>

      </div>

      {/* Five Risk Factors Breakdown Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#66a3ff] font-semibold">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#007acc]" />
            Five Risk Factors Breakdown (Adjust sliders to test custom values)
          </span>
          <span className="font-mono text-slate-300">Weights sum to 100%</span>
        </div>

        <div className="border border-[#00509e] rounded-xl overflow-x-auto bg-[#00264d]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#00509e] text-[#66a3ff] font-mono bg-[#001f3f]">
                <th className="py-2 px-3 font-semibold">Risk Factor</th>
                <th className="py-2 px-3 font-semibold">Normalized Value (0–100)</th>
                <th className="py-2 px-3 font-semibold text-center">Weight</th>
                <th className="py-2 px-3 font-semibold text-right">Weighted Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00509e]/60 font-mono">
              {factors.map((f) => (
                <tr key={f.key} className="hover:bg-[#003366]/50">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white font-sans">{f.name}</div>
                    <div className="text-[10px] text-[#66a3ff] font-sans">{f.desc}</div>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 font-bold text-white text-right">{f.score.toFixed(0)}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={f.score}
                        onChange={(e) => f.setScore(parseFloat(e.target.value) || 0)}
                        className="w-28 sm:w-36 h-1 bg-[#003366] accent-[#007acc] rounded cursor-pointer"
                      />
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#003366] text-[#007acc] font-bold">
                      {f.weightStr}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    +{f.contrib.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#00509e] bg-[#001f3f] font-mono">
                <td colSpan={2} className="py-2.5 px-3 font-bold font-sans text-white">
                  Total Weighted Sum Risk Score
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-[#007acc]">
                  100%
                </td>
                <td className="py-2.5 px-3 text-right font-extrabold text-white text-sm">
                  {totalScore} / 100
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Slide 6 Concept Contributions */}
      <div className="pt-2 border-t border-[#00509e] space-y-2 text-xs">
        <span className="text-[#66a3ff] font-semibold flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#007acc]" />
          Methodology Breakdown (Slide 6: How Each Concept Contributes)
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-sans">
          <div className="p-2.5 rounded-lg bg-[#00264d] border border-[#00509e]">
            <strong className="text-white font-mono block">1. Statistics</strong>
            <span className="text-[#66a3ff]">Measures standard deviation of past returns.</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#00264d] border border-[#00509e]">
            <strong className="text-white font-mono block">2. Probability</strong>
            <span className="text-[#66a3ff]">Estimates likelihood of price slumps &amp; drawdowns.</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#00264d] border border-[#00509e]">
            <strong className="text-white font-mono block">3. Normalization</strong>
            <span className="text-[#66a3ff]">Converts different units to common 0–100 scale.</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#00264d] border border-[#00509e]">
            <strong className="text-white font-mono block">4. Percentages</strong>
            <span className="text-[#66a3ff]">Weights factors by relative importance.</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#00264d] border border-[#00509e]">
            <strong className="text-white font-mono block">5. Weighted Sum</strong>
            <span className="text-[#66a3ff]">Combines all 5 factors into overall risk.</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#00264d] border border-[#00509e]">
            <strong className="text-white font-mono block">6. Risk Scoring</strong>
            <span className="text-[#66a3ff]">Classifies final score into Low, Moderate, High, Very High.</span>
          </div>
        </div>
      </div>

    </div>
  );
};
