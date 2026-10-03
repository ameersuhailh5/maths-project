import React, { useState } from 'react';
import { StockPricePoint, StockQuote } from '../types/stock';
import {
  calculateStatisticalFoundations,
  calculateFiveFactorRiskModel,
} from '../services/financialMath';
import { X, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface CustomDataUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCustomData: (customStock: StockQuote) => void;
}

export const CustomDataUploader: React.FC<CustomDataUploaderProps> = ({
  isOpen,
  onClose,
  onImportCustomData,
}) => {
  const [tickerName, setTickerName] = useState('CUSTOM_ASSET');
  const [csvText, setCsvText] = useState(`Date,Price,Volume
2025-01-02,150.25,4500000
2025-01-03,152.10,4800000
2025-01-06,148.90,5200000
2025-01-07,151.40,4100000
2025-01-08,154.80,6000000
2025-01-09,153.20,4900000
2025-01-10,156.40,5100000
2025-01-13,155.10,4300000
2025-01-14,158.90,5900000
2025-01-15,160.50,6200000
2025-01-16,159.20,4700000
2025-01-17,162.00,5300000`);

  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseCsv = (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 5) {
        throw new Error('Please provide at least 5 price rows for statistical risk calculation.');
      }

      const points: StockPricePoint[] = [];
      const hasHeader = lines[0].toLowerCase().includes('date');
      const startIdx = hasHeader ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          const date = parts[0];
          const price = parseFloat(parts[1]);
          const volume = parts[2] ? parseFloat(parts[2]) : 4500000;

          if (!isNaN(price) && price > 0) {
            points.push({ date, price, volume });
          }
        }
      }

      if (points.length < 5) {
        throw new Error('Could not parse enough valid price rows. Format: Date, Price, Volume');
      }

      const { stats } = calculateStatisticalFoundations(points);
      const annualizedVolDecimal = stats.annualizedVolatility / 100.0;

      const fiveFactorModel = calculateFiveFactorRiskModel({
        annualizedVolDecimal,
        avgDollarVolume: 5e7,
        beta: 1.10,
        debtRatio: 0.30,
        creditRatingRisk: 25.0,
      });

      const lastPrice = points[points.length - 1].price;
      const firstPrice = points[0].price;
      const change = lastPrice - firstPrice;
      const changePercent = (change / firstPrice) * 100;

      const customStock: StockQuote = {
        symbol: tickerName.trim().toUpperCase() || 'CUSTOM_ASSET',
        name: `Custom Series (${points.length} Points)`,
        sector: 'User Custom Dataset',
        market: 'IN',
        currency: '₹',
        exchange: 'CUSTOM',
        price: Number(lastPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        marketCap: '₹Custom',
        peRatio: 20.0,
        history: points,
        stats,
        fiveFactorModel,
      };

      onImportCustomData(customStock);
      onClose();
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV dataset');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#001f3f] border border-[#00509e] rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl text-white">
        
        <div className="flex items-center justify-between pb-3 border-b border-[#00509e]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#007acc]" />
            <h3 className="font-bold text-base text-white">Import Custom Historical Prices CSV</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#66a3ff] hover:text-white p-1 rounded-lg hover:bg-[#00264d]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleParseCsv} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-[#66a3ff] block mb-1">
              Custom Asset Symbol:
            </label>
            <input
              type="text"
              value={tickerName}
              onChange={(e) => setTickerName(e.target.value)}
              className="w-full bg-[#001429] border border-[#00509e] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#007acc]"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#66a3ff] block mb-1">
              CSV Prices (Date, Price, Volume [optional]):
            </label>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full bg-[#001429] border border-[#00509e] rounded-lg p-3 text-xs font-mono text-white focus:outline-none focus:border-[#007acc]"
            />
          </div>

          {parseError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500 text-rose-400 text-xs font-mono rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#00264d] hover:bg-[#003366] text-[#cce0ff] rounded-lg text-xs font-mono transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-[#007acc] hover:bg-[#00509e] text-white font-mono text-xs rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Calculate Risk Model
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
