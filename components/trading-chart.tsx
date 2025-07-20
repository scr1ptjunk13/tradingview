"use client";

import type React from "react";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  createChart,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  AreaSeries,
  BaselineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type HistogramData,
  type Time,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadIcon, KeyboardIcon, RefreshCcwIcon } from "lucide-react";
import type { CandlestickData, VolumeData, Timeframe, ChartType } from "@/types/chart";
import { generateMockCandleData, generateMockVolumeData, simulateRealtimeUpdate, formatPrice, transformData } from "@/lib/chart-utils";
import DrawingCanvas from "./drawing-canvas";
import type { Drawing, DrawingTool, LineDrawing } from "@/types/drawing";
import { useToolbox } from "./toolbox-provider";

const CHART_HEIGHT = 400;
const MAX_DATA_POINTS = 1000;
const UPDATE_INTERVAL_MS = 2000;

interface TradingChartProps {
  selectedTimeframe: Timeframe;
  setSelectedTimeframe: (timeframe: Timeframe) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  activeTool: DrawingTool | null;
  drawings: Drawing[];
  drawingInProgress: LineDrawing | null;
  handleMouseDown: (event: React.MouseEvent<SVGSVGElement>) => void;
  handleMouseMove: (event: React.MouseEvent<SVGSVGElement>) => void;
  handleMouseUp: () => void;
  chartApiRef: React.MutableRefObject<IChartApi | null>;
  candlestickSeriesRef: React.MutableRefObject<ISeriesApi<any> | null>;
  selectedChartType: ChartType;
  setSelectedChartType: (chartType: ChartType) => void;
}

interface ChartState {
  isReady: boolean;
  isUpdating: boolean;
  currentType: ChartType;
  lastUpdateId: number;
  isChangingType: boolean; // New flag to track chart type changes
}

