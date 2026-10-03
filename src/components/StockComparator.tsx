import React, { useState } from 'react';
import { POPULAR_STOCKS, getStockData } from '../data/stockDatabase';
import { StockQuote } from '../types/stock';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';

interface StockComparatorProps {
  volThresholdPercent?: number;
}

export const StockComparator: React.FC<StockComparatorProps> = ({ volThresholdPercent = 25.0 }) => {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['AAPL', 'NVDA', 'O', 'TLT']);
  const [newTickerInput, setNewTickerInput] = useState('');

  const stocksToCompare: StockQuote[] = selectedSymbols.map((sym) => getStockData(sym, volThresholdPercent));

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTickerInput.trim()) return;
    const cleanSym = newTickerInput.trim().toUpperCase();
    if (!selectedSymbols.includes(cleanSym) && selectedSymbols.length < 5) {
      setSelectedSymbols([...selectedSymbols, cleanSym]);
    }
    setNewTickerInput('');
  };

  const handleRemoveTicker = (sym: string) => {
    if (selectedSymbols.length > 1) {
      setSelectedSymbols(selectedSymbols.filter((s) => s !== sym));
    }
  };

  const radarData = [
    {
      subject: '1Y Volatility',
      ...stocksToCompare.reduce((acc, s) => ({ ...acc, [s.symbol]: Math.min(100, Math.round(s.metrics.volatility1y * 200)) }), {}),
    },
    {
      subject: 'Rate Sensitivity',
      ...stocksToCompare.reduce((acc, s) => ({ ...acc, [s.symbol]: Math.min(100, Math.round(s.metrics.durationProxy * 12)) }), {}),
    },
    {
      subject: 'Value at Risk (95%)',
      ...stocksToCompare.reduce((acc, s) => ({ ...acc, [s.symbol]: Math.min(100, Math.round(s.metrics.var95Daily * 2500)) }), {}),
    },
    {
      subject: 'Max Drawdown',
      ...stocksToCompare.reduce((acc, s) => ({ ...acc, [s.symbol]: Math.min(100, Math.round(s.metrics.maxDrawdown * 150)) }), {}),
    },
    {
      subject: 'Market Beta',
      ...stocksToCompare.reduce((acc, s) => ({ ...acc, [s.symbol]: Math.min(100, Math.round(s.metrics.betaToMarket * 50)) }), {}),
    },
  ];

  const colors = ['#66a3ff', '#f43f5e', '#10b981', '#f59e0b', '#cce0ff'];

  return (
    <div className="space-y-6 text-white">
      
      {/* Selector & Add Ticker Bar */}
      <div className="bg-[#001f3f] border border-[#00509e] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#00509e]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#007acc]" />
              Multi-Asset Risk Comparator
            </h2>
            <p className="text-xs text-[#66a3ff] mt-0.5">
              Compare 5-Factor Risk Model dimensions, historical volatility, and duration proxy across assets.
            </p>
          </div>

          <form onSubmit={handleAddTicker} className="flex gap-2">
            <input
              type="text"
              placeholder="Add Ticker..."
              value={newTickerInput}
              onChange={(e) => setNewTickerInput(e.target.value)}
              className="px-3 py-1 text-xs bg-[#00264d] border border-[#00509e] rounded-md text-white font-mono placeholder-[#66a3ff]/60 focus:outline-none focus:border-[#007acc]"
            />
            <button
              type="submit"
              disabled={selectedSymbols.length >= 5}
              className="px-3 py-1 bg-[#007acc] hover:bg-[#00509e] text-white font-medium text-xs rounded-md flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </div>

        {/* Selected Ticker Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {stocksToCompare.map((stock, idx) => (
            <div
              key={stock.symbol}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#00264d] border border-[#00509e] text-xs font-mono"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
              <strong className="text-white">{stock.symbol}</strong>
              <span className="text-[#66a3ff] text-[10px] font-sans">(${stock.price.toFixed(2)})</span>
              {selectedSymbols.length > 1 && (
                <button
                  onClick={() => handleRemoveTicker(stock.symbol)}
                  className="text-slate-400 hover:text-rose-400 transition-colors ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Radar Chart & Comparison Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Radar Chart */}
        <div className="lg:col-span-5 bg-[#001f3f] border border-[#00509e] rounded-xl p-5 flex flex-col justify-between">
          <div className="pb-2 border-b border-[#00509e]">
            <h3 className="text-xs font-semibold text-white font-mono uppercase">Risk Overlay Radar</h3>
            <p className="text-[11px] text-[#66a3ff]">5-Dimension normalized profile comparison</p>
          </div>

          <div className="h-[300px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#00509e" />
                <PolarAngleAxis dataKey="subject" stroke="#66a3ff" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#003366" fontSize={9} />
                {stocksToCompare.map((stock, idx) => (
                  <Radar
                    key={stock.symbol}
                    name={stock.symbol}
                    dataKey={stock.symbol}
                    stroke={colors[idx % colors.length]}
                    fill={colors[idx % colors.length]}
                    fillOpacity={0.2}
                  />
                ))}
                <Tooltip contentStyle={{ backgroundColor: '#00264d', borderColor: '#00509e', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quantitative Comparison Table */}
        <div className="lg:col-span-7 bg-[#001f3f] border border-[#00509e] rounded-xl p-5 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#00509e] text-[#66a3ff]">
                <th className="py-2 px-3 font-medium font-sans">Metric</th>
                {stocksToCompare.map((s, idx) => (
                  <th key={s.symbol} className="py-2 px-3 font-semibold text-right" style={{ color: colors[idx % colors.length] }}>
                    {s.symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00509e]/50">
              <tr>
                <td className="py-2 px-3 font-sans text-[#cce0ff]">Current Price</td>
                {stocksToCompare.map(s => (
                  <td key={s.symbol} className="py-2 px-3 text-right text-white">${s.price.toFixed(2)}</td>
                ))}
              </tr>

              <tr>
                <td className="py-2 px-3 font-sans text-[#cce0ff]">5-Factor Risk Score</td>
                {stocksToCompare.map(s => (
                  <td key={s.symbol} className="py-2 px-3 text-right font-bold text-amber-400">
                    {s.metrics.overallRiskScore} / 100
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2 px-3 font-sans text-[#cce0ff]">1-Year Volatility (HV)</td>
                {stocksToCompare.map(s => (
                  <td key={s.symbol} className="py-2 px-3 text-right text-white">
                    {(s.metrics.volatility1y * 100).toFixed(1)}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2 px-3 font-sans text-[#cce0ff]">Interest Rate Beta</td>
                {stocksToCompare.map(s => (
                  <td key={s.symbol} className={`py-2 px-3 text-right font-bold ${s.metrics.rateBeta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {s.metrics.rateBeta > 0 ? '+' : ''}{s.metrics.rateBeta.toFixed(2)}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2 px-3 font-sans text-[#cce0ff]">Duration Proxy</td>
                {stocksToCompare.map(s => (
                  <td key={s.symbol} className="py-2 px-3 text-right text-amber-300">
                    {s.metrics.durationProxy.toFixed(1)} yrs
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2 px-3 font-sans text-[#cce0ff]">95% Daily VaR</td>
                {stocksToCompare.map(s => (
                  <td key={s.symbol} className="py-2 px-3 text-right text-rose-400">
                    -{(s.metrics.var95Daily * 100).toFixed(2)}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2 px-3 font-sans text-[#cce0ff]">Sharpe Ratio</td>
                {stocksToCompare.map(s => (
                  <td key={s.symbol} className="py-2 px-3 text-right text-emerald-400 font-bold">
                    {s.metrics.sharpeRatio.toFixed(2)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
