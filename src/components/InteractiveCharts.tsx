import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
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
import { StockPricePoint, RiskMetrics } from '../types/stock';
import {
  calculateRollingVolatility,
  calculateReturnDistribution,
  runMonteCarloSimulation,
  calculatePriceProjection,
} from '../services/financialMath';
import { Activity, RefreshCw } from 'lucide-react';

interface InteractiveChartsProps {
  symbol: string;
  history: StockPricePoint[];
  metrics: RiskMetrics;
}

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  symbol,
  history,
  metrics,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<
    'price-drawdown' | 'price-projection' | 'rolling-vol' | 'interest-rate' | 'distribution' | 'monte-carlo'
  >('price-drawdown');

  const rollingVolData = useMemo(() => calculateRollingVolatility(history), [history]);
  const distributionData = useMemo(() => calculateReturnDistribution(history), [history]);
  const projectionData = useMemo(() => calculatePriceProjection(history, metrics.volatility1y), [history, metrics.volatility1y]);
  
  const [mcSeed, setMcSeed] = useState(0);
  const monteCarloData = useMemo(
    () => runMonteCarloSimulation(history[history.length - 1]?.price || 100, metrics.volatility1y, metrics.annualizedReturn),
    [history, metrics, mcSeed]
  );

  return (
    <div className="bg-[#001f3f] border border-[#00509e] rounded-xl p-4 sm:p-5 space-y-4 text-white">
      
      {/* Minimal Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#00509e]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#007acc]" />
          <h2 className="text-sm font-bold text-white">
            Risk &amp; Volatility Charts ({symbol})
          </h2>
        </div>

        {/* Minimalist Chart Tabs */}
        <div className="flex items-center gap-2 text-xs font-medium text-[#66a3ff] overflow-x-auto font-mono">
          <button
            onClick={() => setActiveChartTab('price-drawdown')}
            className={`px-2 py-1 transition-colors border-b-2 ${
              activeChartTab === 'price-drawdown'
                ? 'text-white border-[#007acc] font-bold'
                : 'border-transparent hover:text-white'
            }`}
          >
            Price &amp; Drawdown
          </button>
          
          <button
            onClick={() => setActiveChartTab('price-projection')}
            className={`px-2 py-1 transition-colors border-b-2 ${
              activeChartTab === 'price-projection'
                ? 'text-white border-[#007acc] font-bold'
                : 'border-transparent hover:text-white'
            }`}
          >
            30D SMA Forecast
          </button>

          <button
            onClick={() => setActiveChartTab('rolling-vol')}
            className={`px-2 py-1 transition-colors border-b-2 ${
              activeChartTab === 'rolling-vol'
                ? 'text-white border-[#007acc] font-bold'
                : 'border-transparent hover:text-white'
            }`}
          >
            Rolling Volatility
          </button>

          <button
            onClick={() => setActiveChartTab('interest-rate')}
            className={`px-2 py-1 transition-colors border-b-2 ${
              activeChartTab === 'interest-rate'
                ? 'text-white border-[#007acc] font-bold'
                : 'border-transparent hover:text-white'
            }`}
          >
            Yield Overlay
          </button>

          <button
            onClick={() => setActiveChartTab('distribution')}
            className={`px-2 py-1 transition-colors border-b-2 ${
              activeChartTab === 'distribution'
                ? 'text-white border-[#007acc] font-bold'
                : 'border-transparent hover:text-white'
            }`}
          >
            Tail Risk
          </button>

          <button
            onClick={() => setActiveChartTab('monte-carlo')}
            className={`px-2 py-1 transition-colors border-b-2 ${
              activeChartTab === 'monte-carlo'
                ? 'text-white border-[#007acc] font-bold'
                : 'border-transparent hover:text-white'
            }`}
          >
            Monte Carlo
          </button>
        </div>
      </div>

      {/* Chart Viewport */}
      <div className="h-[360px] w-full pt-1">
        
        {/* CHART 1: Price History & Drawdown */}
        {activeChartTab === 'price-drawdown' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rollingVolData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007acc" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#007acc" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00509e" opacity={0.3} />
              <XAxis dataKey="date" stroke="#66a3ff" fontSize={10} tickFormatter={(str) => str.slice(2, 7)} />
              <YAxis yAxisId="left" stroke="#cce0ff" fontSize={10} domain={['auto', 'auto']} unit="$" />
              <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" fontSize={10} unit="%" domain={[-80, 0]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#00264d', borderColor: '#00509e', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }}
                formatter={(val: any, name: any) => [
                  name === 'price' ? `$${Number(val).toFixed(2)}` : `${Number(val).toFixed(2)}%`,
                  name === 'price' ? 'Stock Price' : 'Drawdown Depth',
                ]}
              />
              <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
              <Area yAxisId="left" type="monotone" dataKey="price" name="Stock Price" stroke="#66a3ff" strokeWidth={2} fillOpacity={1} fill="url(#priceGradient)" />
              <Area yAxisId="right" type="monotone" dataKey="drawdown" name="Max Drawdown (%)" stroke="#f43f5e" strokeWidth={1.5} fillOpacity={1} fill="url(#drawdownGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* CHART 2: Price Projection */}
        {activeChartTab === 'price-projection' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="projConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007acc" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#007acc" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00509e" opacity={0.3} />
              <XAxis dataKey="date" stroke="#66a3ff" fontSize={10} tickFormatter={(str) => str.slice(2, 7)} />
              <YAxis stroke="#cce0ff" fontSize={10} domain={['auto', 'auto']} unit="$" />
              <Tooltip
                contentStyle={{ backgroundColor: '#00264d', borderColor: '#00509e', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }}
                formatter={(val: any, name: any) => [
                  val ? `$${Number(val).toFixed(2)}` : 'N/A',
                  name === 'actualPrice' ? 'Historical Actual' : name === 'sma30' ? '30-Day SMA' : name === 'projectedPrice' ? '30D Forecast' : 'Volatility Band'
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

              <Area type="monotone" dataKey="upperConfidence" name="Upper Volatility Band (+1σ)" stroke="#66a3ff" fill="url(#projConfidence)" strokeDasharray="2 2" />
              <Area type="monotone" dataKey="lowerConfidence" name="Lower Volatility Band (-1σ)" stroke="#66a3ff" fillOpacity={0} strokeDasharray="2 2" />

              <Line type="monotone" dataKey="actualPrice" name="Historical Actual Price" stroke="#66a3ff" strokeWidth={2} dot={false} connectNulls={true} />
              <Line type="monotone" dataKey="sma30" name="30-Day SMA" stroke="#007acc" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls={true} />
              <Line type="monotone" dataKey="projectedPrice" name="30D Forecast" stroke="#cce0ff" strokeWidth={2} dot={false} connectNulls={true} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* CHART 3: Rolling Volatility Timeline */}
        {activeChartTab === 'rolling-vol' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rollingVolData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00509e" opacity={0.3} />
              <XAxis dataKey="date" stroke="#66a3ff" fontSize={10} tickFormatter={(str) => str.slice(2, 7)} />
              <YAxis stroke="#cce0ff" fontSize={10} unit="%" domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#00264d', borderColor: '#00509e', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }}
                formatter={(val: any, name: any) => [`${Number(val).toFixed(1)}%`, name]}
              />
              <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="volatility30d" name="30-Day Rolling HV" stroke="#66a3ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="volatility90d" name="90-Day Rolling HV" stroke="#007acc" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* CHART 4: Interest Rate Overlay */}
        {activeChartTab === 'interest-rate' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rollingVolData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00509e" opacity={0.3} />
              <XAxis dataKey="date" stroke="#66a3ff" fontSize={10} tickFormatter={(str) => str.slice(2, 7)} />
              <YAxis yAxisId="left" stroke="#cce0ff" fontSize={10} unit="$" domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} unit="%" domain={[2.5, 6.0]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#00264d', borderColor: '#00509e', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }}
                formatter={(val: any, name: any) => [
                  name === 'price' ? `$${Number(val).toFixed(2)}` : `${Number(val).toFixed(2)}%`,
                  name === 'price' ? `${symbol} Price` : '10-Yr Yield',
                ]}
              />
              <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="price" name={`${symbol} Price`} stroke="#66a3ff" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="interestRate" name="10-Yr Yield (%)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* CHART 5: Daily Return Distribution */}
        {activeChartTab === 'distribution' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00509e" opacity={0.3} />
              <XAxis dataKey="rangeLabel" stroke="#66a3ff" fontSize={10} />
              <YAxis stroke="#cce0ff" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#00264d', borderColor: '#00509e', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }}
              />
              <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="actualCount" name="Actual Frequency" fill="#007acc" radius={[3, 3, 0, 0]} />
              <Bar dataKey="normalCount" name="Normal Distribution" fill="#003366" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* CHART 6: Monte Carlo Simulation */}
        {activeChartTab === 'monte-carlo' && (
          <div className="space-y-2 h-full flex flex-col">
            <div className="flex items-center justify-between text-xs text-[#66a3ff] px-2 font-mono">
              <span>1-Year Monte Carlo Outcomes</span>
              <button
                onClick={() => setMcSeed((s) => s + 1)}
                className="flex items-center gap-1 text-white hover:text-[#cce0ff]"
              >
                <RefreshCw className="w-3 h-3 text-[#007acc]" /> Re-simulate
              </button>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monteCarloData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00509e" opacity={0.3} />
                  <XAxis dataKey="day" stroke="#66a3ff" fontSize={10} label={{ value: 'Trading Days', position: 'insideBottom', offset: -4, fill: '#66a3ff', fontSize: 10 }} />
                  <YAxis stroke="#cce0ff" fontSize={10} unit="$" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#00264d', borderColor: '#00509e', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }}
                    formatter={(val: any) => `$${Number(val).toFixed(2)}`}
                  />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="p95" name="95th Percentile (Bull)" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="p50" name="Median Outcome" stroke="#66a3ff" strokeWidth={2} fillOpacity={0} />
                  <Area type="monotone" dataKey="p5" name="5th Percentile (Bear)" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
