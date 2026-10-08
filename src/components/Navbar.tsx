import React, { useState, useEffect } from 'react';
import { Search, Shield, Activity, Globe } from 'lucide-react';
import { POPULAR_STOCKS } from '../data/stockDatabase';

interface NavbarProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  activeTab: 'tracker' | 'model' | 'dataValues';
  setActiveTab: (tab: 'tracker' | 'model' | 'dataValues') => void;
}

interface SearchItem {
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSymbol,
  onSelectSymbol,
  activeTab,
  setActiveTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [apiResults, setApiResults] = useState<SearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search querying the Indian Stock Market API
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setApiResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/indian/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            setApiResults(data.results);
          }
        }
      } catch (err) {
        console.warn('Live Indian search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combined list of pre-cached matches and Indian API results
  const localFiltered = POPULAR_STOCKS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).map((s) => ({
    symbol: s.symbol,
    name: s.name,
    exchange: s.exchange,
    sector: s.sector,
  }));

  const allResults: SearchItem[] = [];
  const seenSymbols = new Set<string>();

  for (const item of [...apiResults, ...localFiltered]) {
    const cleanSym = item.symbol.replace(/\.NS|\.BO/, '');
    if (!seenSymbols.has(cleanSym)) {
      seenSymbols.add(cleanSym);
      allResults.push({
        ...item,
        symbol: cleanSym,
      });
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allResults.length > 0) {
      onSelectSymbol(allResults[0].symbol);
      setIsSearchOpen(false);
      setSearchQuery('');
    } else if (searchQuery.trim()) {
      onSelectSymbol(searchQuery.trim().toUpperCase());
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-[#042F34] border-b border-[#16232B] text-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          
          {/* Brand Identity with Warm Yellow Accent */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#FFC933] flex items-center justify-center text-[#042F34] shadow-xs">
              <Shield className="w-4 h-4 fill-[#042F34]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white font-mono uppercase leading-none">
                  ANNRIYA RISK FINDER
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#B5F2DB] text-[#042F34]">
                  <Globe className="w-2.5 h-2.5" />
                  NSE/BSE API
                </span>
              </div>
              <span className="text-[11px] text-[#B5F2DB] hidden sm:block leading-none mt-1">
                Quantitative Risk Assessments & Indian Stock Market Live Feed
              </span>
            </div>
          </div>

          {/* Navigation Tabs - Deep Teal & Mint Green */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'tracker'
                  ? 'bg-[#B5F2DB] text-[#042F34] font-bold shadow-xs'
                  : 'text-[#E4EEF0] hover:text-white hover:bg-white/10'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Stock Tracker</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#042F34] animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('model')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'model'
                  ? 'bg-[#B5F2DB] text-[#042F34] font-bold shadow-xs'
                  : 'text-[#E4EEF0] hover:text-white hover:bg-white/10'
              }`}
            >
              5-Factor Risk Model
            </button>

            <button
              onClick={() => setActiveTab('dataValues')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'dataValues'
                  ? 'bg-[#B5F2DB] text-[#042F34] font-bold shadow-xs'
                  : 'text-[#E4EEF0] hover:text-white hover:bg-white/10'
              }`}
            >
              Data to Risk Values
            </button>
          </nav>

          {/* Live Indian Stock Search & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search NSE/BSE stock..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-36 sm:w-48 pl-7 pr-3 py-1 text-xs bg-[#16232B] border border-white/20 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-[#B5F2DB] font-mono"
                />
                <Search className="w-3.5 h-3.5 text-[#B5F2DB] absolute left-2 top-1/2 -translate-y-1/2" />
              </form>

              {isSearchOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSearchOpen(false)} />
                  <div className="absolute right-0 mt-1 w-72 bg-[#16232B] border border-[#042F34] rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto p-1.5 text-xs text-white">
                    <div className="px-2 py-1 text-[10px] text-[#B5F2DB]/70 font-mono flex items-center justify-between border-b border-white/10 mb-1">
                      <span>{isSearching ? 'Querying Indian API...' : 'NSE & BSE Equities'}</span>
                      <span className="text-[9px] bg-[#042F34] text-[#B5F2DB] px-1 rounded">LIVE</span>
                    </div>

                    {allResults.length === 0 ? (
                      <div className="p-3 text-center text-[#E4EEF0]/60 text-xs">
                        {searchQuery.trim().length < 2 ? 'Type at least 2 letters...' : 'No Indian stock match found.'}
                      </div>
                    ) : (
                      allResults.map((s) => (
                        <button
                          key={s.symbol}
                          onClick={() => {
                            onSelectSymbol(s.symbol);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors hover:bg-[#042F34] ${
                            currentSymbol === s.symbol ? 'bg-[#042F34] text-[#B5F2DB] font-bold' : 'text-[#E4EEF0]'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-mono font-bold block">{s.symbol}</span>
                            <span className="text-[10px] text-[#B5F2DB]/80 truncate block">{s.name}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#E4EEF0]/20 text-[#B5F2DB] shrink-0">
                            {s.exchange || 'NSE'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Mobile Tab Row */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto py-2 border-t border-[#16232B] text-xs">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'tracker' ? 'bg-[#B5F2DB] text-[#042F34] font-bold' : 'text-[#E4EEF0]'
            }`}
          >
            <Activity className="w-3 h-3" />
            Live Tracker
          </button>
          <button
            onClick={() => setActiveTab('model')}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'model' ? 'bg-[#B5F2DB] text-[#042F34] font-bold' : 'text-[#E4EEF0]'
            }`}
          >
            5-Factor Model
          </button>
          <button
            onClick={() => setActiveTab('dataValues')}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'dataValues' ? 'bg-[#B5F2DB] text-[#042F34] font-bold' : 'text-[#E4EEF0]'
            }`}
          >
            Data to Risk
          </button>
        </div>

      </div>
    </header>
  );
};
