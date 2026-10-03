import React, { useState, useEffect } from 'react';
import { POPULAR_STOCKS, getStockData } from '../data/stockDatabase';
import { PortfolioItem, PortfolioRiskMetrics } from '../types/stock';
import { RotateCcw } from 'lucide-react';

export const PortfolioStressTester: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([
    { symbol: 'AAPL', weight: 30 },
    { symbol: 'NVDA', weight: 20 },
    { symbol: 'O', weight: 25 },
    { symbol: 'TLT', weight: 25 },
  ]);

  const [metrics, setMetrics] = useState<PortfolioRiskMetrics | null>(null);

  const fetchPortfolioAnalysis = async (currentItems: PortfolioItem[]) => {
    try {
      const res = await fetch('/api/portfolio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: currentItems }),
      });
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed portfolio analysis:', err);
    }
  };

  useEffect(() => {
    fetchPortfolioAnalysis(items);
  }, [items]);

  const handleWeightChange = (symbol: string, newWeight: number) => {
    setItems((prev) =>
      prev.map((it) => (it.symbol === symbol ? { ...it, weight: newWeight } : it))
    );
  };

  const handleRemoveItem = (symbol: string) => {
    if (items.length > 1) {
      setItems(items.filter((it) => it.symbol !== symbol));
    }
  };

  const handleAddStock = (symbolToAdd: string) => {
    if (!items.some((it) => it.symbol === symbolToAdd)) {
      setItems([...items, { symbol: symbolToAdd, weight: 15 }]);
    }
  };

  const handleResetWeights = () => {
    const equalWeight = Math.floor(100 / items.length);
    setItems(items.map((it) => ({ ...it, weight: equalWeight })));
  };

  return (
    <div className="space-y-6 text-[#1a1a1a]">
      
      {/* Portfolio Builder Banner */}
      <div className="bg-white border border-[#1a1a1a]/15 rounded p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1a1a1a]/10">
          <div>
            <div className="label-caps">Portfolio Risk Modeler</div>
            <h2 className="text-xl font-bold font-serif-brand text-[#1a1a1a]">
              Interest Rate &amp; Volatility Stress Testing Framework
            </h2>
          </div>

          <button
            onClick={handleResetWeights}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f7f4] hover:bg-[#1a1a1a] hover:text-white border border-[#1a1a1a]/20 text-[#1a1a1a] text-xs font-mono-code transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Equal Weight
          </button>
        </div>

        {/* Allocation Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const stock = getStockData(item.symbol);
            return (
              <div
                key={item.symbol}
                className="p-4 bg-[#f8f7f4] border border-[#1a1a1a]/15 space-y-2 rounded-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono-code">
                    <strong className="text-[#1a1a1a] text-sm">{item.symbol}</strong>
                    <span className="text-[#1a1a1a]/60 text-[11px] font-sans truncate max-w-[120px]">{stock.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono-code">
                    <span className="text-[#2b3eff] font-bold text-sm">{item.weight}%</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(item.symbol)}
                        className="text-[#1a1a1a]/40 hover:text-[#e63946] transition-colors text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={item.weight}
                  onChange={(e) => handleWeightChange(item.symbol, parseInt(e.target.value) || 0)}
                  className="w-full accent-[#2b3eff] bg-[#1a1a1a]/20 h-1 rounded cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] text-[#1a1a1a]/60 font-mono-code">
                  <span>1Y Vol: {(stock.metrics.volatility1y * 100).toFixed(1)}%</span>
                  <span>Rate Beta: {stock.metrics.rateBeta.toFixed(2)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Stock */}
        <div className="pt-2 flex items-center gap-2 overflow-x-auto text-xs font-mono-code">
          <span className="label-caps shrink-0">Add Asset:</span>
          {POPULAR_STOCKS.filter((s) => !items.some((it) => it.symbol === s.symbol)).map((s) => (
            <button
              key={s.symbol}
              onClick={() => handleAddStock(s.symbol)}
              className="px-2.5 py-1 bg-[#f8f7f4] border border-[#1a1a1a]/20 text-[#1a1a1a] hover:bg-[#2b3eff] hover:text-white transition-colors shrink-0"
            >
              + {s.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Calculated Portfolio Risk Overview */}
      {metrics && (
        <div className="space-y-6">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-code text-xs">
            <div className="bg-white border border-[#1a1a1a]/15 p-4 rounded space-y-1">
              <span className="label-caps">Portfolio Volatility</span>
              <div className="text-2xl font-bold font-sans text-[#1a1a1a]">{metrics.portfolioVolatility}%</div>
              <p className="text-[10px] text-[#1a1a1a]/60 font-sans">1Y Annualized portfolio standard deviation</p>
            </div>

            <div className="bg-white border border-[#1a1a1a]/15 p-4 rounded space-y-1">
              <span className="label-caps">Portfolio 95% VaR</span>
              <div className="text-2xl font-bold font-sans text-[#e63946]">-{metrics.portfolioVar95}%</div>
              <p className="text-[10px] text-[#1a1a1a]/60 font-sans">Max daily loss at 95% confidence limit</p>
            </div>

            <div className="bg-white border border-[#1a1a1a]/15 p-4 rounded space-y-1">
              <span className="label-caps">Rate Duration Beta</span>
              <div className={`text-2xl font-bold font-sans ${metrics.portfolioRateBeta >= 0 ? 'text-[#00a651]' : 'text-[#e63946]'}`}>
                {metrics.portfolioRateBeta > 0 ? '+' : ''}{metrics.portfolioRateBeta}%
              </div>
              <p className="text-[10px] text-[#1a1a1a]/60 font-sans">% return impact per +100bps yield shift</p>
            </div>

            <div className="bg-white border border-[#1a1a1a]/15 p-4 rounded space-y-1">
              <span className="label-caps">Diversification Score</span>
              <div className="text-2xl font-bold font-sans text-[#2b3eff]">{metrics.diversificationScore}/100</div>
              <p className="text-[10px] text-[#1a1a1a]/60 font-sans">Uncorrelated asset variance reduction index</p>
            </div>
          </div>

          {/* Macro Scenario Stress Test Matrix */}
          <div className="bg-white border border-[#1a1a1a]/15 rounded p-6 space-y-4">
            <div className="pb-3 border-b border-[#1a1a1a]/10">
              <div className="label-caps">Simulated Macro Regimes</div>
              <h3 className="font-serif-brand text-lg font-bold text-[#1a1a1a]">Macroeconomic Shock Matrix</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.stressTestResults.map((scenario, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#f8f7f4] border border-[#1a1a1a]/15 space-y-2 text-xs rounded-sm"
                >
                  <div className="flex items-center justify-between font-mono-code">
                    <strong className="text-[#1a1a1a] text-sm">{scenario.scenarioName}</strong>
                    <span
                      className={`px-2 py-0.5 text-[0.6rem] font-bold uppercase ${
                        scenario.riskLevel === 'Critical'
                          ? 'bg-[#e63946] text-white'
                          : scenario.riskLevel === 'Severe'
                          ? 'bg-[#1a1a1a] text-white'
                          : 'bg-[#00a651] text-white'
                      }`}
                    >
                      {scenario.riskLevel}
                    </span>
                  </div>

                  <p className="text-[#1a1a1a]/70 font-sans leading-relaxed">
                    {scenario.description}
                  </p>

                  <div className="flex items-center justify-between p-2 bg-white border border-[#1a1a1a]/15 font-mono-code">
                    <span className="label-caps">Estimated Portfolio Impact:</span>
                    <span
                      className={`font-bold text-sm ${
                        scenario.estimatedStockImpact >= 0 ? 'text-[#00a651]' : 'text-[#e63946]'
                      }`}
                    >
                      {scenario.estimatedStockImpact > 0 ? '+' : ''}
                      {scenario.estimatedStockImpact}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