export default function TradingChart({
  selectedTimeframe,
  setSelectedTimeframe,
  isLoading,
  setIsLoading,
  error,
  setError,
  activeTool,
  drawings,
  drawingInProgress,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  chartApiRef,
  candlestickSeriesRef,
  selectedChartType,
  setSelectedChartType,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const realtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateQueueRef = useRef<Promise<void>>(Promise.resolve());
  const isInitializing = useRef(false);
  const chartInitialized = useRef(false);

  const [currentCandleData, setCurrentCandleData] = useState<CandlestickData[]>([]);
  const [currentVolumeData, setCurrentVolumeData] = useState<VolumeData[]>([]);

  const [chartState, setChartState] = useState<ChartState>({
    isReady: false,
    isUpdating: false,
    currentType: selectedChartType,
    lastUpdateId: 0,
    isChangingType: false,
  });

  const { magnetMode } = useToolbox();

  // Chart options - memoized to prevent unnecessary re-renders
  const chartOptions = useMemo(() => ({
    layout: {
      background: { color: "transparent" },
      textColor: "#d1d4dc",
    },
    grid: {
      vertLines: { color: "#334155" },
      horzLines: { color: "#334155" },
    },
    crosshair: {
      mode: 1,
    },
    rightPriceScale: {
      borderColor: "#485563",
    },
    timeScale: {
      borderColor: "#485563",
      timeVisible: true,
      secondsVisible: false,
    },
  }), []);

  const validateAndCleanData = useCallback((data: CandlestickData[]): CandlestickData[] => {
    if (!data || data.length === 0) return [];
    const uniqueData = data.reduce((acc, current) => {
      const existingIndex = acc.findIndex(item => item.time === current.time);
      if (existingIndex >= 0) {
        acc[existingIndex] = current;
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as CandlestickData[]);

    uniqueData.sort((a, b) => (a.time as number) - (b.time as number));
    for (let i = 1; i < uniqueData.length; i++) {
      if ((uniqueData[i].time as number) <= (uniqueData[i - 1].time as number)) {
        uniqueData[i] = { ...uniqueData[i], time: (uniqueData[i - 1].time as number) + 1 };
      }
    }
    return uniqueData.slice(-MAX_DATA_POINTS);
  }, []);

  const validateAndCleanVolumeData = useCallback((data: VolumeData[]): VolumeData[] => {
    if (!data || data.length === 0) return [];
    const uniqueData = data.reduce((acc, current) => {
      const existingIndex = acc.findIndex(item => item.time === current.time);
      if (existingIndex >= 0) {
        acc[existingIndex] = current;
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as VolumeData[]);

    uniqueData.sort((a, b) => (a.time as number) - (b.time as number));
    return uniqueData.slice(-MAX_DATA_POINTS);
  }, []);

  const transformVolumeData = useCallback((data: VolumeData[]): HistogramData<Time>[] => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      time: item.time as Time,
      value: item.value,
    }));
  }, []);

  const safeRemoveSeries = useCallback((chart: IChartApi, series: ISeriesApi<any> | null) => {
    if (!chart || !series) return;
    try {
      if (!(chart as any)._internal?.disposed && !(series as any)._internal?.disposed) {
        chart.removeSeries(series);
      }
    } catch (error) {
      console.warn("Series removal failed:", error);
    }
  }, []);

  const createSeries = useCallback(
    (chart: IChartApi, type: ChartType): ISeriesApi<any> | null => {
      console.log(`Creating series for chart type: ${type}`);
      const avgPrice = currentCandleData.length > 0
        ? currentCandleData.reduce((sum, c) => sum + c.close, 0) / currentCandleData.length
        : 50000;

      switch (type) {
        case "candlestick":
          return chart.addSeries(CandlestickSeries, { upColor: "#26a69a", downColor: "#ef5350", borderVisible: false, wickUpColor: "#26a69a", wickDownColor: "#ef5350" });
        case "hollow-candlestick":
          return chart.addSeries(CandlestickSeries, { upColor: "rgba(38, 166, 154, 0)", downColor: "#ef5350", borderUpColor: "#26a69a", borderDownColor: "#ef5350", borderVisible: true, wickUpColor: "#26a69a", wickDownColor: "#ef5350" });
        case "heikin-ashi":
          return chart.addSeries(CandlestickSeries, { upColor: "#26a69a", downColor: "#ef5350", borderVisible: false, wickUpColor: "#26a69a", wickDownColor: "#ef5350" });
        case "bar":
          return chart.addSeries(BarSeries, { upColor: "#26a69a", downColor: "#ef5350", thinBars: false });
        case "hlc-bar":
          return chart.addSeries(BarSeries, { upColor: "#26a69a", downColor: "#ef5350", thinBars: true, openVisible: false });
        case "columns":
          return chart.addSeries(BarSeries, { upColor: "#26a69a", downColor: "#ef5350", thinBars: false });
        case "line":
          return chart.addSeries(LineSeries, { color: "#00bcd4", lineWidth: 2, lineStyle: 0 });
        case "line-with-markers":
          return chart.addSeries(LineSeries, { color: "#00bcd4", lineWidth: 2, lineStyle: 0, pointMarkersVisible: true });
        case "step-line":
          return chart.addSeries(LineSeries, { color: "#00bcd4", lineWidth: 2, lineStyle: 0, lineType: 1 });
        case "area":
          return chart.addSeries(AreaSeries, { lineColor: "#00bcd4", topColor: "rgba(0, 188, 212, 0.5)", bottomColor: "rgba(0, 188, 212, 0.1)", lineWidth: 2 });
        case "hlc-area":
          return chart.addSeries(AreaSeries, { lineColor: "#00bcd4", topColor: "rgba(0, 188, 212, 0.3)", bottomColor: "rgba(0, 188, 212, 0.05)", lineWidth: 1 });
        case "baseline":
          return chart.addSeries(BaselineSeries, {
            baseValue: { type: "price", price: avgPrice },
            topLineColor: "#26a69a",
            bottomLineColor: "#ef5350",
            topFillColor1: "rgba(38, 166, 154, 0.3)",
            topFillColor2: "rgba(38, 166, 154, 0.1)",
            bottomFillColor1: "rgba(239, 83, 80, 0.3)",
            bottomFillColor2: "rgba(239, 83, 80, 0.1)",
            lineWidth: 2,
          });
        default:
          console.error(`Unsupported chart type: ${type}, no series created`);
          return null; // Prevent defaulting to CandlestickSeries
      }
    },
    [currentCandleData]
  );

  const queueUpdate = useCallback((updateFn: () => Promise<void>): Promise<void> => {
    updateQueueRef.current = updateQueueRef.current
      .then(() => updateFn())
      .catch((error) => {
        console.error("Queued update failed:", error);
        throw error;
      });
    return updateQueueRef.current;
  }, []);

  const updateChartSeries = useCallback(
    async (chart: IChartApi, type: ChartType, candleData: CandlestickData[], volumeData: VolumeData[]): Promise<void> => {
      return queueUpdate(async () => {
        if (!chart || (chart as any)._internal?.disposed) {
          console.warn("Chart is disposed, aborting update");
          return;
        }

        console.log(`Updating chart series from ${chartState.currentType} to: ${type}`);
        setChartState(prev => ({ ...prev, isUpdating: true, isChangingType: true }));

        try {
          if (realtimeIntervalRef.current) {
            clearInterval(realtimeIntervalRef.current);
            realtimeIntervalRef.current = null;
          }

          if (candlestickSeriesRef.current) {
            safeRemoveSeries(chart, candlestickSeriesRef.current);
            candlestickSeriesRef.current = null;
            await new Promise(resolve => setTimeout(resolve, 100)); // Extra delay for cleanup
          }
          if (volumeSeriesRef.current) {
            safeRemoveSeries(chart, volumeSeriesRef.current);
            volumeSeriesRef.current = null;
          }

          // Increase this delay from 50ms to 200ms
          await new Promise(resolve => setTimeout(resolve, 200));

          candlestickSeriesRef.current = createSeries(chart, type);
          if (!candlestickSeriesRef.current) {
            throw new Error(`Failed to create series for type: ${type}`);
          }
          
          // Force style reset for hollow-candlestick
          if (type === "hollow-candlestick") {
            candlestickSeriesRef.current.applyOptions({
              upColor: "rgba(38, 166, 154, 0)",
              downColor: "#ef5350",
              borderUpColor: "#26a69a",
              borderDownColor: "#ef5350",
              borderVisible: true,
              wickUpColor: "#26a69a",
              wickDownColor: "#ef5350",
            });
          }
          
          // Debug logging for series creation
          console.log(`Series created: ${candlestickSeriesRef.current?.constructor.name}, Type: ${type}`);
          console.log(`Current options:`, candlestickSeriesRef.current?.options());
          
          // After creating volumeSeriesRef.current
          volumeSeriesRef.current = chart.addSeries(HistogramSeries, { 
            color: "#26a69a", 
            priceFormat: { type: "volume" },
            priceScaleId: "volume", // Move volume to separate price scale
          });

          // Add this to make volume less visually dominant
          chart.priceScale("volume").applyOptions({
            scaleMargins: {
              top: 0.7, // Push volume to bottom 30% of chart
              bottom: 0,
            },
          });

          if (candleData.length > 0 && volumeData.length > 0) {
            const cleanCandleData = validateAndCleanData(candleData);
            const cleanVolumeData = validateAndCleanVolumeData(volumeData);

            if (cleanCandleData.length > 0 && cleanVolumeData.length > 0) {
              const transformedData = transformData(cleanCandleData, type);
              const transformedVolumeData = transformVolumeData(cleanVolumeData);

              if (candlestickSeriesRef.current && volumeSeriesRef.current) {
                candlestickSeriesRef.current.setData(transformedData);
                volumeSeriesRef.current.setData(transformedVolumeData);
              }

              setTimeout(() => {
                if (chart && typeof chart.timeScale === 'function') {
                  try {
                    chart.timeScale().fitContent();
                  } catch (error) {
                    console.warn("Failed to fit content:", error);
                  }
                }
              }, 100);
            }
          }

          setChartState(prev => ({
            ...prev,
            isReady: true,
            isUpdating: false,
            currentType: type,
            lastUpdateId: prev.lastUpdateId + 1,
            isChangingType: false,
          }));

          console.log(`Chart series updated successfully to: ${type}`);
        } catch (error) {
          console.error("Failed to update chart series:", error);
          setError("Failed to update chart series");
          setChartState(prev => ({ ...prev, isReady: true, isUpdating: false, isChangingType: false }));
        }
      });
    },
    [queueUpdate, safeRemoveSeries, createSeries, validateAndCleanData, validateAndCleanVolumeData, transformData, transformVolumeData, setError, chartState.currentType]
  );

  const fetchChartData = useCallback(
    async (timeframe: Timeframe) => {
      setIsLoading(true);
      setError(null);

      try {
        if (realtimeIntervalRef.current) {
          clearInterval(realtimeIntervalRef.current);
          realtimeIntervalRef.current = null;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        const candles = generateMockCandleData(timeframe, MAX_DATA_POINTS);
        const volumes = generateMockVolumeData(candles);

        console.log("Fetched candle data:", candles.length, "points");
        console.log("Fetched volume data:", volumes.length, "points");

        const cleanCandles = validateAndCleanData(candles);
        const cleanVolumes = validateAndCleanVolumeData(volumes);

        setCurrentCandleData(cleanCandles);
        setCurrentVolumeData(cleanVolumes);
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
        setError("Failed to load chart data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setError, validateAndCleanData, validateAndCleanVolumeData]
  );

  useEffect(() => {
    if (chartInitialized.current || !chartContainerRef.current) return;
    chartInitialized.current = true;

    if (isInitializing.current) return;
    isInitializing.current = true;

    console.log("Initializing chart with container:", chartContainerRef.current);

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth || 800,
      height: CHART_HEIGHT,
    });

    chartApiRef.current = chart;

    updateChartSeries(chart, selectedChartType, [], []);

    const handleResize = () => {
      if (chartContainerRef.current && chartApiRef.current) {
        chartApiRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth || 800,
          height: CHART_HEIGHT,
        });
      }
    };

    const handleCrosshairMove = (param: MouseEventParams) => {
      if (!tooltipRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;

      if (param.time) {
        const price = param.seriesData.get(candlestickSeriesRef.current);
        const volume = param.seriesData.get(volumeSeriesRef.current) as HistogramData | undefined;

        if (price && "close" in price) {
          const date = new Date((param.time as number) * 1000);
          const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const dateStr = date.toLocaleDateString();

          tooltipRef.current.style.display = "block";
          tooltipRef.current.innerHTML = `
            <div class="text-xs text-gray-400">${dateStr} ${timeStr}</div>
            <div class="text-sm font-bold">O: ${formatPrice(price.open)} H: ${formatPrice(price.high)} L: ${formatPrice(price.low)} C: ${formatPrice(price.close)}</div>
            <div class="text-xs text-gray-400">Vol: ${volume?.value?.toFixed(0) || "N/A"}</div>
          `;

          if (param.point && chartContainerRef.current) {
            const { width, height } = chartContainerRef.current.getBoundingClientRect();
            let left = param.point.x + 10;
            let top = param.point.y + 10;

            if (left + tooltipRef.current.offsetWidth > width) left = width - tooltipRef.current.offsetWidth;
            if (top + tooltipRef.current.offsetHeight > height) top = height - tooltipRef.current.offsetHeight;
            if (left < 0) left = 0;
            if (top < 0) top = 0;

            tooltipRef.current.style.left = `${left}px`;
            tooltipRef.current.style.top = `${top}px`;
          }
        } else if (price && "value" in price) {
          const date = new Date((param.time as number) * 1000);
          const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const dateStr = date.toLocaleDateString();

          tooltipRef.current.style.display = "block";
          tooltipRef.current.innerHTML = `
            <div class="text-xs text-gray-400">${dateStr} ${timeStr}</div>
            <div class="text-sm font-bold">Price: ${formatPrice(price.value)}</div>
            <div class="text-xs text-gray-400">Vol: ${volume?.value?.toFixed(0) || "N/A"}</div>
          `;
        }
      } else {
        tooltipRef.current.style.display = "none";
      }
    };

    window.addEventListener("resize", handleResize);
    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chartInitialized.current = false;
      isInitializing.current = false;
      window.removeEventListener("resize", handleResize);
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
      if (chartApiRef.current) {
        chartApiRef.current.remove();
        chartApiRef.current = null;
      }
    };
  }, [chartOptions]);

  useEffect(() => {
    if (!chartApiRef.current || chartState.isUpdating || chartState.isChangingType) return;

    if (chartState.currentType !== selectedChartType && currentCandleData.length > 0) {
      console.log(`Chart type changing from ${chartState.currentType} to ${selectedChartType}`);
      
      // Clear any pending real-time updates before changing type
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
      
      updateChartSeries(chartApiRef.current, selectedChartType, currentCandleData, currentVolumeData);
    }
  }, [selectedChartType, chartState.currentType, chartState.isUpdating, chartState.isChangingType, currentCandleData, currentVolumeData, updateChartSeries]);

  useEffect(() => {
    if (!chartApiRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current || !chartState.isReady) return;

    if (currentCandleData.length === 0 || currentVolumeData.length === 0) return;
    if (chartState.isUpdating) return;

    console.log("Updating chart data - Candles:", currentCandleData.length, "Volume:", currentVolumeData.length);

    try {
      const cleanCandleData = validateAndCleanData(currentCandleData);
      const cleanVolumeData = validateAndCleanVolumeData(currentVolumeData);

      if (cleanCandleData.length > 0 && cleanVolumeData.length > 0) {
        const transformedData = transformData(cleanCandleData, chartState.currentType);
        const transformedVolumeData = transformVolumeData(cleanVolumeData);

        candlestickSeriesRef.current.setData(transformedData);
        volumeSeriesRef.current.setData(transformedVolumeData);

        setTimeout(() => {
          if (chartApiRef.current) {
            chartApiRef.current.timeScale().fitContent();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Failed to update chart data:", error);
      setError("Failed to update chart data");
    }
  }, [currentCandleData, currentVolumeData, chartState.isReady, chartState.isUpdating, chartState.currentType, validateAndCleanData, validateAndCleanVolumeData, transformData, transformVolumeData, setError]);

  useEffect(() => {
    if (realtimeIntervalRef.current) {
      clearInterval(realtimeIntervalRef.current);
      realtimeIntervalRef.current = null;
    }

    if (!isLoading &&
        currentCandleData.length > 0 &&
        candlestickSeriesRef.current &&
        chartState.isReady &&
        !chartState.isUpdating &&
        !chartState.isChangingType) {
      console.log("Starting real-time updates for chart type:", chartState.currentType); // Use currentType here

      realtimeIntervalRef.current = setInterval(() => {
        if (!chartApiRef.current || 
            !candlestickSeriesRef.current || 
            chartState.isUpdating || 
            chartState.isChangingType ||
            !chartState.isReady) return;
        
        // Add this check to ensure series exists and matches expected type
        if ((candlestickSeriesRef.current as any)._internal?.disposed) {
          console.warn("Series is disposed, stopping real-time updates");
          return;
        }
        
        // Check series type matches current chart type
        const seriesType = candlestickSeriesRef.current.constructor.name; // e.g., "CandlestickSeries"
        if (chartState.currentType === "hollow-candlestick" && seriesType !== "CandlestickSeries") {
          console.warn("Series type mismatch, skipping update");
          return;
        }

        setCurrentCandleData((prevCandles) => {
          if (prevCandles.length === 0) return prevCandles;

          const lastCandle = prevCandles[prevCandles.length - 1];
          if (!lastCandle) return prevCandles;

          try {
            const { newCandle, newVolume } = simulateRealtimeUpdate(lastCandle, selectedTimeframe);
            const newTime = Math.max((newCandle.time as number), (lastCandle.time as number) + 1);
            const updatedCandle = { ...newCandle, time: newTime };
            const updatedVolume = { ...newVolume, time: newTime };

            if (candlestickSeriesRef.current && !(candlestickSeriesRef.current as any)._internal?.disposed) {
              const transformedUpdate = transformData([updatedCandle], chartState.currentType)[0]; // Use chartState.currentType
              if (transformedUpdate) {
                console.log(`Real-time update for ${chartState.currentType}:`, transformedUpdate);
                candlestickSeriesRef.current.update(transformedUpdate);
              }
            }

            setCurrentVolumeData((prevVolumes) => {
              const newVolumeData = [...prevVolumes, updatedVolume].slice(-MAX_DATA_POINTS);
              const cleanVolumeData = validateAndCleanVolumeData(newVolumeData);

              if (volumeSeriesRef.current && typeof volumeSeriesRef.current.update === 'function' && cleanVolumeData.length > 0) {
                try {
                  volumeSeriesRef.current.update({ time: updatedVolume.time as Time, value: updatedVolume.value });
                } catch (error) {
                  console.warn("Failed to update volume series:", error);
                }
              }

              return cleanVolumeData;
            });

            return validateAndCleanData([...prevCandles, updatedCandle]);
          } catch (error) {
            console.error("Real-time update failed:", error);
            return prevCandles;
          }
        });
      }, UPDATE_INTERVAL_MS);
    }

    return () => {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
    };
  }, [isLoading, selectedTimeframe, currentCandleData.length, chartState.isReady, chartState.isUpdating, chartState.isChangingType, chartState.currentType, validateAndCleanData, validateAndCleanVolumeData, transformData, transformVolumeData]); // Change the dependency array to include chartState.currentType

  useEffect(() => {
    fetchChartData(selectedTimeframe);
  }, [selectedTimeframe, fetchChartData]);

  const handleResetZoom = useCallback(() => {
    if (chartApiRef.current && typeof chartApiRef.current.timeScale === 'function') {
      try {
        chartApiRef.current.timeScale().fitContent();
      } catch (error) {
        console.warn("Failed to reset zoom:", error);
      }
    }
  }, []);

  const handleExportChart = useCallback(() => {
    if (chartApiRef.current && typeof chartApiRef.current.takeScreenshot === 'function') {
      try {
        const link = document.createElement("a");
        link.download = "trading-chart.png";
        link.href = chartApiRef.current.takeScreenshot().toDataURL();
        link.click();
      } catch (error) {
        console.warn("Failed to export chart:", error);
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        handleResetZoom();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleResetZoom]);

  return (
    <Card className="flex-1 bg-[#1a1a1a] text-white rounded-lg shadow-lg flex flex-col border border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-800">
        <CardTitle className="text-lg font-semibold text-gray-200">SMAG/SOL Market Cap (USD)</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleResetZoom} className="text-gray-400 hover:text-white hover:bg-gray-700" aria-label="Reset Zoom">
            <RefreshCcwIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExportChart} className="text-gray-400 hover:text-white hover:bg-gray-700" aria-label="Export Chart as Image">
            <DownloadIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700" aria-label="Keyboard Shortcuts">
            <KeyboardIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-10 transition-opacity duration-200">
            <div className="animate-pulse text-gray-400">Loading chart data...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-10 text-red-500">{error}</div>
        )}
        <div ref={chartContainerRef} className="w-full h-full transition-opacity duration-200" style={{ height: CHART_HEIGHT, minWidth: "300px" }}>
          {!chartApiRef.current && <div className="text-red-500">Chart failed to initialize</div>}
        </div>
        <div ref={tooltipRef} className="absolute bg-gray-900 text-white p-2 rounded shadow-md pointer-events-none z-20 hidden" style={{ minWidth: "120px" }} />
        <DrawingCanvas
          chartApi={chartApiRef.current}
          candlestickSeries={candlestickSeriesRef.current}
          chartContainerRef={chartContainerRef as React.RefObject<HTMLDivElement>}
          activeTool={activeTool}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          drawings={drawings}
          drawingInProgress={drawingInProgress}
        />
      </CardContent>
    </Card>
  );
}