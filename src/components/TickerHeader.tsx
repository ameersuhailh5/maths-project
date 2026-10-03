import React, { useState } from 'react';
import { StockQuote } from '../types/stock';
import { POPULAR_STOCKS } from '../data/stockDatabase';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerHeaderProps {
  stock: StockQuote;
  onSelectSymbol: (symbol: string) => void;
}

export const TickerHeader: React.FC<TickerHeaderProps> = ({ stock, onSelectSymbol }) => {
  const { symbol, name, sector, price, change, changePercent, marketCap, peRatio, stats, fiveFactorModel, currency, exchange } = stock;
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'IN' | 'US'>('ALL');

  const curr = currency || (stock.market === 'IN' ? '₹' : '$');
  const exch = exchange || (stock.market === 'IN' ? 'NSE' : 'NASDAQ');

  const filteredWatchlist = POPULAR_STOCKS.filter((s) => {
    if (marketFilter === 'ALL') return true;
    return s.market === marketFilter;
  });

  const bandColor =
    fiveFactorModel.riskBand === 'Low'
      ? 'text-emerald-400'
      : fiveFactorModel.riskBand === 'Moderate'
      ? 'text-amber-400'
      : fiveFactorModel.riskBand === 'High'
      ? 'text-orange-400'
      : 'text-rose-500';

  return (
    <section className="bg-[#001f3f] border-b border-[#00509e]/80 py-4 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Watchlist Quick Select with Indian / Global filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[#66a3ff] font-medium">Market:</span>
            <div className="flex items-center bg-[#001429] p-0.5 rounded border border-[#00509e]">
              <button
                onClick={() => setMarketFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  marketFilter === 'ALL' ? 'bg-[#007acc] text-white font-bold' : 'text-[#66a3ff] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMarketFilter('IN')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  marketFilter === 'IN' ? 'bg-[#007acc] text-white font-bold' : 'text-[#66a3ff] hover:text-white'
                }`}
              >
                🇮🇳 Indian (NSE)
              </button>
              <button
                onClick={() => setMarketFilter('US')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  marketFilter === 'US' ? 'bg-[#007acc] text-white font-bold' : 'text-[#66a3ff] hover:text-white'
                }`}
              >
                🇺🇸 US
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {filteredWatchlist.map((s) => (
              <button
                key={s.symbol}
                onClick={() => onSelectSymbol(s.symbol)}
                className={`px-2 py-0.5 text-xs font-mono rounded transition-colors shrink-0 flex items-center gap-1 ${
                  symbol === s.symbol
                    ? 'bg-[#007acc] text-white font-bold ring-1 ring-[#cce0ff]'
                    : 'text-[#cce0ff] hover:text-white bg-[#00264d] border border-[#00509e]/60'
                }`}
              >
                <span>{s.symbol}</span>
                <span className="text-[10px] opacity-75">{s.currency}{s.price.toFixed(0)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Box */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#00264d] p-4 rounded-xl border border-[#00509e]">
          
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold font-mono tracking-tight text-white">{symbol}</span>
              <span className="text-sm font-medium text-[#cce0ff]">{name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#001429] border border-[#00509e] text-amber-400 font-bold">
                {exch}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#66a3ff]">
              <span>{sector}</span>
              <span aria-hidden="true">·</span>
              <span>Cap: <strong className="text-white font-mono">{marketCap}</strong></span>
              {peRatio && peRatio > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>P/E: <strong className="text-white font-mono">{peRatio}</strong></span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 font-mono">
            {/* Price Box with Currency Symbol */}
            <div>
              <div className="text-[10px] uppercase text-[#66a3ff]">Current Price</div>
              <div className="text-2xl font-bold text-white">{curr}{price.toFixed(2)}</div>
              <div className={`text-xs flex items-center gap-1 ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{change >= 0 ? '+' : ''}{curr}{change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)</span>
              </div>
            </div>

            <div className="h-8 w-px bg-[#00509e]" />

            {/* Risk Score */}
            <div>
              <div className="text-[10px] uppercase text-[#66a3ff]">Risk Score</div>
              <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                <span>{fiveFactorModel.totalScore}</span>
                <span className="text-xs text-[#66a3ff]">/100</span>
              </div>
              <div className={`text-xs font-bold font-sans ${bandColor}`}>
                {fiveFactorModel.riskBand} Risk ({fiveFactorModel.riskRange})
              </div>
            </div>

            <div className="h-8 w-px bg-[#00509e]" />

            {/* Annualized Volatility */}
            <div>
              <div className="text-[10px] uppercase text-[#66a3ff]">Volatility (σ)</div>
              <div className="text-2xl font-bold text-white">{stats.annualizedVolatility}%</div>
              <div className="text-xs text-[#66a3ff]">Annualized</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
