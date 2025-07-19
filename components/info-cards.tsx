"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface InfoCardProps {
  label: string
  value: string
  change?: string
  isPositive?: boolean
}

function InfoCard({ label, value, change, isPositive }: InfoCardProps) {
  return (
    <Card className="flex-1 bg-gray-800 text-white rounded-lg border border-gray-700">
      <CardContent className="p-3 flex flex-col items-center justify-center">
        <div className="text-xs text-gray-400 mb-1">{label}</div>
        <div className="text-lg font-bold">{value}</div>
        {change && <div className={cn("text-xs", isPositive ? "text-cyan-400" : "text-red-400")}>{change}</div>}
      </CardContent>
    </Card>
  )
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

interface InfoCardsProps {
  data: InfoCardsData
}

export default function InfoCards({ data }: InfoCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <InfoCard label="Vol 24h" value={data.vol24h} />
      <InfoCard label="Price" value={data.price} />
      <InfoCard label="5m" value={data.change5m} isPositive={data.isPositive5m} />
      <InfoCard label="1h" value={data.change1h} isPositive={data.isPositive1h} />
      <InfoCard label="6h" value={data.change6h} isPositive={data.isPositive6h} />
    </div>
  )
}
