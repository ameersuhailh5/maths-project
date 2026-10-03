import React, { useState, useEffect } from 'react';
import { StockQuote } from './types/stock';
import { getStockData } from './data/stockDatabase';
import { Navbar } from './components/Navbar';
import { TickerHeader } from './components/TickerHeader';
import { WeightedRiskModelCard } from './components/WeightedRiskModelCard';
import { FromRawDataToRiskValues } from './components/FromRawDataToRiskValues';
import { TechnicalToolsCard } from './components/TechnicalToolsCard';
import { InteractiveCharts } from './components/InteractiveCharts';
import { CustomDataUploader } from './components/CustomDataUploader';
import { Shield } from 'lucide-react';

export default function App() {
  const [currentSymbol, setCurrentSymbol] = useState<string>('RELIANCE');
  const [stock, setStock] = useState<StockQuote>(() => getStockData('RELIANCE'));
  
  const [activeTab, setActiveTab] = useState<'model' | 'dataValues' | 'tools' | 'charts'>('model');
  
  // Modals
  const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);

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
          
          {/* TAB 1: 5-Factor Weighted-Sum Model */}
          {activeTab === 'model' && (
            <div className="space-y-8">
              <WeightedRiskModelCard stock={stock} />
            </div>
          )}

          {/* TAB 2: From Raw Data to Risk Values */}
          {activeTab === 'dataValues' && (
            <div className="space-y-8">
              <FromRawDataToRiskValues stock={stock} />
            </div>
          )}

          {/* TAB 3: Technical Tools */}
          {activeTab === 'tools' && (
            <div className="space-y-8">
              <TechnicalToolsCard />
            </div>
          )}

          {/* TAB 4: Price & 30-Day SMA Forecast */}
          {activeTab === 'charts' && (
            <InteractiveCharts
              symbol={stock.symbol}
              history={stock.history}
              fiveFactorModel={stock.fiveFactorModel}
              annualizedVol={stock.stats.annualizedVolatility}
              currency={stock.currency}
            />
          )}

        </div>
      </main>

      {/* Custom CSV Data Uploader Modal */}
      <CustomDataUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onImportCustomData={handleImportCustomData}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-[#00509e]/80 bg-[#001f3f] py-5 text-xs text-[#66a3ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">ANNRIYA RISK FINDER</span>
            <span className="hidden sm:inline">· Quantitative Risk Assessments of Investment Opportunities</span>
          </div>
          <div className="text-[11px] text-[#66a3ff] font-mono">
            A weighted-sum model that combines five risk factors into one 0–100 score
          </div>
        </div>
      </footer>

    </div>
  );
}
