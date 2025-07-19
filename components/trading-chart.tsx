"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
// Import ONLY the types at the top-level (these are erased at build-time)
import type {
  IChartApi,
  ISeriesApi,
  CandlestickSeriesPartialOptions,
  HistogramSeriesPartialOptions,
  BarSeriesPartialOptions,
  LineSeriesPartialOptions,
  AreaSeriesPartialOptions,
} from "lightweight-charts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DownloadIcon, KeyboardIcon, RefreshCcwIcon } from "lucide-react"
import type { CandlestickData, VolumeData, Timeframe, ChartType } from "@/types/chart"
import { generateMockCandleData, generateMockVolumeData, simulateRealtimeUpdate, formatPrice } from "@/lib/chart-utils"
import DrawingCanvas from "./drawing-canvas"
import type { Drawing, DrawingTool, LineDrawing } from "@/types/drawing"
import { useToolbox } from "./toolbox-provider" // Import useToolbox

interface TradingChartProps {
  selectedTimeframe: Timeframe
  setSelectedTimeframe: (timeframe: Timeframe) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  // Drawing props are now passed from ToolboxProvider via useDrawingManager
  activeTool: DrawingTool | null // Now comes from ToolboxProvider
  drawings: Drawing[]
  drawingInProgress: LineDrawing | null
  handleMouseDown: (event: React.MouseEvent<SVGSVGElement>) => void
  handleMouseMove: (event: React.MouseEvent<SVGSVGElement>) => void
  handleMouseUp: () => void
  chartApiRef: React.MutableRefObject<IChartApi | null>
  candlestickSeriesRef: React.MutableRefObject<ISeriesApi<any> | null>
  selectedChartType: ChartType // New prop for chart type
}

const timeframes: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"]

