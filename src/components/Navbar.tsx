import React, { useState } from 'react';
import { Search, Shield, FileSpreadsheet } from 'lucide-react';
import { POPULAR_STOCKS } from '../data/stockDatabase';

interface NavbarProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  activeTab: 'model' | 'dataValues' | 'tools' | 'charts';
  setActiveTab: (tab: 'model' | 'dataValues' | 'tools' | 'charts') => void;
  onOpenUploader: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSymbol,
  onSelectSymbol,
  activeTab,
  setActiveTab,
  onOpenUploader,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredStocks = POPULAR_STOCKS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelectSymbol(searchQuery.trim().toUpperCase());
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#001f3f] border-b border-[#00509e]/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          
          {/* Brand Identity: Matching Slide 1 Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 shadow-md">
              <Shield className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white font-mono uppercase block leading-none">
                ANNRIYA RISK FINDER
              </span>
              <span className="text-[10px] text-[#66a3ff] hidden sm:block leading-none mt-0.5">
                Quantitative Risk Assessments of Investment Opportunities
              </span>
            </div>
          </div>

          {/* Minimal Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#66a3ff]">
            <button
              onClick={() => setActiveTab('model')}
              className={`py-4 transition-all relative ${
                activeTab === 'model'
                  ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#007acc]'
                  : 'hover:text-white'
              }`}
            >
              5-Factor Risk Model
            </button>

            <button
              onClick={() => setActiveTab('dataValues')}
              className={`py-4 transition-all relative ${
                activeTab === 'dataValues'
                  ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#007acc]'
                  : 'hover:text-white'
              }`}
            >
              Data to Risk Values
            </button>

            <button
              onClick={() => setActiveTab('tools')}
              className={`py-4 transition-all relative ${
                activeTab === 'tools'
                  ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#007acc]'
                  : 'hover:text-white'
              }`}
            >
              Technical Tools
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`py-4 transition-all relative ${
                activeTab === 'charts'
                  ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#007acc]'
                  : 'hover:text-white'
              }`}
            >
              30D SMA Forecast
            </button>
          </nav>

          {/* Search & Utility Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Ticker..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-28 sm:w-40 pl-7 pr-3 py-1 text-xs bg-[#00264d] border border-[#00509e] rounded-md text-white placeholder-[#66a3ff]/60 focus:outline-none focus:border-[#007acc] font-mono"
                />
                <Search className="w-3.5 h-3.5 text-[#66a3ff] absolute left-2 top-1/2 -translate-y-1/2" />
              </form>

              {isSearchOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSearchOpen(false)} />
                  <div className="absolute right-0 mt-1 w-64 bg-[#00264d] border border-[#00509e] rounded-md shadow-xl z-20 max-h-72 overflow-y-auto p-1 text-xs">
                    {filteredStocks.map((s) => (
                      <button
                        key={s.symbol}
                        onClick={() => {
                          onSelectSymbol(s.symbol);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left hover:bg-[#003366] ${
                          currentSymbol === s.symbol ? 'bg-[#00509e] text-white font-bold' : 'text-[#cce0ff]'
                        }`}
                      >
                        <span className="font-mono">{s.symbol} ({s.name})</span>
                        <span className="font-mono text-slate-300">${s.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onOpenUploader}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#007acc] hover:bg-[#00509e] rounded-md transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
