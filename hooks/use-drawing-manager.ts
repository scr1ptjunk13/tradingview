"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import type { IChartApi, ISeriesApi } from "lightweight-charts"
import type {
  Drawing,
  DrawingTool,
  LineDrawing,
  Point,
  DrawingAction,
  MeasurementDrawing,
  MagnetMode,
} from "@/types/drawing"
import { generateUniqueId, saveDrawingsToLocalStorage, loadDrawingsFromLocalStorage } from "@/lib/drawing-utils"

interface UseDrawingManagerProps {
  chartApi: IChartApi | null
  candlestickSeries: ISeriesApi<any> | null
  chartContainerRef: React.RefObject<HTMLDivElement>
  activeTool: DrawingTool | null // Now comes from context
  isDrawingMode: boolean // From context
  magnetMode: MagnetMode // From context
  lockDrawings: boolean // From context
  hideDrawings: boolean // From context
}

export function useDrawingManager({
  chartApi,
  candlestickSeries,
  chartContainerRef,
  activeTool,
  isDrawingMode,
  magnetMode,
  lockDrawings,
  hideDrawings,
}: UseDrawingManagerProps) {
  const [drawings, setDrawings] = useState<Drawing[]>(() => loadDrawingsFromLocalStorage())
  const [drawingInProgress, setDrawingInProgress] = useState<Drawing | null>(null)
  const historyRef = useRef<DrawingAction[][]>([])
  const historyPointerRef = useRef<number>(-1)

  // Internal state for active tool, synced with prop
  const [internalActiveTool, setInternalActiveTool] = useState<DrawingTool | null>(activeTool)
  useEffect(() => {
    setInternalActiveTool(activeTool)
  }, [activeTool])

  const addHistoryEntry = useCallback((action: DrawingAction[]) => {
    // Clear redo history
    historyRef.current = historyRef.current.slice(0, historyPointerRef.current + 1)
    historyRef.current.push(action)
    historyPointerRef.current = historyRef.current.length - 1
  }, [])

  const undo = useCallback(() => {
    if (historyPointerRef.current >= 0) {
      const actionsToUndo = historyRef.current[historyPointerRef.current]
      setDrawings((prevDrawings) => {
        let newDrawings = [...prevDrawings]
        actionsToUndo.forEach((action) => {
          if (action.type === "add") {
            newDrawings = newDrawings.filter((d) => d.id !== action.drawing?.id)
          } else if (action.type === "delete") {
            if (action.drawing) newDrawings.push(action.drawing)
          } else if (action.type === "update") {
            newDrawings = newDrawings.map((d) => (d.id === action.drawing?.id ? (action.prevDrawing as Drawing) : d))
          }
        })
        return newDrawings
      })
      historyPointerRef.current--
    }
  }, [])

  const redo = useCallback(() => {
    if (historyPointerRef.current < historyRef.current.length - 1) {
      historyPointerRef.current++
      const actionsToRedo = historyRef.current[historyPointerRef.current]
      setDrawings((prevDrawings) => {
        let newDrawings = [...prevDrawings]
        actionsToRedo.forEach((action) => {
          if (action.type === "add") {
            if (action.drawing) newDrawings.push(action.drawing)
          } else if (action.type === "delete") {
            newDrawings = newDrawings.filter((d) => d.id !== action.drawing?.id)
          } else if (action.type === "update") {
            if (action.drawing) newDrawings = newDrawings.map((d) => (d.id === action.drawing?.id ? action.drawing : d))
          }
        })
        return newDrawings
      })
    }
  }, [])

  // Save drawings to local storage whenever they change
  useEffect(() => {
    saveDrawingsToLocalStorage(drawings)
  }, [drawings])

  const getChartCoordinates = useCallback(
    (clientX: number, clientY: number): Point | null => {
      if (!chartApi || !chartContainerRef.current) return null

      const chartRect = chartContainerRef.current.getBoundingClientRect()
      const x = clientX - chartRect.left
      const y = clientY - chartRect.top

      const time = chartApi.timeScale().coordinateToTime(x)
      const price = (chartApi.priceScale('right') as any).coordinateToPrice(y)

      if (time === null || price === null) return null

      // Apply magnet snapping (simplified for this turn)
      if (magnetMode !== "off" && candlestickSeries) {
        // For 'weak' magnet, snap to nearest price level or time
        // For 'strong' magnet, snap to OHLC of nearest candle
        // This is a conceptual placeholder. Real implementation would be more complex.
        const snappedPrice = price // Placeholder
        const snappedTime = time // Placeholder
        return { time: snappedTime as any, price: snappedPrice }
      }

      return { time: time as any, price }
    },
    [chartApi, chartContainerRef, magnetMode, candlestickSeries],
  )

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!chartApi || !candlestickSeries || lockDrawings) return

      // Prevent drawing if a non-drawing cursor tool is active
      const isDrawingTool =
        internalActiveTool === "trend-line" ||
        internalActiveTool === "ray" ||
        internalActiveTool === "horizontal-line" ||
        internalActiveTool === "measurement"

      if (!isDrawingTool && internalActiveTool !== "eraser") {
        // For pure cursor tools (cross, dot, arrow, demonstration),
        // we don't initiate a drawing process.
        // If it's "demonstration", log a message as a placeholder.
        if (internalActiveTool === "demonstration") {
          console.log("Demonstration tool activated! (Placeholder for drawing temporary highlights)")
        }
        return
      }

      const startPoint = getChartCoordinates(event.clientX, event.clientY)
      if (!startPoint) return

      if (isDrawingTool) {
        if (
          internalActiveTool === "trend-line" ||
          internalActiveTool === "ray" ||
          internalActiveTool === "horizontal-line"
        ) {
          const newDrawing: LineDrawing = {
            id: generateUniqueId(),
            type: internalActiveTool,
            points: [startPoint],
            color: "#00bcd4", // Cyan accent
            lineWidth: 2,
            lineStyle: "solid",
          }
          setDrawingInProgress(newDrawing)
        } else if (internalActiveTool === "measurement") {
          const newDrawing: MeasurementDrawing = {
            id: generateUniqueId(),
            type: "measurement",
            points: [startPoint, startPoint], // Start and end at the same point initially
            color: "#facc15", // Yellow for measurement
            lineWidth: 1,
          }
          setDrawingInProgress(newDrawing)
        }
      } else if (internalActiveTool === "eraser") {
        // Existing eraser logic remains here
        const clickedX = event.clientX - (chartContainerRef.current?.getBoundingClientRect().left || 0)
        const clickedY = event.clientY - (chartContainerRef.current?.getBoundingClientRect().top || 0)

        const tolerance = 10 // pixels
        const drawingToDelete = drawings.find((d) => {
          if (d.type === "trend-line" || d.type === "ray" || d.type === "horizontal-line") {
            const p1 = chartApi.timeScale().timeToCoordinate(d.points[0].time as any)
            const p2 = d.points[1] ? chartApi.timeScale().timeToCoordinate(d.points[1].time as any) : p1
            const y1 = (chartApi.priceScale('right') as any).priceToCoordinate(d.points[0].price)
            const y2 = d.points[1] ? (chartApi.priceScale('right') as any).priceToCoordinate(d.points[1].price) : y1

            if (p1 === null || y1 === null) return false

            if (d.type === "horizontal-line") {
              return Math.abs(clickedY - y1) < tolerance
            }

            if (p2 === null || y2 === null) return false
            const dist =
              Math.abs((y2 - y1) * clickedX - (p2 - p1) * clickedY + p2 * y1 - y2 * p1) /
              Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(p2 - p1, 2))
            return dist < tolerance
          }
          return false
        })

        if (drawingToDelete) {
          setDrawings((prev) => prev.filter((d) => d.id !== drawingToDelete.id))
          addHistoryEntry([{ type: "delete", drawing: drawingToDelete }])
        }
        if (!isDrawingMode) {
          setInternalActiveTool("cross") // Reset to cross after single use for eraser
        }
      }
    },
    [
      chartApi,
      candlestickSeries,
      internalActiveTool,
      getChartCoordinates,
      addHistoryEntry,
      drawings,
      isDrawingMode,
      lockDrawings,
    ],
  )

  // Update handleMouseMove to only proceed if drawingInProgress exists
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!chartApi || !candlestickSeries || !drawingInProgress || lockDrawings) return

      const currentPoint = getChartCoordinates(event.clientX, event.clientY)
      if (!currentPoint) return

      setDrawingInProgress((prev) => {
        if (!prev) return null
        const updatedPoints = [...prev.points]
        if (prev.type === "trend-line" || prev.type === "ray" || prev.type === "horizontal-line") {
          updatedPoints[1] = currentPoint
        } else if (prev.type === "measurement") {
          updatedPoints[1] = currentPoint
        }
        return { ...prev, points: updatedPoints as [Point, Point] }
      })
    },
    [chartApi, candlestickSeries, drawingInProgress, getChartCoordinates, lockDrawings],
  )

  // Update handleMouseUp to only proceed if drawingInProgress exists
  const handleMouseUp = useCallback(() => {
    if (drawingInProgress) {
      setDrawings((prev) => {
        const finalDrawing = { ...drawingInProgress }
        if ((finalDrawing.type === "trend-line" || finalDrawing.type === "ray") && !finalDrawing.points[1]) {
          return prev // Or handle as a single point drawing
        }
        addHistoryEntry([{ type: "add", drawing: finalDrawing }])
        return [...prev, finalDrawing]
      })
      setDrawingInProgress(null)
      if (!isDrawingMode) {
        setInternalActiveTool("cross") // Reset to cross after drawing if not in drawing mode
      }
    }
  }, [drawingInProgress, addHistoryEntry, isDrawingMode, setInternalActiveTool])

  const visibleDrawings = hideDrawings ? [] : drawings

  const canUndo = historyPointerRef.current >= 0
  const canRedo = historyPointerRef.current < historyRef.current.length - 1

  return {
    drawings: visibleDrawings, // Return filtered drawings
    activeTool: internalActiveTool, // Return internal state
    setActiveTool: setInternalActiveTool, // Allow external components to set active tool
    drawingInProgress,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    undo,
    redo,
    canUndo,
    canRedo,
    setDrawings, // Expose setDrawings for external use
  }
}
