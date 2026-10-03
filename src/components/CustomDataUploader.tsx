import React, { useState } from 'react';
import { StockPricePoint } from '../types/stock';
import { calculateRiskMetrics } from '../services/financialMath';
import { X, Upload, AlertCircle } from 'lucide-react';

interface CustomDataUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCustomData: (customStock: any) => void;
}

export const CustomDataUploader: React.FC<CustomDataUploaderProps> = ({
  isOpen,
  onClose,
  onImportCustomData,
}) => {
  const [tickerName, setTickerName] = useState('CUSTOM_ASSET');
  const [csvText, setCsvText] = useState(`Date,Price,InterestRate
2024-01-02,150.25,4.10
2024-01-03,152.10,4.12
2024-01-04,148.90,4.15
2024-01-05,151.40,4.11
2024-01-08,154.80,4.08
2024-01-09,153.20,4.10
2024-01-10,156.40,4.05
2024-01-11,155.10,4.07
2024-01-12,158.90,4.02
2024-01-15,160.50,3.99`);

  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseCsv = (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 5) {
        throw new Error('Please provide at least 5 price rows for risk calculation.');
      }

      const points: StockPricePoint[] = [];
      const hasHeader = lines[0].toLowerCase().includes('date');
      const startIdx = hasHeader ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          const date = parts[0];
          const price = parseFloat(parts[1]);
          const interestRate = parts[2] ? parseFloat(parts[2]) : 4.25;

          if (!isNaN(price) && price > 0) {
            points.push({ date, price, interestRate });
          }
        }
      }

      if (points.length < 5) {
        throw new Error('Could not parse enough valid price rows. Format: Date, Price, InterestRate');
      }

      const metrics = calculateRiskMetrics(points, 25.0);
      const lastPrice = points[points.length - 1].price;
      const firstPrice = points[0].price;
      const change = lastPrice - firstPrice;
      const changePercent = (change / firstPrice) * 100;

      const customStock = {
        symbol: tickerName.trim().toUpperCase() || 'CUSTOM_ASSET',
        name: `Custom Series (${points.length} Points)`,
        sector: 'Custom Series',
        industry: 'User Dataset',
        price: Number(lastPrice.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        marketCap: '$Custom Series',
        peRatio: 0,
        dividendYield: 0,
        description: `Imported historical dataset evaluated for 30D volatility, VaR limits, and interest rate beta duration.`,
        history: points,
        metrics,
      };

      onImportCustomData(customStock);
      onClose();
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV dataset');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#1a1a1a]/20 rounded w-full max-w-xl p-6 space-y-4 shadow-2xl text-[#1a1a1a]">
        
        <div className="flex items-center justify-between pb-3 border-b border-[#1a1a1a]/15">
          <div>
            <div className="label-caps">Dataset Ingestion</div>
            <h3 className="font-serif-brand text-lg font-bold">Import Custom Stock Prices CSV</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#1a1a1a]/60 hover:text-[#1a1a1a] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleParseCsv} className="space-y-4">
          <div>
            <label className="label-caps block mb-1">
              Custom Asset Symbol:
            </label>
            <input
              type="text"
              value={tickerName}
              onChange={(e) => setTickerName(e.target.value)}
              className="w-full bg-[#f8f7f4] border border-[#1a1a1a]/20 rounded px-3 py-2 text-xs font-mono-code focus:outline-none focus:border-[#2b3eff]"
            />
          </div>

          <div>
            <label className="label-caps block mb-1">
              CSV Prices (Date, Price, InterestRate [optional]):
            </label>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full bg-[#f8f7f4] border border-[#1a1a1a]/20 rounded p-3 text-xs font-mono-code focus:outline-none focus:border-[#2b3eff]"
            />
          </div>

          {parseError && (
            <div className="p-3 bg-[#e63946]/10 border border-[#e63946] text-[#e63946] text-xs font-mono-code flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#f8f7f4] hover:bg-[#1a1a1a]/10 text-[#1a1a1a] text-xs font-mono-code"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#2b3eff] text-white font-mono-code text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Data
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