export default function TradingChart({
  selectedTimeframe,
  setSelectedTimeframe,
  isLoading,
  setIsLoading,
  error,
  setError,
  activeTool, // Now from ToolboxProvider
  drawings, // Now from ToolboxProvider
  drawingInProgress, // Now from ToolboxProvider
  handleMouseDown, // Now from ToolboxProvider
  handleMouseMove, // Now from ToolboxProvider
  handleMouseUp, // Now from ToolboxProvider
  chartApiRef,
  candlestickSeriesRef,
  selectedChartType, // New prop
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const [currentCandleData, setCurrentCandleData] = useState<CandlestickData[]>([])
  const [currentVolumeData, setCurrentVolumeData] = useState<VolumeData[]>([])

  // Get magnetMode from ToolboxContext
  const { magnetMode } = useToolbox()

  const fetchChartData = useCallback(
    async (timeframe: Timeframe) => {
      setIsLoading(true)
      setError(null)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const candles = generateMockCandleData(timeframe, 500) // Generate 500 candles
        const volumes = generateMockVolumeData(candles)

        setCurrentCandleData(candles)
        setCurrentVolumeData(volumes)
      } catch (err) {
        console.error("Failed to fetch chart data:", err)
        setError("Failed to load chart data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [setIsLoading, setError],
  )

  // Helper function to update chart series based on type
  const updateChartSeries = useCallback(
    (
      chart: IChartApi,
      type: ChartType,
      candlestickSeriesRef: React.MutableRefObject<ISeriesApi<any> | null>,
      volumeSeriesRef: React.MutableRefObject<ISeriesApi<any> | null>,
    ) => {
      // Remove existing series
      if (candlestickSeriesRef.current) {
        chart.removeSeries(candlestickSeriesRef.current)
        candlestickSeriesRef.current = null
      }
      if (volumeSeriesRef.current) {
        chart.removeSeries(volumeSeriesRef.current)
        volumeSeriesRef.current = null
      }

      let newPriceSeries: ISeriesApi<any> | null = null

      const safeAddCandle = (opts: CandlestickSeriesPartialOptions) =>
        "addCandlestickSeries" in chart
          ? chart.addCandlestickSeries(opts)
          : chart.addBarSeries?.(opts as unknown as BarSeriesPartialOptions)! // fallback

      const safeAddBar = (opts: BarSeriesPartialOptions) =>
        "addBarSeries" in chart
          ? chart.addBarSeries(opts)
          : chart.addCandlestickSeries?.(opts as unknown as CandlestickSeriesPartialOptions)! // fallback

      const safeAddLine = (opts: LineSeriesPartialOptions) =>
        chart.addLineSeries ? chart.addLineSeries(opts) : safeAddBar(opts as unknown as BarSeriesPartialOptions)

      const safeAddArea = (opts: AreaSeriesPartialOptions) =>
        chart.addAreaSeries ? chart.addAreaSeries(opts) : safeAddLine(opts as unknown as LineSeriesPartialOptions)

      const safeAddHistogram = (opts: HistogramSeriesPartialOptions) =>
        "addHistogramSeries" in chart
          ? chart.addHistogramSeries(opts)
          : safeAddBar(opts as unknown as BarSeriesPartialOptions) // fallback to bar-series

      switch (type) {
        /* ───────── OHLC-style charts ───────── */
        case "candlestick":
        case "hollow-candlestick":
        case "heikin-ashi":
          newPriceSeries = safeAddCandle({
            upColor: "#26a69a",
            downColor: "#ef5350",
            borderVisible: false,
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
            wickDownColor: "#ef5350",
          })
          break

        case "bar":
        case "hlc-bar":
        case "high-low":
        case "columns":
          newPriceSeries = safeAddBar({
            upColor: "#26a69a",
            downColor: "#ef5350",
            thinBars: true,
          })
          break

        /* ───────── Line-family charts ───────── */
        case "line":
        case "line-with-markers":
        case "step-line":
          newPriceSeries = safeAddLine({
            color: "#00bcd4",
            lineWidth: 2,
          })
          break

        /* ───────── Area-family charts ───────── */
        case "area":
        case "hlc-area":
        case "baseline":
          newPriceSeries = safeAddArea({
            lineColor: "#00bcd4",
            topColor: "rgba(0, 188, 212, 0.5)",
            bottomColor: "rgba(0, 188, 212, 0.1)",
            lineWidth: 2,
          })
          break

        default:
          newPriceSeries = safeAddCandle({
            upColor: "#26a69a",
            downColor: "#ef5350",
            borderVisible: false,
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
          })
      }

      candlestickSeriesRef.current = newPriceSeries

      // Volume series always remains histogram
      const newVolumeSeries = safeAddHistogram({
        color: "#26a69a",
        priceFormat: { type: "volume" },
        overlay: true,
        scaleMargins: { top: 0.8, bottom: 0 },
      })
      volumeSeriesRef.current = newVolumeSeries

      chart.timeScale().fitContent()
    },
    [],
  ) // Empty dependency array as it's a helper function

  useEffect(() => {
    fetchChartData(selectedTimeframe)
  }, [selectedTimeframe, fetchChartData])

  // Effect for initializing the chart instance and default series (runs once)
  useEffect(() => {
    if (!chartContainerRef.current) return

    /*  Dynamically import lightweight-charts so it runs only on the client  */
    import("lightweight-charts").then((mod) => {
      const createChartFn =
        (mod as Record<string, any>).createChart ??
        ((mod as Record<string, any>).default && typeof (mod as Record<string, any>).default === "function"
          ? (mod as Record<string, any>).default
          : (mod as Record<string, any>).default?.createChart)

      if (typeof createChartFn !== "function") {
        console.error("lightweight-charts: createChart not found in module", mod)
        setError("Chart library failed to load.")
        return
      }

      const chart = createChartFn(chartContainerRef.current as HTMLDivElement, {
        layout: { background: { color: "#1a1a1a" }, textColor: "#d1d4dc" },
        grid: { vertLines: { color: "#2b2b43" }, horzLines: { color: "#2b2b43" } },
        timeScale: { timeVisible: true, secondsVisible: true, borderVisible: false },
        rightPriceScale: { borderVisible: false },
        crosshair: { mode: 0 },
      })

      chartApiRef.current = chart

      // Create the initial (safe) series using the helper
      updateChartSeries(
        chart,
        selectedChartType, // whatever chart type is active at mount
        candlestickSeriesRef,
        volumeSeriesRef,
      )

      // Handle crosshair tooltip
      chart.subscribeCrosshairMove((param) => {
        if (!tooltipRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current) return // Ensure series exist

        if (param.time) {
          const price = param.seriesPrices.get(candlestickSeriesRef.current)
          const volume = param.seriesPrices.get(volumeSeriesRef.current)

          if (price && typeof price === "object" && "close" in price) {
            const date = new Date((param.time as number) * 1000)
            const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            const dateStr = date.toLocaleDateString()

            tooltipRef.current.style.display = "block"
            tooltipRef.current.innerHTML = `
        <div class="text-xs text-gray-400">${dateStr} ${timeStr}</div>
        <div class="text-sm font-bold">O: ${formatPrice(price.open)} H: ${formatPrice(price.high)} L: ${formatPrice(price.low)} C: ${formatPrice(price.close)}</div>
        <div class="text-xs text-gray-400">Vol: ${volume ? (volume as number).toFixed(0) : "N/A"}</div>
      `
            const coordinate = candlestickSeriesRef.current?.priceToCoordinate(price.close)
            if (coordinate) {
              const chartRect = chartContainerRef.current?.getBoundingClientRect()
              if (chartRect) {
                const tooltipWidth = tooltipRef.current.offsetWidth
                const tooltipHeight = tooltipRef.current.offsetHeight
                let left = param.point?.x || 0
                let top = coordinate

                if (left + tooltipWidth + 10 > chartRect.width) {
                  left = chartRect.width - tooltipWidth - 10
                }
                if (top + tooltipHeight + 10 > chartRect.height) {
                  top = chartRect.height - tooltipHeight - 10
                }
                if (left < 0) left = 0
                if (top < 0) top = 0

                tooltipRef.current.style.left = `${left + 10}px`
                tooltipRef.current.style.top = `${top + 10}px`
              }
            }
          }
        } else {
          tooltipRef.current.style.display = "none"
        }
      })

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          })
        }
      }

      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        chart.remove()
      }
    })
  }, [selectedChartType, updateChartSeries]) // Added selectedChartType and updateChartSeries to dependencies

  // Effect for updating series data and handling chart type changes
  useEffect(() => {
    if (!chartApiRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current) {
      // Wait until chart API and initial series are ready
      return
    }

    // If chart type changes, re-create series
    // This check prevents unnecessary re-creation if only data updates
    const currentSeriesType = candlestickSeriesRef.current.seriesType()
    const needsSeriesUpdate =
      (selectedChartType === "candlestick" && currentSeriesType !== "Candlestick") ||
      (selectedChartType === "bar" && currentSeriesType !== "Bar") ||
      (selectedChartType === "line" && currentSeriesType !== "Line") ||
      (selectedChartType === "area" && currentSeriesType !== "Area") ||
      (["hollow-candlestick", "heikin-ashi"].includes(selectedChartType) && currentSeriesType !== "Candlestick") ||
      (["hlc-bar", "high-low", "columns"].includes(selectedChartType) && currentSeriesType !== "Bar") ||
      (["line-with-markers", "step-line"].includes(selectedChartType) && currentSeriesType !== "Line") ||
      (["hlc-area", "baseline"].includes(selectedChartType) && currentSeriesType !== "Area")

    if (needsSeriesUpdate) {
      updateChartSeries(chartApiRef.current, selectedChartType, candlestickSeriesRef, volumeSeriesRef)
    }

    if (currentCandleData.length && currentVolumeData.length) {
      candlestickSeriesRef.current.setData(
        selectedChartType === "line" ||
          selectedChartType === "area" ||
          selectedChartType === "baseline" ||
          selectedChartType === "line-with-markers" ||
          selectedChartType === "step-line" ||
          selectedChartType === "hlc-area"
          ? currentCandleData.map((c) => ({ time: c.time, value: c.close }))
          : currentCandleData,
      )
      volumeSeriesRef.current.setData(currentVolumeData)
      chartApiRef.current.timeScale().fitContent()
    }

    let intervalId: NodeJS.Timeout | null = null
    if (!isLoading && currentCandleData.length > 0) {
      intervalId = setInterval(() => {
        setCurrentCandleData((prevCandles) => {
          const lastCandle = prevCandles[prevCandles.length - 1]
          if (!lastCandle) return prevCandles

          const { newCandle, newVolume } = simulateRealtimeUpdate(lastCandle, selectedTimeframe)

          if (candlestickSeriesRef.current) {
            candlestickSeriesRef.current.update(
              selectedChartType === "line" ||
                selectedChartType === "area" ||
                selectedChartType === "baseline" ||
                selectedChartType === "line-with-markers" ||
                selectedChartType === "step-line" ||
                selectedChartType === "hlc-area"
                ? { time: newCandle.time, value: newCandle.close }
                : newCandle,
            )
          }

          // Use functional update for volume data
          setCurrentVolumeData((prevVolumes) => {
            const updatedVolumes = [...prevVolumes, newVolume]
            const maxDataPoints = 1000
            if (updatedVolumes.length > maxDataPoints) {
              updatedVolumes.shift()
            }
            return updatedVolumes
          })

          // Return updated candles for the candle state
          const updatedCandles = [...prevCandles, newCandle]
          const maxDataPoints = 1000
          if (updatedCandles.length > maxDataPoints) {
            updatedCandles.shift()
          }
          return updatedCandles
        })
      }, 2000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [
    chartApiRef.current,
    selectedChartType,
    isLoading,
    selectedTimeframe,
    updateChartSeries,
    candlestickSeriesRef,
    volumeSeriesRef,
  ])

  const handleExportChart = useCallback(() => {
    if (chartApiRef.current) {
      const link = document.createElement("a")
      link.download = "trading-chart.png"
      link.href = chartApiRef.current.takeScreenshot().toDataURL()
      link.click()
    }
  }, [chartApiRef])

  const handleResetZoom = useCallback(() => {
    chartApiRef.current?.timeScale().fitContent()
  }, [chartApiRef])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        handleResetZoom()
      }
      // Add more keyboard shortcuts here
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleResetZoom])

  return (
    <Card className="flex-1 bg-[#1a1a1a] text-white rounded-lg shadow-lg flex flex-col border border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-800">
        <CardTitle className="text-lg font-semibold text-gray-200">SMAG/SOL Market Cap (USD)</CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as Timeframe)}>
            <SelectTrigger className="w-[100px] bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              {timeframes.map((tf) => (
                <SelectItem key={tf} value={tf}>
                  {tf.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-10">
            <div className="animate-pulse text-gray-400">Loading chart data...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-10 text-red-500">
            {error}
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
        <div
          ref={tooltipRef}
          className="absolute bg-gray-900 text-white p-2 rounded shadow-md pointer-events-none z-20 hidden"
          style={{ minWidth: "120px" }}
        />
        <DrawingCanvas
          chartApi={chartApiRef.current}
          candlestickSeries={candlestickSeriesRef.current}
          chartContainerRef={chartContainerRef}
          activeTool={activeTool}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          drawings={drawings}
          drawingInProgress={drawingInProgress}
        />
      </CardContent>
    </Card>
  )
}
