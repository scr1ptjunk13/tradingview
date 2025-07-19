"use client"

import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CandlestickChartIcon, LineChartIcon, AreaChartIcon, BarChartIcon, MinusIcon, BaselineIcon } from "lucide-react"
import type { ChartType, Timeframe } from "@/types/chart"

interface ChartControlsProps {
  selectedChartType: ChartType
  setSelectedChartType: (type: ChartType) => void
  selectedTimeframe: Timeframe  // Add this prop
  setSelectedTimeframe: (timeframe: Timeframe) => void  // Add this prop
}

const chartTypeOptions = [
  { value: "candlestick", label: "Candles", icon: CandlestickChartIcon },
  { value: "bar", label: "Bars", icon: BarChartIcon },
  { value: "hollow-candlestick", label: "Hollow candles", icon: CandlestickChartIcon },
  { value: "hlc-bar", label: "HLC bars", icon: MinusIcon },
  { value: "line", label: "Line", icon: LineChartIcon },
  { value: "line-with-markers", label: "Line with markers", icon: LineChartIcon },
  { value: "step-line", label: "Step line", icon: LineChartIcon },
  { value: "area", label: "Area", icon: AreaChartIcon },
  { value: "hlc-area", label: "HLC area", icon: AreaChartIcon },
  { value: "baseline", label: "Baseline", icon: BaselineIcon },
  { value: "columns", label: "Columns", icon: BarChartIcon },
  { value: "high-low", label: "High-low", icon: MinusIcon },
  { value: "heikin-ashi", label: "Heikin Ashi", icon: CandlestickChartIcon },
] as const

export default function ChartControls({ 
  selectedChartType, 
  setSelectedChartType, 
  selectedTimeframe, 
  setSelectedTimeframe 
}: ChartControlsProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-900 rounded-lg border border-gray-800 text-sm">
      <div className="flex items-center space-x-2">
        <ToggleGroup 
          type="single" 
          value={selectedTimeframe} 
          onValueChange={(value) => value && setSelectedTimeframe(value as Timeframe)}
          className="flex space-x-1"
        >
          <ToggleGroupItem
            value="1m"
            aria-label="Select 1 minute timeframe"
            className="h-8 px-3 data-[state=on]:bg-cyan-600 data-[state=on]:text-white text-gray-400 hover:bg-gray-700"
          >
            1m
          </ToggleGroupItem>
          <ToggleGroupItem
            value="5m"
            aria-label="Select 5 minute timeframe"
            className="h-8 px-3 data-[state=on]:bg-cyan-600 data-[state=on]:text-white text-gray-400 hover:bg-gray-700"
          >
            5m
          </ToggleGroupItem>
          <ToggleGroupItem
            value="15m"
            aria-label="Select 15 minute timeframe"
            className="h-8 px-3 data-[state=on]:bg-cyan-600 data-[state=on]:text-white text-gray-400 hover:bg-gray-700"
          >
            15m
          </ToggleGroupItem>
          <ToggleGroupItem
            value="1h"
            aria-label="Select 1 hour timeframe"
            className="h-8 px-3 data-[state=on]:bg-cyan-600 data-[state=on]:text-white text-gray-400 hover:bg-gray-700"
          >
            1h
          </ToggleGroupItem>
          <ToggleGroupItem
            value="4h"
            aria-label="Select 4 hour timeframe"
            className="h-8 px-3 data-[state=on]:bg-cyan-600 data-[state=on]:text-white text-gray-400 hover:bg-gray-700"
          >
            4h
          </ToggleGroupItem>
          <ToggleGroupItem
            value="1d"
            aria-label="Select 1 day timeframe"
            className="h-8 px-3 data-[state=on]:bg-cyan-600 data-[state=on]:text-white text-gray-400 hover:bg-gray-700"
          >
            1d
          </ToggleGroupItem>
        </ToggleGroup>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-gray-700">
          Trade Display
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-gray-700">
          Hide All Bubbles
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-gray-700">
          Price/MCap
        </Button>
        <Select value={selectedChartType} onValueChange={(value: ChartType) => setSelectedChartType(value)}>
          <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
            <SelectValue placeholder="Chart Type" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            {chartTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-gray-700">
          USD/SOL
        </Button>
      </div>
    </div>
  )
}