"use client"

import type React from "react"
import { useCallback } from "react"
import type { IChartApi, ISeriesApi } from "lightweight-charts"
import type { Drawing, LineDrawing, Point, MeasurementDrawing } from "@/types/drawing"
import type { useDrawingManager } from "@/hooks/use-drawing-manager"

interface DrawingCanvasProps {
  chartApi: IChartApi | null
  candlestickSeries: ISeriesApi<"Candlestick"> | null
  chartContainerRef: React.RefObject<HTMLDivElement>
  activeTool: ReturnType<typeof useDrawingManager>["activeTool"]
  handleMouseDown: ReturnType<typeof useDrawingManager>["handleMouseDown"]
  handleMouseMove: ReturnType<typeof useDrawingManager>["handleMouseMove"]
  handleMouseUp: ReturnType<typeof useDrawingManager>["handleMouseUp"]
  drawings: ReturnType<typeof useDrawingManager>["drawings"]
  drawingInProgress: ReturnType<typeof useDrawingManager>["drawingInProgress"]
}

export default function DrawingCanvas({
  chartApi,
  candlestickSeries,
  chartContainerRef,
  activeTool,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  drawings,
  drawingInProgress,
}: DrawingCanvasProps) {
  const getSvgCoordinates = useCallback(
    (point: Point): { x: number; y: number } | null => {
      if (!chartApi || !candlestickSeries) return null
      const x = chartApi.timeScale().timeToCoordinate(point.time as any)
      const y = (chartApi.priceScale('right') as any).priceToCoordinate(point.price)
      if (x === null || y === null) return null
      return { x, y }
    },
    [chartApi, candlestickSeries],
  )

  const renderDrawing = useCallback(
    (drawing: Drawing) => {
      const key = drawing.id
      switch (drawing.type) {
        case "trend-line":
        case "ray":
        case "horizontal-line": {
          const line = drawing as LineDrawing
          if (!line.points[0]) return null
          const p1 = getSvgCoordinates(line.points[0])
          if (!p1) return null

          let p2 = line.points[1] ? getSvgCoordinates(line.points[1]) : null

          // For ray, extend to edge if only one point or if it's the drawing in progress
          if (line.type === "ray" && (!p2 || drawingInProgress?.id === line.id)) {
            const chartWidth = chartContainerRef.current?.clientWidth || 0
            const chartHeight = chartContainerRef.current?.clientHeight || 0
            if (p2) {
              // Extend ray from p1 through p2 to the edge
              const dx = p2.x - p1.x
              const dy = p2.y - p1.y
              if (dx === 0) {
                p2 = { x: p1.x, y: dy > 0 ? chartHeight : 0 }
              } else {
                const slope = dy / dx
                const intercept = p1.y - slope * p1.x

                // Calculate intersection with left/right edges
                let xIntersect = dx > 0 ? chartWidth : 0
                let yIntersect = slope * xIntersect + intercept

                // Check if intersection is within vertical bounds
                if (yIntersect < 0 || yIntersect > chartHeight) {
                  // If not, calculate intersection with top/bottom edges
                  yIntersect = dy > 0 ? chartHeight : 0
                  xIntersect = (yIntersect - intercept) / slope
                }
                p2 = { x: xIntersect, y: yIntersect }
              }
            } else {
              // If only one point, just draw a small line for visual feedback
              p2 = { x: p1.x + 50, y: p1.y + 50 }
            }
          }

          if (!p2) return null

          // For horizontal line, ensure it spans the full width
          if (line.type === "horizontal-line") {
            const chartWidth = chartContainerRef.current?.clientWidth || 0
            return (
              <line
                key={key}
                x1={0}
                y1={p1.y}
                x2={chartWidth}
                y2={p1.y}
                stroke={line.color}
                strokeWidth={line.lineWidth}
                strokeDasharray={line.lineStyle === "dashed" ? "5,5" : line.lineStyle === "dotted" ? "2,2" : "0"}
                className="pointer-events-auto cursor-move" // Allow interaction
              />
            )
          }

          return (
            <line
              key={key}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={line.color}
              strokeWidth={line.lineWidth}
              strokeDasharray={line.lineStyle === "dashed" ? "5,5" : line.lineStyle === "dotted" ? "2,2" : "0"}
              className="pointer-events-auto cursor-move" // Allow interaction
            />
          )
        }
        case "measurement": {
          const measurement = drawing as MeasurementDrawing
          if (!measurement.points[0] || !measurement.points[1]) return null
          const p1 = getSvgCoordinates(measurement.points[0])
          const p2 = getSvgCoordinates(measurement.points[1])
          if (!p1 || !p2) return null
          return (
            <line
              key={key}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={measurement.color}
              strokeWidth={measurement.lineWidth}
              className="pointer-events-auto cursor-move"
            />
          )
        }
        default:
          return null
      }
    },
    [getSvgCoordinates, drawingInProgress, chartApi, chartContainerRef],
  )

  const cursorClass = (() => {
    switch (activeTool) {
      case "cross":
      case "dot": // For simplicity, using crosshair for dot. A true dot cursor requires custom SVG.
      case "eraser":
        return "cursor-crosshair"
      case "arrow":
        return "cursor-default"
      case "demonstration":
        return "cursor-pointer" // Placeholder for demonstration mode
      case "cursor": // The category button itself
        return "cursor-grab"
      case "trend-line":
      case "ray":
      case "horizontal-line":
      case "measurement":
        return "cursor-crosshair" // Drawing tools typically use crosshair
      default:
        return "cursor-grab" // Default for non-drawing tools or when no tool is active
    }
  })()

  return (
    <svg
      className={`absolute inset-0 w-full h-full z-10 ${cursorClass}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // End drawing if mouse leaves
      aria-label="Drawing canvas for chart"
    >
      {drawings.map(renderDrawing)}
      {drawingInProgress && renderDrawing(drawingInProgress)}
    </svg>
  )
}
