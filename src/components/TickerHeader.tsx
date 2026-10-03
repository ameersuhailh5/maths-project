import React from 'react';
import { StockQuote } from '../types/stock';
import { POPULAR_STOCKS } from '../data/stockDatabase';
import { TrendingUp, TrendingDown, Zap, ShieldCheck } from 'lucide-react';

interface TickerHeaderProps {
  stock: StockQuote;
  onSelectSymbol: (symbol: string) => void;
}

export const TickerHeader: React.FC<TickerHeaderProps> = ({ stock, onSelectSymbol }) => {
  const { symbol, name, sector, price, change, changePercent, marketCap, peRatio, dividendYield, metrics } = stock;

  return (
    <section className="bg-[#001f3f] border-b border-[#00509e]/80 py-5 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Minimal Asset Selector Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[#66a3ff] shrink-0 font-medium">Watchlist:</span>
          <div className="flex items-center gap-1.5">
            {POPULAR_STOCKS.map((s) => (
              <button
                key={s.symbol}
                onClick={() => onSelectSymbol(s.symbol)}
                className={`px-2 py-0.5 text-xs font-mono rounded transition-colors shrink-0 ${
                  symbol === s.symbol
                    ? 'bg-[#007acc] text-white font-bold'
                    : 'text-[#66a3ff] hover:text-white'
                }`}
              >
                {s.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Minimal Ticker Overview Grid */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#00264d] p-4 rounded-xl border border-[#00509e]/80">
          
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold font-mono tracking-tight text-white">{symbol}</span>
              <span className="text-sm font-medium text-[#cce0ff]">{name}</span>
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
              {dividendYield !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Yield: <strong className="text-emerald-400 font-mono">{dividendYield}%</strong></span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 font-mono">
            {/* Price Box */}
            <div>
              <div className="text-[10px] uppercase text-[#66a3ff]">Price</div>
              <div className="text-2xl font-bold text-white">${price.toFixed(2)}</div>
              <div className={`text-xs flex items-center gap-1 ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)</span>
              </div>
            </div>

            <div className="h-8 w-px bg-[#00509e]" />

            {/* Overall Risk Score */}
            <div>
              <div className="text-[10px] uppercase text-[#66a3ff]">Risk Score</div>
              <div className="text-2xl font-bold text-white">{metrics.overallRiskScore} <span className="text-xs text-[#66a3ff]">/100</span></div>
              <div className="text-xs text-amber-400 font-sans">{metrics.overallRiskLevel} Risk</div>
            </div>

            <div className="h-8 w-px bg-[#00509e]" />

            {/* 1Y Volatility */}
            <div>
              <div className="text-[10px] uppercase text-[#66a3ff]">1Y Volatility</div>
              <div className="text-2xl font-bold text-white">{(metrics.volatility1y * 100).toFixed(1)}%</div>
              <div className="text-xs text-[#66a3ff]">Annualized</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
