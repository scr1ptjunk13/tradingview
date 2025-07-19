"use client";

import type React from "react";
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
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
  type CandlestickSeriesPartialOptions,
  type HistogramSeriesPartialOptions,
  type BarSeriesPartialOptions,
  type LineSeriesPartialOptions,
  type AreaSeriesPartialOptions,
  type BaselineSeriesPartialOptions,
  type MouseEventParams,
  type HistogramData,
  type Time,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadIcon, KeyboardIcon, RefreshCcwIcon } from "lucide-react";
import type { CandlestickData, VolumeData, Timeframe, ChartType } from "@/types/chart";
import { generateMockCandleData, generateMockVolumeData, simulateRealtimeUpdate, formatPrice } from "@/lib/chart-utils";
import DrawingCanvas from "./drawing-canvas";
import type { Drawing, DrawingTool, LineDrawing } from "@/types/drawing";
import { useToolbox } from "./toolbox-provider";

// Constants
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
  const [pendingChartType, setPendingChartType] = useState<ChartType | null>(null);
  const [chartState, setChartState] = useState<ChartState>({
    isReady: false,
    isUpdating: false,
    currentType: selectedChartType,
    lastUpdateId: 0,
  });


  const { magnetMode } = useToolbox();

  // Chart options - memoized to prevent unnecessary re-renders
  const chartOptions = useMemo(() => ({
    layout: { background: { color: "#1a1a1a" }, textColor: "#d1d4dc" },
    grid: { vertLines: { color: "#2b2b43" }, horzLines: { color: "#2b2b43" } },
    timeScale: { timeVisible: true, secondsVisible: true, borderVisible: false },
    rightPriceScale: { borderVisible: false },
    crosshair: { mode: 0 },
  }), []);

  // Data validation and cleaning utilities
  const validateAndCleanData = useCallback((data: CandlestickData[]): CandlestickData[] => {
    if (!data || data.length === 0) return [];
    
    // Remove duplicates and sort by time
    const uniqueData = data.reduce((acc, current) => {
      const existingIndex = acc.findIndex(item => item.time === current.time);
      if (existingIndex >= 0) {
        // Update existing entry with latest data
        acc[existingIndex] = current;
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as CandlestickData[]);

    // Sort by time
    uniqueData.sort((a, b) => (a.time as number) - (b.time as number));

    // Validate sequential ordering
    for (let i = 1; i < uniqueData.length; i++) {
      if ((uniqueData[i].time as number) <= (uniqueData[i-1].time as number)) {
        console.error(`Data ordering error at index ${i}: current=${uniqueData[i].time}, previous=${uniqueData[i-1].time}`);
        // Fix by incrementing time slightly
        uniqueData[i] = {
          ...uniqueData[i],
          time: (uniqueData[i-1].time as number) + 1
        };
      }
    }

    return uniqueData.slice(-MAX_DATA_POINTS);
  }, []);

  const validateAndCleanVolumeData = useCallback((data: VolumeData[]): VolumeData[] => {
    if (!data || data.length === 0) return [];
    
    // Remove duplicates and sort by time
    const uniqueData = data.reduce((acc, current) => {
      const existingIndex = acc.findIndex(item => item.time === current.time);
      if (existingIndex >= 0) {
        acc[existingIndex] = current;
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as VolumeData[]);

    // Sort by time
    uniqueData.sort((a, b) => (a.time as number) - (b.time as number));

    return uniqueData.slice(-MAX_DATA_POINTS);
  }, []);

  // Transform data for chart type
  const transformData = useCallback((data: CandlestickData[], chartType: ChartType): any[] => {
    if (!data || data.length === 0) return [];

    if (chartType === "heikin-ashi") {
      const haData: CandlestickData[] = [];
      let prevHA: CandlestickData | null = null;
      
      data.forEach((candle, index) => {
        let haOpen = index === 0 ? (candle.open + candle.close) / 2 : prevHA ? (prevHA.open + prevHA.close) / 2 : candle.open;
        const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
        const haHigh = Math.max(candle.high, haOpen, haClose);
        const haLow = Math.min(candle.low, haOpen, haClose);
        
        const haCandle = { time: candle.time, open: haOpen, high: haHigh, low: haLow, close: haClose };
        haData.push(haCandle);
        prevHA = haCandle;
      });
      return haData;
    }
    
    return ["line", "line-with-markers", "step-line", "area", "hlc-area", "baseline"].includes(chartType)
      ? data.map((c) => ({ time: c.time, value: c.close }))
      : data;
  }, []);

  // Transform volume data to HistogramData
  const transformVolumeData = useCallback((data: VolumeData[]): HistogramData<Time>[] => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      time: item.time as Time,
      value: item.value,
    }));
  }, []);

  // Fix 1: Add safety checks to prevent using disposed objects
  const safeRemoveSeries = useCallback((chart: IChartApi, series: ISeriesApi<any> | null) => {
    if (!chart || !series) return;
    try {
      // Check if chart and series are still valid
      if (!(chart as any)._internal?.disposed && !(series as any)._internal?.disposed) {
        chart.removeSeries(series);
      }
    } catch (error) {
      // Silently handle - series may already be removed
    }
  }, []);

  // Create series for chart type
  const createSeries = useCallback(
    (chart: IChartApi, type: ChartType): ISeriesApi<any> => {
      console.log(`Creating series for chart type: ${type}`);
      
      const avgPrice = currentCandleData.length > 0 
        ? currentCandleData.reduce((sum, c) => sum + c.close, 0) / currentCandleData.length 
        : 50000;

      switch (type) {
        case "candlestick":
          return chart.addSeries(CandlestickSeries, {
            upColor: "#26a69a",
            downColor: "#ef5350",
            borderVisible: false,
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
          });
        case "hollow-candlestick":
          return chart.addSeries(CandlestickSeries, {
            upColor: "rgba(38, 166, 154, 0)",
            downColor: "#ef5350",
            borderUpColor: "#26a69a",
            borderDownColor: "#ef5350",
            borderVisible: true,
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
          });
        case "heikin-ashi":
          return chart.addSeries(CandlestickSeries, {
            upColor: "#26a69a",
            downColor: "#ef5350",
            borderVisible: false,
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
          });
        case "bar":
          return chart.addSeries(BarSeries, {
            upColor: "#26a69a",
            downColor: "#ef5350",
            thinBars: false,
          });
        case "hlc-bar":
          return chart.addSeries(BarSeries, {
            upColor: "#26a69a",
            downColor: "#ef5350",
            thinBars: true,
            openVisible: false,
          });
        case "columns":
          return chart.addSeries(BarSeries, {
            upColor: "#26a69a",
            downColor: "#ef5350",
            thinBars: false,
          });
        case "line":
          return chart.addSeries(LineSeries, {
            color: "#00bcd4",
            lineWidth: 2,
            lineStyle: 0,
          });
        case "line-with-markers":
          return chart.addSeries(LineSeries, {
            color: "#00bcd4",
            lineWidth: 2,
            lineStyle: 0,
            pointMarkersVisible: true,
          });
        case "step-line":
          return chart.addSeries(LineSeries, {
            color: "#00bcd4",
            lineWidth: 2,
            lineStyle: 0,
            lineType: 1,
          });
        case "area":
          return chart.addSeries(AreaSeries, {
            lineColor: "#00bcd4",
            topColor: "rgba(0, 188, 212, 0.5)",
            bottomColor: "rgba(0, 188, 212, 0.1)",
            lineWidth: 2,
          });
        case "hlc-area":
          return chart.addSeries(AreaSeries, {
            lineColor: "#00bcd4",
            topColor: "rgba(0, 188, 212, 0.3)",
            bottomColor: "rgba(0, 188, 212, 0.05)",
            lineWidth: 1,
          });
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
          console.warn(`Unsupported chart type: ${type}, defaulting to candlestick`);
          return chart.addSeries(CandlestickSeries, {
            upColor: "#26a69a",
            downColor: "#ef5350",
            borderVisible: false,
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
          });
      }
    },
    [currentCandleData]
  );

  // Queue-based update system to prevent race conditions
  const queueUpdate = useCallback((updateFn: () => Promise<void>): Promise<void> => {
    updateQueueRef.current = updateQueueRef.current
      .then(() => updateFn())
      .catch((error) => {
        console.error("Queued update failed:", error);
        throw error;
      });
    return updateQueueRef.current;
  }, []);

  // Fix 2: Add safety checks to chart operations
  const updateChartSeries = useCallback(
    async (chart: IChartApi, type: ChartType, candleData: CandlestickData[], volumeData: VolumeData[]): Promise<void> => {
      return queueUpdate(async () => {
        // Add this check before any chart operations
        if (!chart || (chart as any)._internal?.disposed) {
          console.warn("Chart is disposed, aborting update");
          return;
        }
        
        // Check if chart is still valid
        if (!chart || typeof chart.addSeries !== 'function') {
          console.warn("Chart is disposed, skipping update");
          return;
        }

        console.log(`Updating chart series to: ${type}`);
        
        // Mark as updating
        setChartState(prev => ({ ...prev, isReady: false, isUpdating: true }));

        try {
          // Stop real-time updates during series change
          if (realtimeIntervalRef.current) {
            clearInterval(realtimeIntervalRef.current);
            realtimeIntervalRef.current = null;
          }

          // Remove existing series - simplified
          try {
            if (candlestickSeriesRef.current) {
              chart.removeSeries(candlestickSeriesRef.current);
              candlestickSeriesRef.current = null;
            }
            if (volumeSeriesRef.current) {
              chart.removeSeries(volumeSeriesRef.current);
              volumeSeriesRef.current = null;
            }
          } catch (error) {
            // Series already removed, continue
          }

          // Small delay to ensure proper cleanup
          await new Promise(resolve => setTimeout(resolve, 100));

          // Check again if chart is still valid before creating new series
          if (!chart || typeof chart.addSeries !== 'function') {
            console.warn("Chart disposed during update");
            return;
          }

          // Create new series
          candlestickSeriesRef.current = createSeries(chart, type);
          volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
            color: "#26a69a",
            priceFormat: { type: "volume" },
          });

          // Update data if available
          if (candleData.length > 0 && volumeData.length > 0) {
            const cleanCandleData = validateAndCleanData(candleData);
            const cleanVolumeData = validateAndCleanVolumeData(volumeData);
            
            if (cleanCandleData.length > 0 && cleanVolumeData.length > 0) {
              const transformedData = transformData(cleanCandleData, type);
              const transformedVolumeData = transformVolumeData(cleanVolumeData);

              // Set data in batches to prevent overwhelming the chart
              if (candlestickSeriesRef.current && volumeSeriesRef.current) {
                candlestickSeriesRef.current.setData(transformedData);
                volumeSeriesRef.current.setData(transformedVolumeData);
              }
              
              // Fit content after a small delay
              setTimeout(() => {
                if (chart && chartApiRef.current && typeof chart.timeScale === 'function') {
                  try {
                    chart.timeScale().fitContent();
                  } catch (error) {
                    console.warn("Failed to fit content (chart may be disposed):", error);
                  }
                }
              }, 50);
            }
          }

          // Update state
          setChartState(prev => ({
            ...prev,
            isReady: true,
            isUpdating: false,
            currentType: type,
            lastUpdateId: prev.lastUpdateId + 1,
          }));

        } catch (error) {
          console.error("Failed to update chart series:", error);
          setError("Failed to update chart series");
          setChartState(prev => ({ ...prev, isReady: true, isUpdating: false }));
        }
      });
    },
    [queueUpdate, safeRemoveSeries, createSeries, validateAndCleanData, validateAndCleanVolumeData, transformData, transformVolumeData, setError]
  );

  // Fetch chart data
  const fetchChartData = useCallback(
    async (timeframe: Timeframe) => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Stop real-time updates during data fetch
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

  // Initialize chart
  useEffect(() => {
    // Fix Multiple Chart Initializations
    if (chartInitialized.current || !chartContainerRef.current) {
      return;
    }
    chartInitialized.current = true;

    // Fix Chart Initialization Race
    if (isInitializing.current) return;
    isInitializing.current = true;

    console.log("Initializing chart with container:", chartContainerRef.current);

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth || 800,
      height: CHART_HEIGHT,
    });
    
    chartApiRef.current = chart;

    // Initialize with current chart type and empty data
    updateChartSeries(chart, selectedChartType, [], []);

    const handleResize = () => {
      if (chartContainerRef.current && chartApiRef.current) {
        chartApiRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth || 800,
          height: CHART_HEIGHT,
        });
      }
    };

    // Tooltip handling
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

            // Boundary checks
            if (left + tooltipRef.current.offsetWidth > width) left = width - tooltipRef.current.offsetWidth;
            if (top + tooltipRef.current.offsetHeight > height) top = height - tooltipRef.current.offsetHeight;
            if (left < 0) left = 0;
            if (top < 0) top = 0;

            tooltipRef.current.style.left = `${left}px`;
            tooltipRef.current.style.top = `${top}px`;
          }
        } else if (price && "value" in price) {
          // Handle line series data
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

  // Debounced chart type change logic
  useEffect(() => {
    if (pendingChartType && pendingChartType !== selectedChartType) {
      const timer = setTimeout(() => {
        setSelectedChartType(pendingChartType);
        setPendingChartType(null);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [pendingChartType, selectedChartType]);

  // Chart type change effect
  useEffect(() => {
    if (!chartApiRef.current || chartState.isUpdating) return;
    
    // Only update if chart type actually changed
    if (chartState.currentType !== selectedChartType) {
      updateChartSeries(chartApiRef.current, selectedChartType, currentCandleData, currentVolumeData);
    }
  }, [selectedChartType, chartState.currentType]);

  // Handle data updates
  useEffect(() => {
    if (!chartApiRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current || !chartState.isReady) {
      return;
    }

    // Simplified data update check
    if (!chartState.isReady) return;
    
    if (currentCandleData.length === 0 || currentVolumeData.length === 0) return;
    if (chartState.isUpdating) return;

    console.log("Updating chart data - Candles:", currentCandleData.length, "Volume:", currentVolumeData.length);

    try {
      const cleanCandleData = validateAndCleanData(currentCandleData);
      const cleanVolumeData = validateAndCleanVolumeData(currentVolumeData);

      if (cleanCandleData.length > 0 && cleanVolumeData.length > 0) {
        const transformedData = transformData(cleanCandleData, chartState.currentType);
        const transformedVolumeData = transformVolumeData(cleanVolumeData);

        // Use setData instead of individual updates for better performance
        candlestickSeriesRef.current.setData(transformedData);
        volumeSeriesRef.current.setData(transformedVolumeData);
        
        // Fit content after data update
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

  // Fix 3: Add safety checks to real-time updates
  useEffect(() => {
    // Clean up existing interval
    if (realtimeIntervalRef.current) {
      clearInterval(realtimeIntervalRef.current);
      realtimeIntervalRef.current = null;
    }

    // Only start real-time updates when conditions are met
    if (!isLoading && 
        currentCandleData.length > 0 && 
        candlestickSeriesRef.current && 
        chartState.isReady && 
        !chartState.isUpdating) {
      
      console.log("Starting real-time updates");
      
      realtimeIntervalRef.current = setInterval(() => {
        // Add these checks at the very beginning
        if (!chartApiRef.current || 
            (chartApiRef.current as any)._internal?.disposed ||
            !candlestickSeriesRef.current || 
            (candlestickSeriesRef.current as any)._internal?.disposed ||
            chartState.isUpdating) {
          return;
        }

        // Check if chart is still valid
        if (!chartApiRef.current) {
          console.warn("Chart disposed, stopping real-time updates");
          if (realtimeIntervalRef.current) {
            clearInterval(realtimeIntervalRef.current);
            realtimeIntervalRef.current = null;
          }
          return;
        }

        setCurrentCandleData((prevCandles) => {
          if (prevCandles.length === 0) return prevCandles;
          
          const lastCandle = prevCandles[prevCandles.length - 1];
          if (!lastCandle) return prevCandles;

          try {
            const { newCandle, newVolume } = simulateRealtimeUpdate(lastCandle, selectedTimeframe);
            
            // Ensure time progression
            const newTime = Math.max(
              (newCandle.time as number),
              (lastCandle.time as number) + 1
            );
            
            const updatedCandle = { ...newCandle, time: newTime };
            const updatedVolume = { ...newVolume, time: newTime };
            
            // Fix Series Update Validation
            if (candlestickSeriesRef.current && 
                !(candlestickSeriesRef.current as any)._internal?.disposed) {
              try {
                const transformedUpdate = transformData([updatedCandle], selectedChartType)[0];
                if (transformedUpdate) {
                  candlestickSeriesRef.current.update(transformedUpdate);
                }
              } catch (error) {
                console.warn("Series update failed, stopping real-time updates");
                if (realtimeIntervalRef.current) {
                  clearInterval(realtimeIntervalRef.current);
                  realtimeIntervalRef.current = null;
                }
                return prevCandles;
              }
            }
            
            // Update volume data
            setCurrentVolumeData((prevVolumes) => {
              const newVolumeData = [...prevVolumes, updatedVolume].slice(-MAX_DATA_POINTS);
              const cleanVolumeData = validateAndCleanVolumeData(newVolumeData);
              
              if (volumeSeriesRef.current && 
                  typeof volumeSeriesRef.current.update === 'function' && 
                  cleanVolumeData.length > 0) {
                try {
                  volumeSeriesRef.current.update({
                    time: updatedVolume.time as Time,
                    value: updatedVolume.value,
                  });
                } catch (error) {
                  console.warn("Failed to update volume series (may be disposed):", error);
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
  }, [isLoading, selectedTimeframe, currentCandleData.length, chartState.isReady, chartState.isUpdating]);

  // Fetch data on timeframe change
  useEffect(() => {
    fetchChartData(selectedTimeframe);
  }, [selectedTimeframe, fetchChartData]);

  // Fix 4: Add safety checks to event handlers
  const handleResetZoom = useCallback(() => {
    if (chartApiRef.current && typeof chartApiRef.current.timeScale === 'function') {
      try {
        chartApiRef.current.timeScale().fitContent();
      } catch (error) {
        console.warn("Failed to reset zoom (chart may be disposed):", error);
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
        console.warn("Failed to export chart (chart may be disposed):", error);
      }
    }
  }, []);

  // Keyboard shortcuts
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
        <Button
            variant="ghost"
            size="icon"
            onClick={handleResetZoom}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
            aria-label="Reset Zoom"
          >
            <RefreshCcwIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportChart}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
            aria-label="Export Chart as Image"
          >
            <DownloadIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gray-700"
            aria-label="Keyboard Shortcuts"
          >
            <KeyboardIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-10 transition-opacity duration-200">
            <div className="animate-pulse text-gray-400">
              Loading chart data...
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-10 text-red-500">
            {error}
          </div>
        )}
        <div
          ref={chartContainerRef}
          className="w-full h-full transition-opacity duration-200"
          style={{ height: CHART_HEIGHT, minWidth: "300px" }}
        >
          {!chartApiRef.current && <div className="text-red-500">Chart failed to initialize</div>}
        </div>
        <div
          ref={tooltipRef}
          className="absolute bg-gray-900 text-white p-2 rounded shadow-md pointer-events-none z-20 hidden"
          style={{ minWidth: "120px" }}
        />
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
          
            