"use client";

import { useState, useEffect, useRef } from "react";
import MarketCapDisplay from "@/components/market-cap-display";
import TradingChart from "@/components/trading-chart";
import SidebarNav from "@/components/sidebar-nav";
import ChartControls from "@/components/chart-controls";
import InfoCards from "@/components/info-cards";
import ActionButtons from "@/components/action-buttons";
import MainToolbar from "@/components/toolbar/main-toolbar";
import MobileToolbox from "@/components/mobile-toolbox";
import ChartFooter from "@/components/chart-footer";
import { ToolboxProvider, useToolbox } from "@/components/toolbox-provider";
import type { Timeframe, ChartType } from "@/types/chart";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { LineDrawing } from "@/types/drawing";

interface MarketCapData {
  value: number;
  change24h: number;
  percentageChange24h: number;
  ath: number;
}

interface InfoCardsData {
  vol24h: string;
  price: string;
  change5m: string;
  isPositive5m: boolean;
  change1h: string;
  isPositive1h: boolean;
  change6h: string;
  isPositive6h: boolean;
}

function HomePageContent() {
  const [marketCapData, setMarketCapData] = useState<MarketCapData | undefined>(undefined);
  const [marketCapLoading, setMarketCapLoading] = useState(true);

  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1h");
  const [selectedChartType, setSelectedChartType] = useState<ChartType>("candlestick");

  const chartApiRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Consume toolbox context
  const { isMobile, activeToolId, drawings, drawingInProgress, handleMouseDown, handleMouseMove, handleMouseUp } = useToolbox();

  useEffect(() => {
    const fetchMarketCapData = async () => {
      setMarketCapLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call
      setMarketCapData({
        value: 44600, // $44.6K
        change24h: 7900, // +$7.9K
        percentageChange24h: 21.34, // +21.34%
        ath: 44600, // ATH $44.6K
      });
      setMarketCapLoading(false);
    };

    fetchMarketCapData();
  }, []);

  const infoCardsData: InfoCardsData = {
    vol24h: "$10.8K",
    price: "$0.00004350",
    change5m: "+0.83%",
    isPositive5m: true,
    change1h: "+8.62%",
    isPositive1h: true,
    change6h: "+18.25%",
    isPositive6h: true,
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <SidebarNav />
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <MarketCapDisplay data={marketCapData} isLoading={marketCapLoading} />
        <div className="flex flex-1 gap-4">
          {isMobile ? <MobileToolbox /> : <MainToolbar />}
          <div className="flex-1 flex flex-col">
            <ChartControls
              selectedTimeframe={selectedTimeframe}
              setSelectedTimeframe={setSelectedTimeframe}
              selectedChartType={selectedChartType}
              setSelectedChartType={setSelectedChartType}
            />
            <TradingChart
              selectedTimeframe={selectedTimeframe}
              setSelectedTimeframe={setSelectedTimeframe}
              isLoading={chartLoading}
              setIsLoading={setChartLoading}
              error={chartError}
              setError={setChartError}
              activeTool={activeToolId}
              drawings={drawings}
              drawingInProgress={drawingInProgress as LineDrawing | null}
              handleMouseDown={handleMouseDown}
              handleMouseMove={handleMouseMove}
              handleMouseUp={handleMouseUp}
              chartApiRef={chartApiRef}
              candlestickSeriesRef={candlestickSeriesRef}
              selectedChartType={selectedChartType}
              setSelectedChartType={setSelectedChartType}
            />
            <ChartFooter />
          </div>
        </div>
        <InfoCards data={infoCardsData} />
        <ActionButtons />
      </div>
    </div>
  );
}

export default function HomePage() {
  const chartApiRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  return (
    <TooltipProvider>
      <ToolboxProvider
        chartApiRef={chartApiRef}
        candlestickSeriesRef={candlestickSeriesRef}
        chartContainerRef={chartContainerRef as React.RefObject<HTMLDivElement>}
      >
        <HomePageContent />
      </ToolboxProvider>
    </TooltipProvider>
  );
}