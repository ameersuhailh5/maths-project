import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  WhitespaceData,
  Time,
} from 'lightweight-charts';
import { StockQuote, StockPricePoint } from '../types/stock';
import {
  Play,
  Pause,
  Maximize2,
  TrendingUp,
  Activity,
  Layers,
  BarChart2,
  Sliders,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface TradingViewLiveTrackerProps {
  stock: StockQuote;
}

type ChartStyleType = 'candles' | 'line' | 'area';
type TimeframeType = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface LegendValues {
  time?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  change?: number;
  changePercent?: number;
}

export const TradingViewLiveTracker: React.FC<TradingViewLiveTrackerProps> = ({ stock }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  // Series references
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);

  // User chart configuration state
  const [chartStyle, setChartStyle] = useState<ChartStyleType>('candles');
  const [timeframe, setTimeframe] = useState<TimeframeType>('1Y');
  const [showSma, setShowSma] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  
  // Live streaming state
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [tickSpeed, setTickSpeed] = useState<number>(1500); // 1.5 seconds
  const [livePrice, setLivePrice] = useState<number>(stock.price);
  const [liveChange, setLiveChange] = useState<number>(stock.change);
  const [liveChangePercent, setLiveChangePercent] = useState<number>(stock.changePercent);
  const [tickCount, setTickCount] = useState<number>(0);
  const [lastTickTime, setLastTickTime] = useState<string>('Just now');
  
  // Active HUD / Crosshair info
  const [legendInfo, setLegendInfo] = useState<LegendValues | null>(null);
  const [showFactorBreakdown, setShowFactorBreakdown] = useState<boolean>(false);

  // Latest current candle state for live tick aggregation
  const currentCandleRef = useRef<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);

  const currencySymbol = stock.currency;

  // Filter history based on timeframe
  const filteredHistory = useMemo(() => {
    const all = stock.history;
    if (timeframe === 'ALL' || all.length === 0) return all;
    let daysToTake = 252;
    if (timeframe === '1D') daysToTake = 15; // Intraday-like subset
    else if (timeframe === '5D') daysToTake = 5;
    else if (timeframe === '1M') daysToTake = 22;
    else if (timeframe === '3M') daysToTake = 66;
    else if (timeframe === '6M') daysToTake = 126;
    else if (timeframe === '1Y') daysToTake = 252;
    return all.slice(Math.max(0, all.length - daysToTake));
  }, [stock.history, timeframe]);

  // Compute 30-Day SMA
  const smaData = useMemo(() => {
    const result: LineData[] = [];
    const windowSize = 30;
    const history = stock.history;

    for (let i = 0; i < history.length; i++) {
      if (i >= windowSize - 1) {
        let sum = 0;
        for (let j = i - windowSize + 1; j <= i; j++) {
          sum += history[j].price;
        }
        const avg = Number((sum / windowSize).toFixed(2));
        result.push({
          time: history[i].date as Time,
          value: avg,
        });
      }
    }

    // Filter to match current timeframe
    if (timeframe === 'ALL') return result;
    const firstDate = filteredHistory[0]?.date;
    if (!firstDate) return result;
    return result.filter((pt) => pt.time >= firstDate);
  }, [stock.history, filteredHistory, timeframe]);

  // Prepare Candlestick, Line, and Volume data
  const candleData: CandlestickData[] = useMemo(() => {
    return filteredHistory.map((pt) => ({
      time: pt.date as Time,
      open: pt.open ?? pt.price,
      high: pt.high ?? pt.price,
      low: pt.low ?? pt.price,
      close: pt.price,
    }));
  }, [filteredHistory]);

  const lineData: LineData[] = useMemo(() => {
    return filteredHistory.map((pt) => ({
      time: pt.date as Time,
      value: pt.price,
    }));
  }, [filteredHistory]);

  const volumeData: HistogramData[] = useMemo(() => {
    return filteredHistory.map((pt) => {
      const open = pt.open ?? pt.price;
      const isUp = pt.price >= open;
      return {
        time: pt.date as Time,
        value: pt.volume ?? 1000000,
        color: isUp ? 'rgba(5, 150, 105, 0.35)' : 'rgba(220, 38, 38, 0.35)',
      };
    });
  }, [filteredHistory]);

  // Reset live price when stock changes
  useEffect(() => {
    setLivePrice(stock.price);
    setLiveChange(stock.change);
    setLiveChangePercent(stock.changePercent);
    setTickCount(0);
    setLastTickTime('Synced');
  }, [stock.symbol, stock.price, stock.change, stock.changePercent]);

  // Initialize and mount Lightweight Chart
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up old chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = containerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#16232B',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      grid: {
        vertLines: { color: '#E4EEF0', style: LineStyle.Dotted },
        horzLines: { color: '#E4EEF0', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#042F34',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#042F34',
        },
        horzLine: {
          color: '#042F34',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#042F34',
        },
      },
      rightPriceScale: {
        borderColor: '#cddfe2',
        scaleMargins: {
          top: 0.1,
          bottom: 0.22, // Reserve bottom for volume
        },
      },
      timeScale: {
        borderColor: '#cddfe2',
        fixLeftEdge: true,
        fixRightEdge: false,
      },
    });

    chartRef.current = chart;

    // 1. Add Main Price Series (Candles / Line / Area)
    let mainSeries: ISeriesApi<any>;
    if (chartStyle === 'candles') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#059669', // Crisp Emerald/Mint Up
        downColor: '#dc2626', // Crisp Crimson Down
        borderVisible: false,
        wickUpColor: '#059669',
        wickDownColor: '#dc2626',
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.05,
        },
      });
      mainSeries.setData(candleData);
    } else if (chartStyle === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(4, 47, 52, 0.28)',
        bottomColor: 'rgba(181, 242, 219, 0.03)',
        lineColor: '#042F34',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.05,
        },
      });
      mainSeries.setData(lineData);
    } else {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#042F34',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.05,
        },
      });
      mainSeries.setData(lineData);
    }
    mainSeriesRef.current = mainSeries;

    // Store last bar for real-time updates
    if (candleData.length > 0) {
      const lastCandle = candleData[candleData.length - 1];
      currentCandleRef.current = {
        time: String(lastCandle.time),
        open: lastCandle.open,
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close,
        volume: volumeData[volumeData.length - 1]?.value ?? 1000000,
      };
      setLegendInfo({
        time: String(lastCandle.time),
        open: lastCandle.open,
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close,
        volume: volumeData[volumeData.length - 1]?.value,
        change: stock.change,
        changePercent: stock.changePercent,
      });
    }

    // 2. Add 30-Day SMA Line Overlay if enabled
    if (showSma && smaData.length > 0) {
      const smaSeries = chart.addSeries(LineSeries, {
        color: '#FFC933', // Warm Yellow
        lineWidth: 2,
        title: '30D SMA',
        priceLineVisible: false,
      });
      smaSeries.setData(smaData);
      smaSeriesRef.current = smaSeries;
    } else {
      smaSeriesRef.current = null;
    }

    // 3. Add Volume Histogram at bottom if enabled
    if (showVolume && volumeData.length > 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume_scale',
      });
      chart.priceScale('volume_scale').applyOptions({
        scaleMargins: {
          top: 0.78,
          bottom: 0,
        },
      });
      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries;
    } else {
      volumeSeriesRef.current = null;
    }

    // Fit content smoothly
    chart.timeScale().fitContent();

    // 4. Crosshair Move Listener for Real-Time HUD
    chart.subscribeCrosshairMove((param) => {
      if (
        !param.time ||
        param.point === undefined ||
        !mainSeriesRef.current
      ) {
        // Fall back to latest live bar
        if (currentCandleRef.current) {
          const c = currentCandleRef.current;
          setLegendInfo({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
            change: liveChange,
            changePercent: liveChangePercent,
          });
        }
        return;
      }

      const priceData = param.seriesData.get(mainSeriesRef.current) as any;
      const volData = volumeSeriesRef.current
        ? (param.seriesData.get(volumeSeriesRef.current) as any)
        : null;

      if (priceData) {
        const o = priceData.open ?? priceData.value;
        const c = priceData.close ?? priceData.value;
        const diff = c - o;
        const diffPct = o !== 0 ? (diff / o) * 100 : 0;

        setLegendInfo({
          time: String(param.time),
          open: priceData.open ?? priceData.value,
          high: priceData.high ?? priceData.value,
          low: priceData.low ?? priceData.value,
          close: c,
          volume: volData ? volData.value : undefined,
          change: Number(diff.toFixed(2)),
          changePercent: Number(diffPct.toFixed(2)),
        });
      }
    });

    // 5. Responsive Resize Observer
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [
    stock.symbol,
    chartStyle,
    timeframe,
    showSma,
    showVolume,
    candleData,
    lineData,
    smaData,
    volumeData,
  ]);

  // LIVE STREAMING TICK ENGINE
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      if (!currentCandleRef.current || !mainSeriesRef.current) return;

      const current = currentCandleRef.current;
      const volatility = stock.stats.annualizedVolatility || 0.22;
      
      // Micro-tick random walk with gentle mean reversion to base trend
      const randomNoise = (Math.random() - 0.495) * (volatility * 0.08);
      const tickDelta = current.close * randomNoise;
      const newClose = Number(Math.max(1.0, current.close + tickDelta).toFixed(2));
      const newHigh = Number(Math.max(current.high, newClose).toFixed(2));
      const newLow = Number(Math.max(0.5, Math.min(current.low, newClose)).toFixed(2));
      const newVolume = current.volume + Math.floor(Math.random() * 25000 + 5000);

      // Update current candle ref
      current.high = newHigh;
      current.low = newLow;
      current.close = newClose;
      current.volume = newVolume;

      // Feed updated point into lightweight-charts
      if (chartStyle === 'candles') {
        mainSeriesRef.current.update({
          time: current.time as Time,
          open: current.open,
          high: current.high,
          low: current.low,
          close: current.close,
        });
      } else {
        mainSeriesRef.current.update({
          time: current.time as Time,
          value: current.close,
        });
      }

      // Update volume series
      if (volumeSeriesRef.current) {
        const isUp = current.close >= current.open;
        volumeSeriesRef.current.update({
          time: current.time as Time,
          value: current.volume,
          color: isUp ? 'rgba(5, 150, 105, 0.4)' : 'rgba(220, 38, 38, 0.4)',
        });
      }

      // Update live header state
      const baseOpen = candleData[0]?.open || stock.price;
      const currentDiff = newClose - baseOpen;
      const currentPct = baseOpen > 0 ? (currentDiff / baseOpen) * 100 : 0;

      setLivePrice(newClose);
      setLiveChange(Number(currentDiff.toFixed(2)));
      setLiveChangePercent(Number(currentPct.toFixed(2)));
      setTickCount((prev) => prev + 1);

      const now = new Date();
      setLastTickTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );

      // Update HUD if not hovering elsewhere
      setLegendInfo((prev) => ({
        ...prev,
        time: current.time,
        open: current.open,
        high: current.high,
        low: current.low,
        close: newClose,
        volume: newVolume,
        change: Number(currentDiff.toFixed(2)),
        changePercent: Number(currentPct.toFixed(2)),
      }));
    }, tickSpeed);

    return () => clearInterval(interval);
  }, [
    isLiveStreaming,
    tickSpeed,
    chartStyle,
    stock.stats.annualizedVolatility,
    stock.price,
    candleData,
  ]);

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const isPositive = liveChange >= 0;

  return (
    <div className="bg-white border border-[#cddfe2] rounded-lg shadow-xs overflow-hidden">
      
      {/* 1. Header Toolbar: Symbol, Live Price, Tick Status, and Controls */}
      <div className="p-4 sm:p-5 border-b border-[#cddfe2] bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Symbol & Live Quote Info */}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-[#042F34] font-mono tracking-tight">
                {stock.symbol}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-[#E4EEF0] text-[#042F34] border border-[#cddfe2]">
                {stock.exchange}
              </span>
              <span className="text-xs text-[#16232B]/70 font-medium">
                {stock.name}
              </span>

              {/* Pulsing LIVE Status Indicator */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition-all ${
                  isLiveStreaming
                    ? 'bg-[#B5F2DB] text-[#042F34] border border-[#042F34]/20 shadow-xs'
                    : 'bg-[#E4EEF0] text-[#16232B]/60 border border-[#cddfe2]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLiveStreaming ? 'bg-[#042F34] animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {isLiveStreaming ? 'LIVE TRACKING' : 'PAUSED'}
              </div>
            </div>

            {/* Current Real-time Price & Daily Change */}
            <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-[#16232B] tracking-tight">
                {currencySymbol}{livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div
                className={`flex items-center text-xs sm:text-sm font-mono font-bold px-2 py-0.5 rounded ${
                  isPositive ? 'text-[#042F34] bg-[#B5F2DB]' : 'text-red-700 bg-red-100'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4 mr-0.5 inline" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-0.5 inline" />
                )}
                {isPositive ? '+' : ''}
                {currencySymbol}{Math.abs(liveChange).toFixed(2)} ({isPositive ? '+' : ''}{liveChangePercent.toFixed(2)}%)
              </div>

              <span className="text-[11px] text-[#16232B]/60 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#042F34]" />
                Ticks: {tickCount} · {lastTickTime}
              </span>
            </div>
          </div>

          {/* Live Controls: Play/Pause, Speed, Reset Zoom */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-colors shadow-xs ${
                isLiveStreaming
                  ? 'bg-[#042F34] text-[#B5F2DB] hover:bg-[#16232B]'
                  : 'bg-[#FFC933] text-[#042F34] hover:bg-[#e6b328]'
              }`}
              title={isLiveStreaming ? 'Pause live tracking' : 'Resume live tracking'}
            >
              {isLiveStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-[#042F34]" />
                  <span>Stream Live</span>
                </>
              )}
            </button>

            {/* Tick Speed Selector */}
            <div className="flex items-center bg-[#E4EEF0] border border-[#cddfe2] rounded-md p-0.5 text-xs font-mono">
              <span className="px-2 text-[10px] text-[#16232B]/60 font-sans hidden sm:inline">Speed:</span>
              {[
                { label: '1s', val: 1000 },
                { label: '1.5s', val: 1500 },
                { label: '3s', val: 3000 },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => setTickSpeed(s.val)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    tickSpeed === s.val
                      ? 'bg-[#042F34] text-white'
                      : 'text-[#16232B] hover:text-[#042F34]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Fit / Reset Zoom */}
            <button
              onClick={handleResetZoom}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#E4EEF0] hover:bg-white text-[#042F34] border border-[#cddfe2] rounded-md text-xs font-medium transition-colors"
              title="Reset View to Fit"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fit</span>
            </button>
          </div>

        </div>

        {/* 2. Secondary Bar: Chart Style, Indicators, Timeframes */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-[#cddfe2] text-xs">
          
          {/* Chart Type & Indicator Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Chart Style Switch */}
            <div className="flex items-center bg-[#E4EEF0] p-0.5 rounded-md border border-[#cddfe2]">
              <button
                onClick={() => setChartStyle('candles')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  chartStyle === 'candles'
                    ? 'bg-[#042F34] text-[#B5F2DB] font-bold shadow-xs'
                    : 'text-[#16232B] hover:text-[#042F34]'
                }`}
              >
                Candlestick
              </button>
              <button
                onClick={() => setChartStyle('area')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  chartStyle === 'area'
                    ? 'bg-[#042F34] text-[#B5F2DB] font-bold shadow-xs'
                    : 'text-[#16232B] hover:text-[#042F34]'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartStyle('line')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  chartStyle === 'line'
                    ? 'bg-[#042F34] text-[#B5F2DB] font-bold shadow-xs'
                    : 'text-[#16232B] hover:text-[#042F34]'
                }`}
              >
                Line
              </button>
            </div>

            {/* Indicator Toggles */}
            <button
              onClick={() => setShowSma(!showSma)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border transition-colors ${
                showSma
                  ? 'bg-[#FFC933]/25 border-[#FFC933] text-[#825b00] font-bold'
                  : 'bg-white border-[#cddfe2] text-[#16232B]/60 hover:text-[#16232B]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FFC933]" />
              30D SMA
            </button>

            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border transition-colors ${
                showVolume
                  ? 'bg-[#042F34] border-[#042F34] text-[#B5F2DB] font-bold'
                  : 'bg-white border-[#cddfe2] text-[#16232B]/60 hover:text-[#16232B]'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              Volume
            </button>

            {/* Factor breakdown toggle */}
            <button
              onClick={() => setShowFactorBreakdown(!showFactorBreakdown)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border transition-colors ${
                showFactorBreakdown
                  ? 'bg-[#B5F2DB] border-[#042F34] text-[#042F34] font-bold'
                  : 'bg-white border-[#cddfe2] text-[#16232B]/60 hover:text-[#16232B]'
              }`}
            >
              <Sliders className="w-3 h-3 text-[#042F34]" />
              Risk Factor Matrix
            </button>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center bg-[#E4EEF0] p-0.5 rounded-md border border-[#cddfe2] self-start sm:self-auto font-mono">
            {(['1D', '5D', '1M', '3M', '6M', '1Y', 'ALL'] as TimeframeType[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  timeframe === tf
                    ? 'bg-[#042F34] text-[#B5F2DB] shadow-xs'
                    : 'text-[#16232B] hover:text-[#042F34]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 3. Real-Time HUD / Legend Bar (Open, High, Low, Close, Volume) */}
      <div className="px-5 py-2.5 bg-[#F8FAFB] border-b border-[#cddfe2] text-xs font-mono flex items-center justify-between flex-wrap gap-2 text-[#16232B]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[#16232B]/60 font-sans">Date:</span>
            <span className="font-bold text-[#042F34]">{legendInfo?.time || '—'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#16232B]/60 font-sans">O:</span>
            <span className="font-semibold">{legendInfo?.open ? `${currencySymbol}${legendInfo.open.toFixed(2)}` : '—'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#16232B]/60 font-sans">H:</span>
            <span className="font-semibold text-emerald-700">{legendInfo?.high ? `${currencySymbol}${legendInfo.high.toFixed(2)}` : '—'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#16232B]/60 font-sans">L:</span>
            <span className="font-semibold text-red-700">{legendInfo?.low ? `${currencySymbol}${legendInfo.low.toFixed(2)}` : '—'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#16232B]/60 font-sans">C:</span>
            <span className="font-bold text-[#042F34]">{legendInfo?.close ? `${currencySymbol}${legendInfo.close.toFixed(2)}` : '—'}</span>
          </div>

          {legendInfo?.volume && (
            <div className="flex items-center gap-1.5 hidden md:flex">
              <span className="text-[#16232B]/60 font-sans">Vol:</span>
              <span className="font-semibold text-slate-700">{(legendInfo.volume / 1e6).toFixed(2)}M</span>
            </div>
          )}
        </div>

        {/* Powered by TradingView & Indian Stock Market API badge */}
        <div className="text-[11px] text-[#16232B]/60 font-sans flex items-center gap-2">
          <span>Engine: <strong className="text-[#042F34]">TradingView Lightweight Charts™</strong></span>
          {stock.market === 'IN' && (
            <>
              <span>·</span>
              <span className="text-[#042F34] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                NSE/BSE Indian Market API
              </span>
            </>
          )}
        </div>
      </div>

      {/* 4. Canvas Container for Lightweight Charts */}
      <div className="relative w-full bg-white">
        <div ref={containerRef} className="w-full h-[420px]" />
      </div>

      {/* 5. Live Market Depth & Stock Metrics */}
      <div className="p-4 sm:p-5 bg-[#E4EEF0]/40 border-t border-[#cddfe2] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white p-2.5 rounded border border-[#cddfe2]">
          <span className="text-[10px] text-[#16232B]/60 block font-medium">DAY RANGE</span>
          <span className="font-mono font-bold text-[#042F34]">
            {currencySymbol}{legendInfo?.low?.toFixed(2) || '—'} – {currencySymbol}{legendInfo?.high?.toFixed(2) || '—'}
          </span>
        </div>

        <div className="bg-white p-2.5 rounded border border-[#cddfe2]">
          <span className="text-[10px] text-[#16232B]/60 block font-medium">MARKET CAP</span>
          <span className="font-mono font-bold text-[#16232B]">
            {stock.marketCap}
          </span>
        </div>

        <div className="bg-white p-2.5 rounded border border-[#cddfe2]">
          <span className="text-[10px] text-[#16232B]/60 block font-medium">ANNUALIZED VOL</span>
          <span className="font-mono font-bold text-[#042F34]">
            {(stock.stats.annualizedVolatility * 100).toFixed(1)}%
          </span>
        </div>

        <div className="bg-white p-2.5 rounded border border-[#cddfe2]">
          <span className="text-[10px] text-[#16232B]/60 block font-medium">BETA (VS NIFTY/SPY)</span>
          <span className="font-mono font-bold text-[#16232B]">
            {stock.fiveFactorModel.marketCorrelation.rawMetricValue}
          </span>
        </div>

        <div className="bg-white p-2.5 rounded border border-[#cddfe2]">
          <span className="text-[10px] text-[#16232B]/60 block font-medium">DAILY STD DEV (σ)</span>
          <span className="font-mono font-bold text-[#042F34]">
            {(stock.stats.dailyStandardDeviation * 100).toFixed(2)}%
          </span>
        </div>

        <div className="bg-white p-2.5 rounded border border-[#cddfe2]">
          <span className="text-[10px] text-[#16232B]/60 block font-medium">OVERALL RISK SCORE</span>
          <span className="font-mono font-bold text-[#042F34]">
            {stock.fiveFactorModel.totalScore.toFixed(1)} / 100
          </span>
        </div>
      </div>

      {/* 6. Expandable Factor Risk Matrix Drawer */}
      {showFactorBreakdown && (
        <div className="p-4 sm:p-5 bg-white border-t border-[#cddfe2] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#042F34] uppercase tracking-wider font-mono">
              Quantitative 5-Factor Risk Weight Matrix ({stock.symbol})
            </h4>
            <span className="text-xs text-[#16232B]/60 font-mono">
              Formula: Risk Score = Σ (Risk Value × Weight)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              stock.fiveFactorModel.volatility,
              stock.fiveFactorModel.liquidity,
              stock.fiveFactorModel.marketCorrelation,
              stock.fiveFactorModel.leverageDebt,
              stock.fiveFactorModel.trackRecordCredit,
            ].map((f) => (
              <div
                key={f.id}
                className="bg-[#E4EEF0] border border-[#cddfe2] rounded p-3 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#042F34]">{f.shortName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#042F34] text-white">
                    {f.weightPercent}
                  </span>
                </div>
                <div className="text-lg font-mono font-bold text-[#16232B]">
                  {f.normalizedScore.toFixed(0)} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                </div>
                <div className="text-[11px] text-[#16232B]/70 font-mono">
                  Raw: {f.rawMetricValue} {f.rawMetricUnit}
                </div>
                <div className="text-[10px] text-[#042F34] font-mono pt-1 border-t border-[#cddfe2]">
                  Contribution: +{f.contribution.toFixed(1)} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
