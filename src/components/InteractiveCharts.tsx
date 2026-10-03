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
  ReferenceLine,
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
      fill: '#00264d',
    },
    {
      factor: 'Liquidity',
      value: fiveFactorModel.liquidity.normalizedScore,
      weight: 20,
      contribution: fiveFactorModel.liquidity.contribution,
      fill: '#00509e',
    },
    {
      factor: 'Market Corr',
      value: fiveFactorModel.marketCorrelation.normalizedScore,
      weight: 20,
      contribution: fiveFactorModel.marketCorrelation.contribution,
      fill: '#007acc',
    },
    {
      factor: 'Leverage',
      value: fiveFactorModel.leverageDebt.normalizedScore,
      weight: 15,
      contribution: fiveFactorModel.leverageDebt.contribution,
      fill: '#e5633c',
    },
    {
      factor: 'Track Record',
      value: fiveFactorModel.trackRecordCredit.normalizedScore,
      weight: 15,
      contribution: fiveFactorModel.trackRecordCredit.contribution,
      fill: '#66a3ff',
    },
  ];

  return (
    <div className="bg-[#001f3f] border border-[#00509e] rounded-xl p-5 space-y-4 text-white shadow-xl">
      
      {/* Header and Minimal Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#00509e]">
        <div className="flex items-center gap-2">
          {activeTab === 'forecast' ? (
            <TrendingUp className="w-5 h-5 text-[#007acc]" />
          ) : (
            <BarChart2 className="w-5 h-5 text-amber-400" />
          )}
          <div>
            <h2 className="text-base font-bold text-white">
              {activeTab === 'forecast'
                ? `Price Projection & 30-Day SMA Forecast (${symbol})`
                : `Factor Risk Values & Contribution Matrix (${symbol})`}
            </h2>
            <p className="text-xs text-[#66a3ff]">
              {activeTab === 'forecast'
                ? 'Historical close prices, 30-day simple moving average, and projected price path with volatility bounds.'
                : 'Formula breakdown: Risk Value × Weight = Contribution.'}
            </p>
          </div>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#001429] p-1 rounded-lg border border-[#00509e] text-xs font-mono">
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'forecast'
                ? 'bg-[#007acc] text-white font-bold'
                : 'text-[#66a3ff] hover:text-white'
            }`}
          >
            30D SMA Forecast
          </button>
          <button
            onClick={() => setActiveTab('factors')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'factors'
                ? 'bg-[#007acc] text-white font-bold'
                : 'text-[#66a3ff] hover:text-white'
            }`}
          >
            Factor Contributions
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="h-[380px] w-full pt-2">
        {activeTab === 'forecast' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="projConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007acc" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#007acc" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00509e" opacity={0.3} />
              <XAxis dataKey="date" stroke="#66a3ff" fontSize={10} tickFormatter={(str) => str.slice(2, 7)} />
              <YAxis stroke="#cce0ff" fontSize={10} domain={['auto', 'auto']} unit={currency} />
              <Tooltip
                contentStyle={{ backgroundColor: '#001429', borderColor: '#00509e', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }}
                formatter={(val: any, name: any) => [
                  val ? `${currency}${Number(val).toFixed(2)}` : 'N/A',
                  name === 'actualPrice'
                    ? 'Historical Close'
                    : name === 'sma30'
                    ? '30-Day SMA'
                    : name === 'projectedPrice'
                    ? '30D Forecast'
                    : 'Volatility Confidence Bound',
                ]}
              />
              <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />

              {history[history.length - 1] && (
                <ReferenceLine
                  x={history[history.length - 1].date}
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={{
                    value: 'Today',
                    fill: '#f59e0b',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="upperConfidence"
                name="Upper Volatility (+1σ)"
                stroke="#66a3ff"
                fill="url(#projConfidence)"
                strokeDasharray="2 2"
              />
              <Area
                type="monotone"
                dataKey="lowerConfidence"
                name="Lower Volatility (-1σ)"
                stroke="#66a3ff"
                fillOpacity={0}
                strokeDasharray="2 2"
              />

              <Line
                type="monotone"
                dataKey="actualPrice"
                name="Historical Actual Price"
                stroke="#66a3ff"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
              <Line
                type="monotone"
                dataKey="sma30"
                name="30-Day SMA"
                stroke="#007acc"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                connectNulls={true}
              />
              <Line
                type="monotone"
                dataKey="projectedPrice"
                name="30D Forecast"
                stroke="#cce0ff"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={factorBarData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00509e" opacity={0.3} />
              <XAxis dataKey="factor" stroke="#66a3ff" fontSize={11} />
              <YAxis stroke="#cce0ff" fontSize={11} domain={[0, 100]} label={{ value: 'Risk Value (0–100)', angle: -90, position: 'insideLeft', fill: '#66a3ff', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#001429', borderColor: '#00509e', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }}
                formatter={(val: any, name: any, item: any) => [
                  name === 'value'
                    ? `${val} / 100`
                    : `+${val} (Weight: ${item.payload.weight}%)`,
                  name === 'value' ? 'Risk Value (0–100)' : 'Weighted Contribution to Score',
                ]}
              />
              <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="value" name="Normalized Risk Value (0–100)" fill="#007acc" radius={[4, 4, 0, 0]} />
              <Bar dataKey="contribution" name="Weighted Contribution to Score" fill="#e5633c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
};
