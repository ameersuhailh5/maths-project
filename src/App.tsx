import React, { useState, useEffect } from 'react';
import { StockQuote } from './types/stock';
import { getStockData } from './data/stockDatabase';
import { Navbar } from './components/Navbar';
import { TickerHeader } from './components/TickerHeader';
import { TradingViewLiveTracker } from './components/TradingViewLiveTracker';
import { WeightedRiskModelCard } from './components/WeightedRiskModelCard';
import { FromRawDataToRiskValues } from './components/FromRawDataToRiskValues';
import { Shield } from 'lucide-react';

export default function App() {
  const [currentSymbol, setCurrentSymbol] = useState<string>('RELIANCE');
  const [stock, setStock] = useState<StockQuote>(() => getStockData('RELIANCE'));
  const [activeTab, setActiveTab] = useState<'tracker' | 'model' | 'dataValues'>('tracker');
  const [isLiveApiLoading, setIsLiveApiLoading] = useState<boolean>(false);

  useEffect(() => {
    // 1. Immediately apply baseline from local database
    const localBaseline = getStockData(currentSymbol);
    setStock(localBaseline);

    // 2. Fetch live Indian / Global Stock Market API quote & real history
    let isCancelled = false;
    setIsLiveApiLoading(true);

    fetch(`/api/stock/${encodeURIComponent(currentSymbol)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: StockQuote) => {
        if (!isCancelled && data && data.symbol) {
          setStock(data);
        }
      })
      .catch((err) => {
        console.warn(`[App] API live fetch notice for ${currentSymbol}:`, err.message);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLiveApiLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentSymbol]);

  return (
    <div className="min-h-screen bg-[#E4EEF0] text-[#16232B] flex flex-col font-sans selection:bg-[#042F34] selection:text-[#B5F2DB]">
      
      {/* Top Bar Navigation */}
      <Navbar
        currentSymbol={currentSymbol}
        onSelectSymbol={setCurrentSymbol}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-12">
        
        {/* Stock Header & Quick Selector */}
        <TickerHeader
          stock={stock}
          onSelectSymbol={setCurrentSymbol}
        />

        {/* Tab View Contents */}
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Live Stock Tracking (TradingView Lightweight Charts) */}
          {activeTab === 'tracker' && (
            <TradingViewLiveTracker stock={stock} />
          )}

          {/* 5-Factor Weighted-Sum Model */}
          {activeTab === 'model' && (
            <WeightedRiskModelCard stock={stock} />
          )}

          {/* From Raw Data to Risk Values */}
          {activeTab === 'dataValues' && (
            <FromRawDataToRiskValues stock={stock} />
          )}

        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-[#cddfe2] bg-white py-4 text-xs text-[#16232B]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#FFC933] flex items-center justify-center text-[#042F34]">
              <Shield className="w-3.5 h-3.5 fill-[#042F34]" />
            </div>
            <span className="font-bold text-[#042F34]">ANNRIYA RISK FINDER</span>
            <span className="hidden sm:inline text-[#16232B]/60">· Quantitative Risk Assessments of Investment Opportunities</span>
          </div>
          <div className="text-[11px] text-[#16232B]/60 font-mono flex items-center gap-2">
            <span>TradingView Lightweight Charts™</span>
            <span>·</span>
            <span className="text-[#042F34] font-semibold">Indian Stock Market API (NSE/BSE)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
