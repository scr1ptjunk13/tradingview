"use client"

import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useState, useEffect } from "react"

export default function ChartFooter() {
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) +
          " UTC",
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-between p-2 bg-gray-900 rounded-lg border border-gray-800 text-sm mt-2">
      <div className="flex items-center space-x-2">
        <ToggleGroup type="single" defaultValue="1D" className="flex space-x-1">
          <ToggleGroupItem
            value="1D"
            aria-label="Select 1 day view"
            className="h-8 px-3 data-[state=on]:bg-cyan-600 data-[state=on]:text-white text-gray-400 hover:bg-gray-700"
          >
            1D
          </ToggleGroupItem>
          <ToggleGroupItem
            value="5D"
            aria-label="Select 5 day view"
            className="h-8 px-3 data-[state=on]:bg-cyan-600 data-[state=on]:text-white text-gray-400 hover:bg-gray-700"
          >
            5D
          </ToggleGroupItem>
          <ToggleGroupItem
            value="1M"
            aria-label="Select 1 month view"
            className="h-8 px-3 data-[state=on]:bg-cyan-600 data-[state=on]:text-white text-gray-400 hover:bg-gray-700"
          >
            1M
          </ToggleGroupItem>
        </ToggleGroup>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:bg-gray-700">
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-gray-400 font-mono">{currentTime}</div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-gray-700">
          %
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-gray-700">
          log
        </Button>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-gray-700">
          auto
        </Button>
      </div>
    </div>
  )
}
