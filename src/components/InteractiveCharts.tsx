import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { StockPricePoint, FiveFactorRiskModel } from '../types/stock';
import { calculatePriceProjection } from '../services/financialMath';
import { TrendingUp, BarChart2 } from 'lucide-react';

interface InteractiveChartsProps {
  symbol: string;
  history: StockPricePoint[];
  fiveFactorModel: FiveFactorRiskModel;
  annualizedVol: number;
  currency?: string;
}

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  symbol,
  history,
  fiveFactorModel,
  annualizedVol,
  currency = '₹',
}) => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'factors'>('forecast');

  const projectionData = useMemo(
    () => calculatePriceProjection(history, annualizedVol),
    [history, annualizedVol]
  );

  const factorBarData = [
    {
      factor: 'Volatility',
      value: fiveFactorModel.volatility.normalizedScore,
      weight: 30,
      contribution: fiveFactorModel.volatility.contribution,
      fill: '#042F34', // Deep Teal
    },
    {
      factor: 'Liquidity',
      value: fiveFactorModel.liquidity.normalizedScore,
      weight: 20,
      contribution: fiveFactorModel.liquidity.contribution,
      fill: '#16232B', // Charcoal Teal
    },
    {
      factor: 'Market Corr',
      value: fiveFactorModel.marketCorrelation.normalizedScore,
      weight: 20,
      contribution: fiveFactorModel.marketCorrelation.contribution,
      fill: '#23585F', // Mid Teal
    },
    {
      factor: 'Leverage',
      value: fiveFactorModel.leverageDebt.normalizedScore,
      weight: 15,
      contribution: fiveFactorModel.leverageDebt.contribution,
      fill: '#FFC933', // Warm Yellow
    },
    {
      factor: 'Track Record',
      value: fiveFactorModel.trackRecordCredit.normalizedScore,
      weight: 15,
      contribution: fiveFactorModel.trackRecordCredit.contribution,
      fill: '#4A7C82', // Soft Teal
    },
  ];

  return (
    <div className="bg-white border border-[#cddfe2] rounded-lg p-5 space-y-4 shadow-xs">
      
      {/* Header and Toggle Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#cddfe2]">
        <div className="flex items-center gap-2">
          {activeTab === 'forecast' ? (
            <TrendingUp className="w-5 h-5 text-[#042F34]" />
          ) : (
            <BarChart2 className="w-5 h-5 text-[#042F34]" />
          )}
          <div>
            <h2 className="text-base font-bold text-[#042F34]">
              {activeTab === 'forecast'
                ? `Price History & 30-Day SMA Forecast (${symbol})`
                : `Factor Risk Values & Contribution Matrix (${symbol})`}
            </h2>
            <p className="text-xs text-[#16232B]/70">
              {activeTab === 'forecast'
                ? 'Historical daily prices, 30-day simple moving average, and projected price trajectory.'
                : 'Breakdown of risk score formula: Risk Value × Weight = Contribution.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#E4EEF0] p-0.5 rounded-md border border-[#cddfe2] text-xs self-start sm:self-auto font-medium">
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'forecast'
                ? 'bg-[#042F34] text-[#B5F2DB] font-bold shadow-xs'
                : 'text-[#16232B] hover:text-[#042F34]'
            }`}
          >
            Price & 30D SMA
          </button>
          <button
            onClick={() => setActiveTab('factors')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'factors'
                ? 'bg-[#042F34] text-[#B5F2DB] font-bold shadow-xs'
                : 'text-[#16232B] hover:text-[#042F34]'
            }`}
          >
            Factor Contributions
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      {activeTab === 'forecast' ? (
        <div className="space-y-3">
          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="actualPriceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B5F2DB" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#B5F2DB" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4EEF0" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#16232B"
                  fontSize={11}
                  tickFormatter={(str) => str.slice(2, 7)}
                  opacity={0.6}
                />
                <YAxis
                  stroke="#16232B"
                  fontSize={11}
                  domain={['auto', 'auto']}
                  unit={currency}
                  opacity={0.6}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#16232B] border border-[#042F34] p-3 rounded-lg shadow-lg text-xs font-mono text-white">
                          <p className="font-bold text-[#B5F2DB] mb-1.5">{label}</p>
                          {payload.map((entry, idx) => (
                            <p key={idx} className="flex justify-between gap-3 text-slate-200 py-0.5">
                              <span style={{ color: entry.color }}>{entry.name}:</span>
                              <span className="font-bold text-white">
                                {currency}{Number(entry.value).toFixed(2)}
                              </span>
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />

                {/* Historical Price */}
                <Area
                  type="monotone"
                  dataKey="actualPrice"
                  name="Historical Price"
                  stroke="#042F34"
                  strokeWidth={2.5}
                  fill="url(#actualPriceGradient)"
                  connectNulls={false}
                />

                {/* 30-Day Moving Average */}
                <Line
                  type="monotone"
                  dataKey="sma30"
                  name="30-Day SMA"
                  stroke="#FFC933"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />

                {/* 30-Day Forward Projection */}
                <Line
                  type="monotone"
                  dataKey="projectedPrice"
                  name="30-Day Forecast"
                  stroke="#042F34"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  dot={false}
                  connectNulls
                />

                {/* Confidence Bounds */}
                <Line
                  type="monotone"
                  dataKey="upperConfidence"
                  name="Upper Band (95% CI)"
                  stroke="#A2BEC4"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="lowerConfidence"
                  name="Lower Band (95% CI)"
                  stroke="#A2BEC4"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#16232B]/80 bg-[#E4EEF0] p-2.5 rounded-lg border border-[#cddfe2] font-mono">
            <span>Historical 1-Year Sample: 252 Days</span>
            <span className="text-[#825b00] font-bold">30-Day SMA (Warm Yellow Line)</span>
            <span>Forecast Volatility: {annualizedVol}%</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorBarData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4EEF0" vertical={false} />
                <XAxis dataKey="factor" stroke="#16232B" fontSize={11} opacity={0.7} />
                <YAxis stroke="#16232B" fontSize={11} domain={[0, 100]} opacity={0.7} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#16232B] border border-[#042F34] p-3 rounded-lg shadow-lg text-xs font-mono text-white">
                          <p className="font-bold text-[#B5F2DB] mb-1">{data.factor}</p>
                          <p className="text-white">Risk Value: <strong>{data.value} / 100</strong></p>
                          <p className="text-slate-300">Weight: <strong>{data.weight}%</strong></p>
                          <p className="text-[#FFC933]">Contribution: <strong>{data.contribution} pts</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" name="Risk Value (0–100)" fill="#042F34" radius={[4, 4, 0, 0]} />
                <Bar dataKey="contribution" name="Points Contribution" fill="#FFC933" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Explanation */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            {factorBarData.map((f) => (
              <div key={f.factor} className="bg-[#E4EEF0] p-2 rounded-md border border-[#cddfe2] text-center">
                <div className="text-[#16232B]/60 text-[10px]">{f.factor}</div>
                <div className="font-bold text-[#042F34]">{f.value} × {f.weight}%</div>
                <div className="text-[#825b00] font-bold">{f.contribution} pts</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
