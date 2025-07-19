"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react"
import type { DrawingTool, MagnetMode, ToolboxState } from "@/types/drawing"
import { useDrawingManager } from "@/hooks/use-drawing-manager"
import { TOOL_DEFINITIONS } from "@/lib/tool-definitions"

interface ToolboxProviderProps {
  children: React.ReactNode
  chartApiRef: React.MutableRefObject<any> // IChartApi
  candlestickSeriesRef: React.MutableRefObject<any> // ISeriesApi
  chartContainerRef: React.RefObject<HTMLDivElement>
}

const ToolboxContext = createContext<ToolboxState | undefined>(undefined)

// Helper to find the default active tool from TOOL_DEFINITIONS
const getDefaultActiveTool = (): DrawingTool => {
  // Find the "drawing-tools-category" and get its first subtool item's ID
  const drawingToolsCategory = TOOL_DEFINITIONS.find((tool) => tool.id === "drawing-tools-category")
  if (drawingToolsCategory && drawingToolsCategory.subtools && drawingToolsCategory.subtools[0]?.items[0]) {
    return drawingToolsCategory.subtools[0].items[0].id // Default to "cross"
  }
  return "cross" // Fallback if structure changes or not found
}

export function ToolboxProvider({
  children,
  chartApiRef,
  candlestickSeriesRef,
  chartContainerRef,
}: ToolboxProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isToolboxCollapsed") === "true"
    }
    return false
  })
  const [activeToolId, setActiveToolId] = useState<DrawingTool | null>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("activeToolId") as DrawingTool) || getDefaultActiveTool()
    }
    return getDefaultActiveTool()
  })
  const [openSubmenu, setOpenSubmenu] = useState<DrawingTool | null>(null)
  const [isDrawingMode, setIsDrawingMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isDrawingMode") === "true"
    }
    return false
  })
  const [magnetMode, setContextMagnetMode] = useState<MagnetMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("magnetMode") as MagnetMode) || "off"
    }
    return "off"
  })
  const [lockDrawings, setLockDrawings] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lockDrawings") === "true"
    }
    return false
  })
  const [hideDrawings, setHideDrawings] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hideDrawings") === "true"
    }
    return false
  })
  const [isMobile, setIsMobile] = useState(false) // New state for mobile detection

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // Define mobile breakpoint
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Integrate useDrawingManager
  const {
    drawings,
    drawingInProgress,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    undo,
    redo,
    canUndo,
    canRedo,
    setActiveTool: setDrawingManagerActiveTool, // Rename to avoid conflict
    setDrawings, // Expose setDrawings for lock/hide logic
  } = useDrawingManager({
    chartApi: chartApiRef.current,
    candlestickSeries: candlestickSeriesRef.current,
    chartContainerRef: chartContainerRef,
    activeTool: activeToolId, // Pass activeToolId from context
    isDrawingMode: isDrawingMode, // Pass drawing mode from context
    magnetMode: magnetMode, // Pass magnet mode from context
    lockDrawings: lockDrawings, // Pass lock state
    hideDrawings: hideDrawings, // Pass hide state
  })

  // Sync activeToolId with useDrawingManager's internal state
  useEffect(() => {
    setDrawingManagerActiveTool(activeToolId)
  }, [activeToolId, setDrawingManagerActiveTool])

  // Actions
  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const selectTool = useCallback(
    (toolId: DrawingTool) => {
      setActiveToolId(toolId)
      setOpenSubmenu(null) // Close any open submenu
      // If not in drawing mode, reset to cursor after a non-control tool is selected
      const toolDefinition = TOOL_DEFINITIONS.find((tool) => tool.id === toolId)
      const isControlTool = toolDefinition?.isControl || false
      const isCategoryTool = toolDefinition?.subtools !== undefined || toolId === "emoji-picker-category"

      if (!isDrawingMode && !isControlTool && !isCategoryTool) {
        // This logic might need refinement based on how "drawing mode" affects tool selection
        // For now, if a drawing tool is selected and not in drawing mode, it will auto-switch to cursor after use.
      }
    },
    [isDrawingMode],
  )

  const toggleDrawingMode = useCallback(() => {
    setIsDrawingMode((prev) => !prev)
  }, [])

  const toggleLockDrawings = useCallback(() => {
    setLockDrawings((prev) => !prev)
  }, [])

  const toggleHideDrawings = useCallback(() => {
    setHideDrawings((prev) => !prev)
  }, [])

  // Persistence effects
  useEffect(() => {
    localStorage.setItem("isToolboxCollapsed", String(isCollapsed))
  }, [isCollapsed])

  useEffect(() => {
    localStorage.setItem("activeToolId", activeToolId || getDefaultActiveTool())
  }, [activeToolId])

  useEffect(() => {
    localStorage.setItem("isDrawingMode", String(isDrawingMode))
  }, [isDrawingMode])

  useEffect(() => {
    localStorage.setItem("magnetMode", magnetMode)
  }, [magnetMode])

  useEffect(() => {
    localStorage.setItem("lockDrawings", String(lockDrawings))
  }, [lockDrawings])

  useEffect(() => {
    localStorage.setItem("hideDrawings", String(hideDrawings))
  }, [hideDrawings])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+B / Cmd+B for toolbox collapse
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault()
        toggleCollapse()
      }
      // Alt+D for "Stay in Drawing Mode"
      if ((event.altKey || event.metaKey) && event.key === "d") {
        event.preventDefault()
        toggleDrawingMode()
      }
      // ESC to reset to default drawing tool (e.g., "cross")
      if (event.key === "Escape") {
        event.preventDefault()
        selectTool(getDefaultActiveTool())
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [toggleCollapse, toggleDrawingMode, selectTool])

  const contextValue = useMemo(
    () => ({
      isCollapsed,
      activeToolId,
      openSubmenu,
      isDrawingMode,
      magnetMode,
      lockDrawings,
      hideDrawings,
      isMobile, // Expose isMobile
      toggleCollapse,
      selectTool,
      setOpenSubmenu, // Expose for ToolButton to open submenus
      toggleDrawingMode,
      setMagnetMode: setContextMagnetMode, // Rename to avoid conflict
      toggleLockDrawings,
      toggleHideDrawings,
      undo,
      redo,
      canUndo,
      canRedo,
      drawings, // Expose drawings for other components if needed
      drawingInProgress, // Expose drawingInProgress
      handleMouseDown, // Expose mouse handlers for DrawingCanvas
      handleMouseMove,
      handleMouseUp,
    }),
    [
      isCollapsed,
      activeToolId,
      openSubmenu,
      isDrawingMode,
      magnetMode,
      lockDrawings,
      hideDrawings,
      isMobile, // Add to dependencies
      toggleCollapse,
      selectTool,
      toggleDrawingMode,
      setContextMagnetMode, // Rename to avoid conflict
      toggleLockDrawings,
      toggleHideDrawings,
      undo,
      redo,
      canUndo,
      canRedo,
      drawings,
      drawingInProgress,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
    ],
  )

  return <ToolboxContext.Provider value={contextValue}>{children}</ToolboxContext.Provider>
}

export function useToolbox() {
  const context = useContext(ToolboxContext)
  if (context === undefined) {
    throw new Error("useToolbox must be used within a ToolboxProvider")
  }
  return context
}
