import React, { useState } from 'react';
import { Search, Shield } from 'lucide-react';
import { POPULAR_STOCKS } from '../data/stockDatabase';

interface NavbarProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  activeTab: 'model' | 'dataValues' | 'tools' | 'charts';
  setActiveTab: (tab: 'model' | 'dataValues' | 'tools' | 'charts') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSymbol,
  onSelectSymbol,
  activeTab,
  setActiveTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredStocks = POPULAR_STOCKS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredStocks.length > 0) {
      onSelectSymbol(filteredStocks[0].symbol);
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
              <span className="text-sm font-bold tracking-tight text-white font-mono uppercase block leading-none">
                ANNRIYA RISK FINDER
              </span>
              <span className="text-[11px] text-[#B5F2DB] hidden sm:block leading-none mt-1">
                Quantitative Risk Assessments of Investment Opportunities
              </span>
            </div>
          </div>

          {/* Navigation Tabs - Deep Teal & Mint Green */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-medium">
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

            <button
              onClick={() => setActiveTab('tools')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'tools'
                  ? 'bg-[#B5F2DB] text-[#042F34] font-bold shadow-xs'
                  : 'text-[#E4EEF0] hover:text-white hover:bg-white/10'
              }`}
            >
              Technical Tools
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'charts'
                  ? 'bg-[#B5F2DB] text-[#042F34] font-bold shadow-xs'
                  : 'text-[#E4EEF0] hover:text-white hover:bg-white/10'
              }`}
            >
              Price & 30D SMA
            </button>
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search stock..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-32 sm:w-44 pl-7 pr-3 py-1 text-xs bg-[#16232B] border border-white/20 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-[#B5F2DB] font-mono"
                />
                <Search className="w-3.5 h-3.5 text-[#B5F2DB] absolute left-2 top-1/2 -translate-y-1/2" />
              </form>

              {isSearchOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSearchOpen(false)} />
                  <div className="absolute right-0 mt-1 w-64 bg-[#16232B] border border-[#042F34] rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto p-1 text-xs text-white">
                    {filteredStocks.map((s) => (
                      <button
                        key={s.symbol}
                        onClick={() => {
                          onSelectSymbol(s.symbol);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left hover:bg-[#042F34] ${
                          currentSymbol === s.symbol ? 'bg-[#042F34] text-[#B5F2DB] font-bold' : 'text-[#E4EEF0]'
                        }`}
                      >
                        <span className="font-mono font-medium">{s.symbol}</span>
                        <span className="text-[10px] text-[#B5F2DB]/80 truncate max-w-[120px]">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Mobile Tab Row */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto py-2 border-t border-[#16232B] text-xs">
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
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'tools' ? 'bg-[#B5F2DB] text-[#042F34] font-bold' : 'text-[#E4EEF0]'
            }`}
          >
            Technical Tools
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'charts' ? 'bg-[#B5F2DB] text-[#042F34] font-bold' : 'text-[#E4EEF0]'
            }`}
          >
            Price & 30D SMA
          </button>
        </div>

      </div>
    </header>
  );
};
