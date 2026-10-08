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
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'IN' | 'US'>('IN');

  const curr = currency || (stock.market === 'IN' ? '₹' : '$');
  const exch = exchange || (stock.market === 'IN' ? 'NSE' : 'NASDAQ');

  const filteredWatchlist = POPULAR_STOCKS.filter((s) => {
    if (marketFilter === 'ALL') return true;
    return s.market === marketFilter;
  });

  const getRiskBadge = (band: string) => {
    switch (band) {
      case 'Low':
        return 'bg-[#B5F2DB] text-[#042F34] border-[#8ee3c2]';
      case 'Moderate':
        return 'bg-[#FFC933]/20 text-[#825b00] border-[#FFC933]';
      case 'High':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Very High':
      default:
        return 'bg-rose-100 text-rose-900 border-rose-300';
    }
  };

  return (
    <section className="bg-white border-b border-[#cddfe2] py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-3.5">
        
        {/* Market Filter & Quick Stock Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[#16232B]/70 font-medium">Select Market:</span>
            <div className="flex items-center bg-[#E4EEF0] p-0.5 rounded-md border border-[#cddfe2]">
              <button
                onClick={() => setMarketFilter('IN')}
                className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                  marketFilter === 'IN' ? 'bg-[#042F34] text-[#B5F2DB] font-bold shadow-xs' : 'text-[#16232B] hover:text-[#042F34]'
                }`}
              >
                🇮🇳 Indian Stocks
              </button>
              <button
                onClick={() => setMarketFilter('US')}
                className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                  marketFilter === 'US' ? 'bg-[#042F34] text-[#B5F2DB] font-bold shadow-xs' : 'text-[#16232B] hover:text-[#042F34]'
                }`}
              >
                🇺🇸 US Stocks
              </button>
              <button
                onClick={() => setMarketFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                  marketFilter === 'ALL' ? 'bg-[#042F34] text-[#B5F2DB] font-bold shadow-xs' : 'text-[#16232B] hover:text-[#042F34]'
                }`}
              >
                All
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {filteredWatchlist.map((s) => (
              <button
                key={s.symbol}
                onClick={() => onSelectSymbol(s.symbol)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors shrink-0 flex items-center gap-1.5 ${
                  symbol === s.symbol
                    ? 'bg-[#042F34] text-[#B5F2DB] font-bold shadow-xs'
                    : 'text-[#16232B] bg-[#E4EEF0] hover:bg-[#d6e6e8] border border-[#cddfe2]'
                }`}
              >
                <span>{s.symbol}</span>
                <span className="text-[11px] opacity-75">{s.currency}{s.price.toFixed(0)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Stock Overview Card */}
        <div className="bg-[#E4EEF0] border border-[#cddfe2] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Ticker & Company Name */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-[#042F34]">{symbol}</span>
              <span className="text-base font-medium text-[#16232B]">{name}</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#B5F2DB] text-[#042F34] font-bold border border-[#8ee3c2]">
                {exch}
              </span>
              {stock.market === 'IN' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#042F34] text-[#B5F2DB] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B5F2DB] animate-pulse" />
                  Live Indian API
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#16232B]/70">
              <span>{sector}</span>
              <span>•</span>
              <span>Market Cap: <strong className="text-[#042F34] font-mono">{marketCap}</strong></span>
              {peRatio && (
                <>
                  <span>•</span>
                  <span>P/E: <strong className="text-[#042F34] font-mono">{peRatio}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Price, Volatility & Risk Band Pill */}
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-[11px] text-[#16232B]/70 font-medium uppercase tracking-wider">Current Price</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#042F34]">
                  {curr}{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                    change >= 0 ? 'text-[#065F46]' : 'text-rose-600'
                  }`}
                >
                  {change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="border-l border-[#cddfe2] pl-4">
              <div className="text-[11px] text-[#16232B]/70 font-medium uppercase tracking-wider">Annualized Volatility</div>
              <div className="text-xl font-bold font-mono text-[#042F34]">
                {(stats.annualizedVolatility > 1 ? stats.annualizedVolatility : stats.annualizedVolatility * 100).toFixed(1)}%
              </div>
            </div>

            <div className="border-l border-[#cddfe2] pl-4">
              <div className="text-[11px] text-[#16232B]/70 font-medium uppercase tracking-wider">Risk Score</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-extrabold font-mono text-[#042F34]">
                  {fiveFactorModel.totalScore}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRiskBadge(fiveFactorModel.riskBand)}`}>
                  {fiveFactorModel.riskBand} Risk
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
