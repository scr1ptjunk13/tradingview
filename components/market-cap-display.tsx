"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

// Helper function for number formatting (will be added to lib/utils.ts)
// This is duplicated here for clarity, but the actual implementation will be in lib/utils.ts
function formatMarketCapValue(num: number): string {
  if (Math.abs(num) >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B"
  }
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M"
  }
  if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(1) + "K"
  }
  return num.toFixed(2)
}

interface MarketCapData {
  value: number
  change24h: number
  percentageChange24h: number
  ath: number
}

interface MarketCapDisplayProps {
  data?: MarketCapData
  isLoading: boolean
}

export default function MarketCapDisplay({ data, isLoading }: MarketCapDisplayProps) {
  const progress = data && data.ath > 0 ? (data.value / data.ath) * 100 : 0
  const isPositiveChange = data && data.change24h >= 0

  return (
    <Card className="w-full bg-[#1a1a1a] text-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-800">
      <CardContent className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-400" aria-label="Market Cap">
            Market Cap
          </h2>
          {isLoading ? (
            <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
          ) : (
            <div
              className="relative h-4 w-32 bg-gray-700 rounded-full overflow-hidden"
              aria-label={`All Time High progress: ${progress.toFixed(1)}%`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-cyan-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white z-10">
                ATH ${data ? formatMarketCapValue(data.ath) : "0.0K"}
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-10 w-40 bg-gray-700 rounded animate-pulse" />
            <div className="h-5 w-48 bg-gray-700 rounded animate-pulse" />
          </div>
        ) : (
          <div className="space-y-2">
            <div
              className="text-4xl font-bold"
              aria-label={`Current market cap: ${data?.value ? formatMarketCapValue(data.value) : "N/A"}`}
            >
              ${data ? formatMarketCapValue(data.value) : "N/A"}
            </div>
            <div
              className={cn("text-base font-medium", isPositiveChange ? "text-cyan-400" : "text-red-400")}
              aria-label={`24 hour change: ${isPositiveChange ? "plus" : "minus"} $${data ? formatMarketCapValue(Math.abs(data.change24h)) : "N/A"} and ${data ? Math.abs(data.percentageChange24h).toFixed(2) : "N/A"} percent`}
            >
              {isPositiveChange ? "+" : "-"}
              {data ? formatMarketCapValue(Math.abs(data.change24h)) : "N/A"} ({isPositiveChange ? "+" : "-"}
              {data ? Math.abs(data.percentageChange24h).toFixed(2) : "N/A"}%) 24hr
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
