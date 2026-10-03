import React, { useState } from 'react';
import { StockQuote } from '../types/stock';
import { Calculator, RotateCcw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface WeightedRiskModelCardProps {
  stock: StockQuote;
}

export const WeightedRiskModelCard: React.FC<WeightedRiskModelCardProps> = ({ stock }) => {
  const model = stock.fiveFactorModel;

  // Interactive Factor Risk Values (0 - 100)
  const [volValue, setVolValue] = useState<number>(model.volatility.normalizedScore);
  const [liqValue, setLiqValue] = useState<number>(model.liquidity.normalizedScore);
  const [corrValue, setCorrValue] = useState<number>(model.marketCorrelation.normalizedScore);
  const [levValue, setLevValue] = useState<number>(model.leverageDebt.normalizedScore);
  const [trackValue, setTrackValue] = useState<number>(model.trackRecordCredit.normalizedScore);

  // Exact PPT formula: Risk Score = Σ (Risk Value × Weight)
  const cVol = Number((volValue * 0.30).toFixed(2));
  const cLiq = Number((liqValue * 0.20).toFixed(2));
  const cCorr = Number((corrValue * 0.20).toFixed(2));
  const cLev = Number((levValue * 0.15).toFixed(2));
  const cTrack = Number((trackValue * 0.15).toFixed(2));

  const totalScore = Number((cVol + cLiq + cCorr + cLev + cTrack).toFixed(1));

  // Slide 5: Risk Bands Classification
  let riskBand = 'Moderate';
  let bandClass = 'bg-[#E5A93C] text-slate-950';

  if (totalScore <= 30.0) {
    riskBand = 'Low';
    bandClass = 'bg-[#2E9D64] text-white';
  } else if (totalScore <= 60.0) {
    riskBand = 'Moderate';
    bandClass = 'bg-[#E5A93C] text-slate-950';
  } else if (totalScore <= 80.0) {
    riskBand = 'High';
    bandClass = 'bg-[#E5633C] text-white';
  } else {
    riskBand = 'Very High';
    bandClass = 'bg-[#D9453B] text-white';
  }

  const resetToStockValues = () => {
    setVolValue(model.volatility.normalizedScore);
    setLiqValue(model.liquidity.normalizedScore);
    setCorrValue(model.marketCorrelation.normalizedScore);
    setLevValue(model.leverageDebt.normalizedScore);
    setTrackValue(model.trackRecordCredit.normalizedScore);
  };

  const factorItems = [
    {
      id: 'volatility',
      name: 'Volatility',
      weightNum: 0.30,
      weightStr: '30%',
      val: volValue,
      setVal: setVolValue,
      contrib: cVol,
      color: '#00264d',
      desc: 'Annualized standard deviation of daily price returns.',
    },
    {
      id: 'liquidity',
      name: 'Liquidity',
      weightNum: 0.20,
      weightStr: '20%',
      val: liqValue,
      setVal: setLiqValue,
      contrib: cLiq,
      color: '#00509e',
      desc: 'Average turnover and trading volume depth.',
    },
    {
      id: 'correlation',
      name: 'Market/Sector Correlation',
      weightNum: 0.20,
      weightStr: '20%',
      val: corrValue,
      setVal: setCorrValue,
      contrib: cCorr,
      color: '#007acc',
      desc: 'Beta sensitivity to broader market movements.',
    },
    {
      id: 'leverage',
      name: 'Leverage/Debt Ratio',
      weightNum: 0.15,
      weightStr: '15%',
      val: levValue,
      setVal: setLevValue,
      contrib: cLev,
      color: '#e5633c',
      desc: 'Debt burden relative to total corporate assets.',
    },
    {
      id: 'track',
      name: 'Track Record/Credit Rating',
      weightNum: 0.15,
      weightStr: '15%',
      val: trackValue,
      setVal: setTrackValue,
      contrib: cTrack,
      color: '#66a3ff',
      desc: 'Balance sheet credit rating and historical reliability.',
    },
  ];

  const pieData = factorItems.map((f) => ({
    name: `${f.name} (${f.weightStr})`,
    value: f.weightNum * 100,
    color: f.color,
  }));

  return (
    <div className="space-y-8">
      
      {/* =================================================================== */}
      {/* SLIDE 4: Weighted Sum: Five Risk Factors                           */}
      {/* =================================================================== */}
      <div className="bg-[#001f3f] border border-[#00509e] rounded-xl p-5 sm:p-6 space-y-6 text-white shadow-xl">
        <div className="pb-3 border-b border-[#00509e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#007acc]" />
              Weighted Sum: Five Risk Factors
            </h2>
            <p className="text-xs text-[#66a3ff] mt-0.5">
              Mathematical formulation for {stock.symbol} ({stock.name}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetToStockValues}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-[#00264d] border border-[#00509e] text-[#66a3ff] hover:text-white transition-colors"
              title="Reset to computed stock values"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Values</span>
            </button>
            <div className="px-3 py-1 bg-[#00264d] border border-[#007acc] rounded-lg text-xs font-mono font-bold text-white">
              Weights total 100%
            </div>
          </div>
        </div>

        {/* Slide 4 Header Equation & Donut Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-[#00264d] p-5 rounded-xl border border-[#00509e]">
          
          {/* Donut Chart (Matching Slide 4 Left Graphic) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#001f3f" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#001429', borderColor: '#00509e', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }}
                    formatter={(val: any) => [`${val}% weight`, 'Factor Weight']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-[#66a3ff] font-mono">Total</span>
                <span className="text-lg font-bold text-white font-mono">100%</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 text-[10px] font-mono mt-2 text-[#cce0ff]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00264d] border border-[#00509e]" /> Vol 30%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00509e]" /> Liq 20%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#007acc]" /> Corr 20%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#e5633c]" /> Lev 15%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#66a3ff]" /> Track 15%</span>
            </div>
          </div>

          {/* Formula Presentation (Slide 4 Right Content) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-4 rounded-xl bg-[#001f3f] border border-[#007acc] space-y-1">
              <span className="text-xs font-mono text-[#66a3ff] uppercase font-semibold">Core Formula:</span>
              <div className="text-xl sm:text-2xl font-mono font-extrabold text-white tracking-wide">
                Risk Score = Σ (Risk Value × Weight)
              </div>
            </div>

            {/* Exact Example Callout from Slide 4 */}
            <div className="p-4 rounded-xl bg-[#001429] border border-[#00509e] space-y-1">
              <div className="text-xs text-[#66a3ff] font-mono">Example: volatility</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
                70 × 0.30 = 21
              </div>
              <div className="text-xs text-[#cce0ff] pt-1">
                Repeat for every factor, then add the results. Weights total 100%.
              </div>
            </div>
          </div>

        </div>

        {/* Five Risk Factors Interactive Table (Slide 4 calculation steps) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#66a3ff]">
            <span className="font-semibold text-white">Calculation Breakdown (Adjust sliders to test custom factor values):</span>
            <span className="font-mono text-slate-300">5 Factors Sum to 100%</span>
          </div>

          <div className="border border-[#00509e] rounded-xl overflow-x-auto bg-[#00264d]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#00509e] text-[#66a3ff] font-mono bg-[#001f3f]">
                  <th className="py-2.5 px-3 font-semibold">Factor Name</th>
                  <th className="py-2.5 px-3 font-semibold">Risk Value (0–100)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Weight</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Calculation (Value × Weight)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00509e]/60 font-mono">
                {factorItems.map((f) => (
                  <tr key={f.id} className="hover:bg-[#003366]/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white font-sans flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                        {f.name}
                      </div>
                      <div className="text-[10px] text-[#66a3ff] font-sans pl-4">{f.desc}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 font-bold text-white text-right font-mono">{f.val.toFixed(0)}</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={f.val}
                          onChange={(e) => f.setVal(parseFloat(e.target.value) || 0)}
                          className="w-28 sm:w-36 h-1 bg-[#001429] accent-[#007acc] rounded cursor-pointer"
                        />
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-[#001f3f] text-[#66a3ff] font-bold border border-[#00509e]">
                        {f.weightStr} ({f.weightNum})
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono text-sm">
                      {f.val.toFixed(0)} × {f.weightNum.toFixed(2)} = +{f.contrib.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#00509e] bg-[#001f3f] font-mono">
                  <td colSpan={2} className="py-3 px-3 font-bold font-sans text-white text-sm">
                    Total Weighted Risk Score = Σ (Risk Value × Weight)
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#007acc]">
                    100% (1.00)
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-white text-base">
                    {totalScore} / 100
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>

      {/* =================================================================== */}
      {/* SLIDE 5: Risk Score and Risk Bands                                 */}
      {/* =================================================================== */}
      <div className="bg-[#001f3f] border border-[#00509e] rounded-xl p-5 sm:p-6 space-y-6 text-white shadow-xl">
        <div className="pb-3 border-b border-[#00509e]">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Risk Score and Risk Bands
          </h2>
          <p className="text-xs text-[#66a3ff] mt-0.5">
            Classification of the final score into Low, Moderate, High, or Very High.
          </p>
        </div>

        {/* Centerpiece Display */}
        <div className="bg-[#00264d] border border-[#00509e] p-6 rounded-2xl flex flex-col items-center space-y-4">
          
          {/* Top Score (e.g. 53.5 / 100) */}
          <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
            {totalScore} <span className="text-2xl text-[#66a3ff] font-normal">/ 100</span>
          </div>

          {/* Downward Pointer Triangle */}
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-white" />

          {/* Risk Bands Bar: Low (0–30) | Moderate (31–60) | High (61–80) | Very High (81–100) */}
          <div className="w-full max-w-2xl space-y-2">
            <div className="grid grid-cols-4 rounded-xl overflow-hidden text-center text-xs font-mono font-bold shadow-lg border border-[#00509e]">
              <div className="bg-[#2E9D64] text-white py-3 border-r border-[#001f3f]">
                <div className="text-sm">Low</div>
                <div className="text-[11px] opacity-90">0–30</div>
              </div>
              <div className="bg-[#E5A93C] text-slate-950 py-3 border-r border-[#001f3f]">
                <div className="text-sm">Moderate</div>
                <div className="text-[11px] opacity-90">31–60</div>
              </div>
              <div className="bg-[#E5633C] text-white py-3 border-r border-[#001f3f]">
                <div className="text-sm">High</div>
                <div className="text-[11px] opacity-90">61–80</div>
              </div>
              <div className="bg-[#D9453B] text-white py-3">
                <div className="text-sm">Very High</div>
                <div className="text-[11px] opacity-90">81–100</div>
              </div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="w-full max-w-2xl pt-2">
            <div className={`w-full py-3.5 px-4 rounded-xl text-center font-bold text-sm sm:text-base font-sans tracking-wide shadow-md transition-colors ${bandClass}`}>
              A score of {totalScore} falls in the {riskBand} Risk band
            </div>
          </div>

        </div>
      </div>

      {/* How Each Concept Contributes */}
      <div className="bg-[#001f3f] border border-[#00509e] rounded-xl p-5 sm:p-6 space-y-6 text-white shadow-xl">
        <div className="pb-3 border-b border-[#00509e]">
          <h2 className="text-xl font-bold text-white tracking-tight">
            How Each Concept Contributes
          </h2>
          <p className="text-xs text-[#66a3ff] mt-0.5">
            The six mathematical foundations connecting data to final risk classification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Concept 1 */}
          <div className="bg-[#00264d] border border-[#00509e] rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#E5A93C] text-slate-950 font-bold font-mono text-sm flex items-center justify-center shrink-0">
                1
              </span>
              <h3 className="text-base font-bold text-white">Statistics</h3>
            </div>
            <p className="text-xs text-[#cce0ff] leading-relaxed pt-1">
              Analyses investment data and measures factors like volatility
            </p>
          </div>

          {/* Concept 2 */}
          <div className="bg-[#00264d] border border-[#00509e] rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#E5A93C] text-slate-950 font-bold font-mono text-sm flex items-center justify-center shrink-0">
                2
              </span>
              <h3 className="text-base font-bold text-white">Probability</h3>
            </div>
            <p className="text-xs text-[#cce0ff] leading-relaxed pt-1">
              Represents the likelihood of uncertain risk events
            </p>
          </div>

          {/* Concept 3 */}
          <div className="bg-[#00264d] border border-[#00509e] rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#E5A93C] text-slate-950 font-bold font-mono text-sm flex items-center justify-center shrink-0">
                3
              </span>
              <h3 className="text-base font-bold text-white">Normalization</h3>
            </div>
            <p className="text-xs text-[#cce0ff] leading-relaxed pt-1">
              Puts different factors on a common 0–100 scale
            </p>
          </div>

          {/* Concept 4 */}
          <div className="bg-[#00264d] border border-[#00509e] rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#E5A93C] text-slate-950 font-bold font-mono text-sm flex items-center justify-center shrink-0">
                4
              </span>
              <h3 className="text-base font-bold text-white">Percentages</h3>
            </div>
            <p className="text-xs text-[#cce0ff] leading-relaxed pt-1">
              Represent the weight given to each risk factor
            </p>
          </div>

          {/* Concept 5 */}
          <div className="bg-[#00264d] border border-[#00509e] rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#E5A93C] text-slate-950 font-bold font-mono text-sm flex items-center justify-center shrink-0">
                5
              </span>
              <h3 className="text-base font-bold text-white">Weighted Sum</h3>
            </div>
            <p className="text-xs text-[#cce0ff] leading-relaxed pt-1">
              Combines all factors by importance into overall risk
            </p>
          </div>

          {/* Concept 6 */}
          <div className="bg-[#00264d] border border-[#00509e] rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#E5A93C] text-slate-950 font-bold font-mono text-sm flex items-center justify-center shrink-0">
                6
              </span>
              <h3 className="text-base font-bold text-white">Risk Scoring</h3>
            </div>
            <p className="text-xs text-[#cce0ff] leading-relaxed pt-1">
              Turns the result into one 0–100 score, then classifies it into Low, Moderate, High or Very High
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
