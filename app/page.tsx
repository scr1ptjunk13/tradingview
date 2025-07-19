"use client"

import { useState, useEffect, useRef } from "react"
import MarketCapDisplay from "@/components/market-cap-display"
import TradingChart from "@/components/trading-chart"
import SidebarNav from "@/components/sidebar-nav"
import ChartControls from "@/components/chart-controls"
import InfoCards from "@/components/info-cards"
import ActionButtons from "@/components/action-buttons"
import MainToolbar from "@/components/toolbar/main-toolbar" // Updated import
import MobileToolbox from "@/components/mobile-toolbox"
import ChartFooter from "@/components/chart-footer"
import { ToolboxProvider, useToolbox } from "@/components/toolbox-provider"
import type { Timeframe, ChartType } from "@/types/chart"
import type { IChartApi, ISeriesApi } from "lightweight-charts"
import { TooltipProvider } from "@/components/ui/tooltip"

interface MarketCapData {
  value: number
  change24h: number
  percentageChange24h: number
  ath: number
}

interface InfoCardsData {
  vol24h: string
  price: string
  change5m: string
  isPositive5m: boolean
  change1h: string
  isPositive1h: boolean
  change6h: string
  isPositive6h: boolean
}

function HomePageContent() {
  const [marketCapData, setMarketCapData] = useState<MarketCapData | undefined>(undefined)
  const [marketCapLoading, setMarketCapLoading] = useState(true)

  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1h")
  const [selectedChartType, setSelectedChartType] = useState<ChartType>("line")

  // Refs for lightweight-charts API instances, passed to useDrawingManager via ToolboxProvider
  const chartApiRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null) // Ref for the chart's container div

  // Consume toolbox state and actions
  const { activeToolId, drawings, drawingInProgress, handleMouseDown, handleMouseMove, handleMouseUp, isMobile } =
    useToolbox()

  useEffect(() => {
    const fetchMarketCapData = async () => {
      setMarketCapLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
      setMarketCapData({
        value: 44600, // $44.6K
        change24h: 7900, // +$7.9K
        percentageChange24h: 21.34, // +21.34%
        ath: 44600, // ATH $44.6K
      })
      setMarketCapLoading(false)
    }

    fetchMarketCapData()
  }, [])

  const infoCardsData: InfoCardsData = {
    vol24h: "$10.8K",
    price: "$0.00004350",
    change5m: "+0.83%",
    isPositive5m: true,
    change1h: "+8.62%",
    isPositive1h: true,
    change6h: "+18.25%",
    isPositive6h: true,
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Left Sidebar */}
      <SidebarNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Market Cap Display */}
        <MarketCapDisplay data={marketCapData} isLoading={marketCapLoading} />

        {/* Chart Section */}
        <div className="flex flex-1 gap-4">
          {/* Drawing Toolbar (Conditional Rendering) */}
          {isMobile ? <MobileToolbox /> : <MainToolbar />} {/* Updated component name */}
          {/* Main Chart Area */}
          <div className="flex-1 flex flex-col">
            {/* Chart Controls (1m, Trade Display, etc.) */}
            <ChartControls selectedChartType={selectedChartType} setSelectedChartType={setSelectedChartType} />
            {/* Trading Chart */}
            <TradingChart
              selectedTimeframe={selectedTimeframe}
              setSelectedTimeframe={setSelectedTimeframe}
              isLoading={chartLoading}
              setIsLoading={setChartLoading}
              error={chartError}
              setError={setChartError}
              activeTool={activeToolId}
              drawings={drawings}
              drawingInProgress={drawingInProgress}
              handleMouseDown={handleMouseDown}
              handleMouseMove={handleMouseMove}
              handleMouseUp={handleMouseUp}
              chartApiRef={chartApiRef}
              candlestickSeriesRef={candlestickSeriesRef}
              selectedChartType={selectedChartType}
            />
            {/* Chart Footer (1D, 5D, 1M, etc.) */}
            <ChartFooter />
          </div>
        </div>

        {/* Info Cards */}
        <InfoCards data={infoCardsData} />

        {/* Action Buttons */}
        <ActionButtons />
      </div>
    </div>
  )
}

export default function HomePage() {
  const chartApiRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<any> | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  return (
    <TooltipProvider>
      <ToolboxProvider
        chartApiRef={chartApiRef}
        candlestickSeriesRef={candlestickSeriesRef}
        chartContainerRef={chartContainerRef}
      >
        <HomePageContent />
      </ToolboxProvider>
    </TooltipProvider>
  )
}
