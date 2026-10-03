import React, { useState, useEffect } from 'react';
import { StockQuote } from './types/stock';
import { getStockData } from './data/stockDatabase';
import { Navbar } from './components/Navbar';
import { TickerHeader } from './components/TickerHeader';
import { WeightedRiskModelCard } from './components/WeightedRiskModelCard';
import { InteractiveCharts } from './components/InteractiveCharts';
import { RiskMetricsGrid } from './components/RiskMetricsGrid';
import { StockComparator } from './components/StockComparator';
import { PortfolioStressTester } from './components/PortfolioStressTester';
import { CustomDataUploader } from './components/CustomDataUploader';
import { CodeViewerModal } from './components/CodeViewerModal';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentSymbol, setCurrentSymbol] = useState<string>('AAPL');
  const [stock, setStock] = useState<StockQuote>(() => getStockData('AAPL'));
  
  const [activeTab, setActiveTab] = useState<'model' | 'charts' | 'comparator' | 'portfolio'>('model');
  
  // Modals
  const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetched = getStockData(currentSymbol);
    setStock(fetched);
  }, [currentSymbol]);

  const handleImportCustomData = (customStock: StockQuote) => {
    setStock(customStock);
    setCurrentSymbol(customStock.symbol);
    setActiveTab('model');
  };

  return (
    <div className="min-h-screen bg-[#001429] text-white flex flex-col font-sans selection:bg-[#007acc] selection:text-white">
      
      {/* Top Bar Navigation */}
      <Navbar
        currentSymbol={currentSymbol}
        onSelectSymbol={setCurrentSymbol}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUploader={() => setIsUploaderOpen(true)}
        onOpenCodeDrawer={() => setIsCodeDrawerOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-16">
        
        {/* Ticker Header Summary */}
        <TickerHeader
          stock={stock}
          onSelectSymbol={setCurrentSymbol}
        />

        {/* Tab View Contents */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
          
          {/* TAB 1: 5-Factor Risk Model */}
          {activeTab === 'model' && (
            <div className="space-y-8">
              {/* PRESENTATION PPT MODEL: 5-Factor Weighted-Sum Risk Model */}
              <WeightedRiskModelCard stock={stock} />

              {/* Quantitative Risk Metric Cards Grid */}
              <RiskMetricsGrid
                metrics={stock.metrics}
                symbol={stock.symbol}
              />
            </div>
          )}

          {/* TAB 2: Risk & Volatility Charts */}
          {activeTab === 'charts' && (
            <InteractiveCharts
              symbol={stock.symbol}
              history={stock.history}
              metrics={stock.metrics}
            />
          )}

          {/* TAB 3: Multi-Stock Risk Comparator */}
          {activeTab === 'comparator' && (
            <StockComparator />
          )}

          {/* TAB 4: Portfolio Stress Tester */}
          {activeTab === 'portfolio' && (
            <PortfolioStressTester />
          )}

        </div>
      </main>

      {/* Custom CSV Data Uploader Modal */}
      <CustomDataUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onImportCustomData={handleImportCustomData}
      />

      {/* Python Code Viewer Modal */}
      <CodeViewerModal
        isOpen={isCodeDrawerOpen}
        onClose={() => setIsCodeDrawerOpen(false)}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-[#00509e]/80 bg-[#001f3f] py-5 text-xs text-[#66a3ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#007acc]" />
            <span className="font-bold text-white">ANNRIYA RISK FINDER</span>
            <span>· Quantitative 5-Factor Weighted-Sum Assessment</span>
          </div>
          <div className="text-[11px] text-[#66a3ff] font-mono">
            Model: Python / Pandas / NumPy Engine
          </div>
        </div>
      </footer>

    </div>
  );
}
