import React, { useState } from 'react';
import { StockQuote } from '../types/stock';
import { RotateCcw } from 'lucide-react';

interface WeightedRiskModelCardProps {
  stock: StockQuote;
}

export const WeightedRiskModelCard: React.FC<WeightedRiskModelCardProps> = ({ stock }) => {
  const { fiveFactorModel } = stock;

  // Interactive slider states
  const [customVol, setCustomVol] = useState<number>(fiveFactorModel.volatility.normalizedScore);
  const [customLiq, setCustomLiq] = useState<number>(fiveFactorModel.liquidity.normalizedScore);
  const [customCorr, setCustomCorr] = useState<number>(fiveFactorModel.marketCorrelation.normalizedScore);
  const [customLev, setCustomLev] = useState<number>(fiveFactorModel.leverageDebt.normalizedScore);
  const [customTrack, setCustomTrack] = useState<number>(fiveFactorModel.trackRecordCredit.normalizedScore);

  // Sync when stock changes
  const [prevStockSymbol, setPrevStockSymbol] = useState(stock.symbol);
  if (stock.symbol !== prevStockSymbol) {
    setPrevStockSymbol(stock.symbol);
    setCustomVol(fiveFactorModel.volatility.normalizedScore);
    setCustomLiq(fiveFactorModel.liquidity.normalizedScore);
    setCustomCorr(fiveFactorModel.marketCorrelation.normalizedScore);
    setCustomLev(fiveFactorModel.leverageDebt.normalizedScore);
    setCustomTrack(fiveFactorModel.trackRecordCredit.normalizedScore);
  }

  const resetToStockValues = () => {
    setCustomVol(fiveFactorModel.volatility.normalizedScore);
    setCustomLiq(fiveFactorModel.liquidity.normalizedScore);
    setCustomCorr(fiveFactorModel.marketCorrelation.normalizedScore);
    setCustomLev(fiveFactorModel.leverageDebt.normalizedScore);
    setCustomTrack(fiveFactorModel.trackRecordCredit.normalizedScore);
  };

  // Contributions: Risk Value × Weight
  const cVol = Number((customVol * 0.30).toFixed(2));
  const cLiq = Number((customLiq * 0.20).toFixed(2));
  const cCorr = Number((customCorr * 0.20).toFixed(2));
  const cLev = Number((customLev * 0.15).toFixed(2));
  const cTrack = Number((customTrack * 0.15).toFixed(2));

  // Weighted Sum
  const totalScore = Number((cVol + cLiq + cCorr + cLev + cTrack).toFixed(1));

  // Risk Band Classification with requested color palette
  let riskBand = 'Moderate';
  let bandClass = 'bg-[#FFC933]/20 text-[#825b00] border-[#FFC933]';
  let bandHex = '#FFC933';

  if (totalScore <= 30.0) {
    riskBand = 'Low';
    bandClass = 'bg-[#B5F2DB] text-[#042F34] border-[#8ee3c2]';
    bandHex = '#B5F2DB';
  } else if (totalScore <= 60.0) {
    riskBand = 'Moderate';
    bandClass = 'bg-[#FFC933]/20 text-[#825b00] border-[#FFC933]';
    bandHex = '#FFC933';
  } else if (totalScore <= 80.0) {
    riskBand = 'High';
    bandClass = 'bg-orange-100 text-orange-900 border-orange-300';
    bandHex = '#f97316';
  } else {
    riskBand = 'Very High';
    bandClass = 'bg-rose-100 text-rose-900 border-rose-300';
    bandHex = '#ef4444';
  }

  const factorItems = [
    {
      id: 'vol',
      name: 'Volatility',
      weight: '30%',
      weightNum: 0.30,
      val: customVol,
      setVal: setCustomVol,
      contribution: cVol,
      desc: 'Annualized price fluctuation of daily returns',
      calc: `${customVol.toFixed(0)} × 0.30 = ${cVol.toFixed(2)}`,
    },
    {
      id: 'liq',
      name: 'Liquidity',
      weight: '20%',
      weightNum: 0.20,
      val: customLiq,
      setVal: setCustomLiq,
      contribution: cLiq,
      desc: 'Ease of execution and daily market depth',
      calc: `${customLiq.toFixed(0)} × 0.20 = ${cLiq.toFixed(2)}`,
    },
    {
      id: 'corr',
      name: 'Market Correlation',
      weight: '20%',
      weightNum: 0.20,
      val: customCorr,
      setVal: setCustomCorr,
      contribution: cCorr,
      desc: 'Sensitivity (Beta) relative to broad benchmark index',
      calc: `${customCorr.toFixed(0)} × 0.20 = ${cCorr.toFixed(2)}`,
    },
    {
      id: 'lev',
      name: 'Leverage / Debt',
      weight: '15%',
      weightNum: 0.15,
      val: customLev,
      setVal: setCustomLev,
      contribution: cLev,
      desc: 'Debt-to-capitalization ratio and solvency pressure',
      calc: `${customLev.toFixed(0)} × 0.15 = ${cLev.toFixed(2)}`,
    },
    {
      id: 'track',
      name: 'Track Record',
      weight: '15%',
      weightNum: 0.15,
      val: customTrack,
      setVal: setCustomTrack,
      contribution: cTrack,
      desc: 'Operational history and credit rating tier',
      calc: `${customTrack.toFixed(0)} × 0.15 = ${cTrack.toFixed(2)}`,
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Formula & Model Breakdown */}
      <div className="bg-white border border-[#cddfe2] rounded-lg p-5 space-y-5 shadow-xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#cddfe2] gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#042F34] tracking-tight">
              Weighted Sum: Five Risk Factors
            </h2>
            <p className="text-xs text-[#16232B]/70 mt-0.5">
              Combining five normalized risk factors into one overall score for {stock.symbol} ({stock.name}).
            </p>
          </div>

          <button
            onClick={resetToStockValues}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#E4EEF0] hover:bg-[#d6e6e8] text-[#042F34] transition-colors border border-[#cddfe2] font-semibold self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#042F34]" />
            <span>Reset to Stock Defaults</span>
          </button>
        </div>

        {/* Core Formula & Example in Pale Blue Gray & Warm Yellow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4">
            <span className="text-[11px] font-mono text-[#042F34] uppercase tracking-wider font-bold">
              Mathematical Model
            </span>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#042F34] mt-1">
              Risk Score = Σ (Risk Value × Weight)
            </div>
            <p className="text-xs text-[#16232B]/80 mt-1">
              Each factor has a normalized risk value from 0 to 100 multiplied by its assigned percentage weight.
            </p>
          </div>

          <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4">
            <span className="text-[11px] font-mono text-[#042F34] uppercase tracking-wider font-bold">
              Calculation Example (Volatility)
            </span>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#042F34] mt-1">
              70 × 0.30 = <span className="text-[#825b00]">21.00</span>
            </div>
            <p className="text-xs text-[#16232B]/80 mt-1">
              Repeat for every factor, then add the results. The factor weights sum to 100%.
            </p>
          </div>
        </div>

        {/* Interactive Factor Breakdown Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#16232B]">
            <span className="font-semibold text-[#042F34]">Risk Factor Values & Weights</span>
            <span className="font-mono text-[#16232B]/60">Adjust sliders to test custom scores</span>
          </div>

          <div className="border border-[#cddfe2] rounded-lg overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#cddfe2] text-[#042F34] font-mono bg-[#E4EEF0]">
                  <th className="py-2.5 px-3 font-bold">Factor Name</th>
                  <th className="py-2.5 px-3 font-bold">Risk Value (0–100)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Weight</th>
                  <th className="py-2.5 px-3 font-bold text-right">Contribution (Value × Weight)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EEF0] font-mono">
                {factorItems.map((f) => (
                  <tr key={f.id} className="hover:bg-[#E4EEF0]/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#16232B] font-sans">{f.name}</div>
                      <div className="text-[11px] text-[#16232B]/65 font-sans">{f.desc}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 font-bold text-[#042F34] text-right font-mono">{f.val.toFixed(0)}</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={f.val}
                          onChange={(e) => f.setVal(Number(e.target.value))}
                          className="w-28 sm:w-44 accent-[#042F34] cursor-pointer"
                        />
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-[#E4EEF0] text-[#042F34] font-bold border border-[#cddfe2]">
                        {f.weight}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="font-bold text-[#042F34] text-sm">{f.contribution.toFixed(2)}</div>
                      <div className="text-[10px] text-[#16232B]/60 font-mono">{f.calc}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#E4EEF0] border-t-2 border-[#cddfe2] font-mono">
                  <td colSpan={2} className="py-3 px-3 font-bold text-[#042F34] font-sans text-sm">
                    Total Composite Risk Score
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-[#042F34]">
                    100%
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-[#042F34] text-base">
                    {totalScore} / 100
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>

      {/* 2. Risk Score and Risk Bands */}
      <div className="bg-white border border-[#cddfe2] rounded-lg p-5 space-y-4 shadow-xs">
        <div className="pb-3 border-b border-[#cddfe2]">
          <h2 className="text-lg font-bold text-[#042F34] tracking-tight">
            Risk Score and Risk Bands
          </h2>
          <p className="text-xs text-[#16232B]/70 mt-0.5">
            Classification of the final 0–100 score into Low, Moderate, High, or Very High risk categories.
          </p>
        </div>

        <div className="bg-[#E4EEF0] border border-[#cddfe2] p-6 rounded-lg flex flex-col items-center space-y-4">
          
          {/* Big Score Display */}
          <div className="text-4xl sm:text-5xl font-extrabold font-mono text-[#042F34] tracking-tight">
            {totalScore} <span className="text-xl text-[#16232B]/50 font-normal">/ 100</span>
          </div>

          {/* Simple Pointer */}
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-[#042F34]" />

          {/* 4 Risk Bands Bar */}
          <div className="w-full max-w-xl space-y-1.5">
            <div className="grid grid-cols-4 rounded-lg overflow-hidden text-center text-xs font-mono font-bold border border-[#cddfe2]">
              <div className="bg-[#B5F2DB] text-[#042F34] py-2.5">
                <div className="text-xs font-sans font-bold">Low</div>
                <div className="text-[10px] opacity-85">0–30</div>
              </div>
              <div className="bg-[#FFC933] text-[#042F34] py-2.5">
                <div className="text-xs font-sans font-bold">Moderate</div>
                <div className="text-[10px] opacity-85">31–60</div>
              </div>
              <div className="bg-orange-500 text-white py-2.5">
                <div className="text-xs font-sans font-bold">High</div>
                <div className="text-[10px] opacity-85">61–80</div>
              </div>
              <div className="bg-rose-600 text-white py-2.5">
                <div className="text-xs font-sans font-bold">Very High</div>
                <div className="text-[10px] opacity-85">81–100</div>
              </div>
            </div>

            {/* Position Indicator Line */}
            <div className="relative w-full h-2 bg-white rounded-full overflow-hidden border border-[#cddfe2]">
              <div
                className="absolute top-0 bottom-0 left-0 transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, totalScore))}%`,
                  backgroundColor: bandHex,
                }}
              />
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="w-full max-w-xl">
            <div className={`w-full py-2.5 px-4 rounded-lg text-center font-bold text-sm border shadow-xs ${bandClass}`}>
              A score of {totalScore} falls in the {riskBand} Risk band
            </div>
          </div>

        </div>
      </div>

      {/* 3. Foundational Concepts (Direct Contents) */}
      <div className="bg-white border border-[#cddfe2] rounded-lg p-5 space-y-4 shadow-xs">
        <div className="pb-3 border-b border-[#cddfe2]">
          <h2 className="text-lg font-bold text-[#042F34] tracking-tight">
            How Each Concept Contributes
          </h2>
          <p className="text-xs text-[#16232B]/70 mt-0.5">
            The mathematical foundations connecting market data to the final risk classification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#042F34] text-[#B5F2DB] font-bold font-mono text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-sm font-bold text-[#042F34]">Statistics</h3>
            </div>
            <p className="text-xs text-[#16232B]/80 leading-relaxed">
              Analyses historical price series to compute daily returns and standard deviation measuring past volatility.
            </p>
          </div>

          <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#042F34] text-[#B5F2DB] font-bold font-mono text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-bold text-[#042F34]">Probability</h3>
            </div>
            <p className="text-xs text-[#16232B]/80 leading-relaxed">
              Quantifies the likelihood of adverse events like price declines or severe market slumps.
            </p>
          </div>

          <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#042F34] text-[#B5F2DB] font-bold font-mono text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="text-sm font-bold text-[#042F34]">Normalization</h3>
            </div>
            <p className="text-xs text-[#16232B]/80 leading-relaxed">
              Maps diverse units (percentages, currency volume, credit grades) onto a common 0–100 scale.
            </p>
          </div>

          <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#042F34] text-[#B5F2DB] font-bold font-mono text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="text-sm font-bold text-[#042F34]">Percentages</h3>
            </div>
            <p className="text-xs text-[#16232B]/80 leading-relaxed">
              Assigns calibrated weights to each risk factor based on financial importance, summing to 100%.
            </p>
          </div>

          <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#042F34] text-[#B5F2DB] font-bold font-mono text-xs flex items-center justify-center">
                5
              </span>
              <h3 className="text-sm font-bold text-[#042F34]">Weighted Sum</h3>
            </div>
            <p className="text-xs text-[#16232B]/80 leading-relaxed">
              Combines individual factor scores by weight into a single synthesized risk measurement.
            </p>
          </div>

          <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#042F34] text-[#B5F2DB] font-bold font-mono text-xs flex items-center justify-center">
                6
              </span>
              <h3 className="text-sm font-bold text-[#042F34]">Risk Scoring</h3>
            </div>
            <p className="text-xs text-[#16232B]/80 leading-relaxed">
              Evaluates the final 0–100 score and classifies it into Low, Moderate, High, or Very High bands.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
