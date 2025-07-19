"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon, RedoIcon, UndoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleGroup } from "@/components/ui/toggle-group"
import ToolButton from "./tool-button"
import type { DrawingTool } from "@/types/drawing"
import { cn } from "@/lib/utils"
import { TOOL_DEFINITIONS } from "@/lib/tool-definitions" // Import TOOL_DEFINITIONS
import { useToolbox } from "./toolbox-provider" // Import useToolbox

type ToolboxContainerProps = {}

export default function ToolboxContainer({}: ToolboxContainerProps) {
  const {
    isCollapsed,
    toggleCollapse,
    activeToolId,
    selectTool,
    undo,
    redo,
    canUndo,
    canRedo,
    isDrawingMode,
    toggleDrawingMode,
    magnetMode,
    setMagnetMode,
    lockDrawings,
    toggleLockDrawings,
    hideDrawings,
    toggleHideDrawings,
  } = useToolbox()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)

  const [showScrollUpArrow, setShowScrollUpArrow] = useState(false)
  const [showScrollDownArrow, setShowScrollDownArrow] = useState(false)

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      setShowScrollUpArrow(scrollTop > 0)
      setShowScrollDownArrow(scrollTop + clientHeight < scrollHeight)
    }
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const observerOptions = {
      root: container,
      threshold: 0,
    }

    const topObserver = new IntersectionObserver(([entry]) => {
      setShowScrollUpArrow(!entry.isIntersecting)
    }, observerOptions)

    const bottomObserver = new IntersectionObserver(([entry]) => {
      setShowScrollDownArrow(!entry.isIntersecting)
    }, observerOptions)

    if (topSentinelRef.current) topObserver.observe(topSentinelRef.current)
    if (bottomSentinelRef.current) bottomObserver.observe(bottomSentinelRef.current)

    container.addEventListener("scroll", handleScroll)
    // Initial check
    handleScroll()

    return () => {
      container.removeEventListener("scroll", handleScroll)
      if (topSentinelRef.current) topObserver.unobserve(topSentinelRef.current)
      if (bottomSentinelRef.current) bottomObserver.unobserve(bottomSentinelRef.current)
    }
  }, [handleScroll])

  const scrollContent = useCallback((direction: "up" | "down") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 100 // pixels to scroll
      scrollContainerRef.current.scrollBy({
        top: direction === "up" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }, [])

  // Helper to check if a tool or any of its subtools is active
  const isToolOrSubtoolActive = useCallback(
    (tool: (typeof TOOL_DEFINITIONS)[0]) => {
      if (activeToolId === tool.id) return true
      if (tool.subtools) {
        return tool.subtools.some((section) => section.items.some((item) => item.id === activeToolId))
      }
      return false
    },
    [activeToolId],
  )

  // Filter out control tools from the main TOOL_DEFINITIONS for rendering in the main scrollable area
  const mainDrawingTools = TOOL_DEFINITIONS.filter((tool) => !tool.isControl)
  const controlTools = TOOL_DEFINITIONS.filter((tool) => tool.isControl)

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 48 : 200 }} // Expanded width adjusted for label
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="hidden md:flex flex-col bg-[#0a0a0a] border-r border-gray-800 h-screen py-2 relative overflow-hidden" // Updated background to #0a0a0a
      role="toolbar" // ARIA role for toolbar
      aria-orientation="vertical" // ARIA orientation
      aria-label="Drawing Tools Toolbox" // ARIA label
    >
      {/* Scroll Up Arrow */}
      {showScrollUpArrow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center bg-gray-800 bg-opacity-70 z-20 cursor-pointer"
          onClick={() => scrollContent("up")}
          aria-label="Scroll up"
        >
          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
        </motion.div>
      )}

      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 flex flex-col items-center overflow-y-auto px-1",
          // Custom scrollbar styling for Webkit (Chrome, Safari)
          "scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900",
          // Hide scrollbar when not scrolling (Mac-style) - requires more complex JS for perfect emulation
          // For now, we'll just make it thin and dark.
          // For Firefox:
          "[scrollbar-color:theme(colors.gray.700)_theme(colors.gray.900)]",
        )}
        style={{ scrollbarWidth: "thin" }} // For Firefox
      >
        <div ref={topSentinelRef} className="h-[1px] w-full" /> {/* Top sentinel for IntersectionObserver */}
        <ToggleGroup
          type="single"
          value={activeToolId || "cross"} // Ensure a default value for ToggleGroup
          onValueChange={(value: DrawingTool) => value && selectTool(value)}
          className="flex flex-col space-y-1 w-full"
          role="radiogroup" // ARIA role for a group of toggle buttons
          aria-label="Drawing Tools" // ARIA label for the tool group
        >
          {mainDrawingTools.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={isToolOrSubtoolActive(tool)} // Use the helper function
              onClick={selectTool}
              isCollapsed={isCollapsed}
            />
          ))}
        </ToggleGroup>
        <div ref={bottomSentinelRef} className="h-[1px] w-full" /> {/* Bottom sentinel for IntersectionObserver */}
      </div>

      {/* Scroll Down Arrow */}
      {showScrollDownArrow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-8 left-0 right-0 h-8 flex items-center justify-center bg-gray-800 bg-opacity-70 z-20 cursor-pointer"
          onClick={() => scrollContent("down")}
          aria-label="Scroll down"
        >
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </motion.div>
      )}

      {/* Control Toggles */}
      {/* A ToggleGroup (type=multiple) is required so each ToolButton’s
          ToggleGroupItem has the correct React context. */}
      <ToggleGroup
        type="multiple"
        className="flex flex-col items-center space-y-1 mt-auto py-2 border-t border-gray-800"
      >
        {controlTools.map((tool) => {
          // Special handling for magnet mode to cycle through states
          if (tool.id === "magnet-mode-toggle") {
            return (
              <ToolButton
                key={tool.id}
                tool={{
                  ...tool,
                  name: `Magnet: ${magnetMode.charAt(0).toUpperCase() + magnetMode.slice(1)}`,
                  tooltip: `Magnet Mode: ${magnetMode.charAt(0).toUpperCase() + magnetMode.slice(1)}`,
                }}
                isActive={magnetMode !== "off"}
                onClick={() => setMagnetMode(magnetMode === "off" ? "weak" : magnetMode === "weak" ? "strong" : "off")}
                isCollapsed={isCollapsed}
              />
            )
          }
          // General handling for other control tools
          return (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={
                (tool.id === "stay-in-drawing-mode" && isDrawingMode) ||
                (tool.id === "lock-drawings" && lockDrawings) ||
                (tool.id === "hide-drawings" && hideDrawings)
              }
              onClick={
                tool.id === "stay-in-drawing-mode"
                  ? toggleDrawingMode
                  : tool.id === "lock-drawings"
                    ? toggleLockDrawings
                    : tool.id === "hide-drawings"
                      ? toggleHideDrawings
                      : selectTool // Fallback for other controls if any
              }
              isCollapsed={isCollapsed}
            />
          )
        })}
      </ToggleGroup>

      {/* Undo/Redo Buttons */}
      <div className="flex flex-col items-center space-y-1 py-2 border-t border-gray-800">
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={!canUndo}
          className="w-full h-8 justify-center text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50"
          aria-label="Undo last drawing action"
        >
          <UndoIcon className="h-5 w-5" />
          <span className="sr-only">Undo</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={!canRedo}
          className="w-full h-8 justify-center text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50"
          aria-label="Redo last drawing action"
        >
          <RedoIcon className="h-5 w-5" />
          <span className="sr-only">Redo</span>
        </Button>
      </div>

      {/* Collapse Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapse}
        className="w-full h-8 justify-center text-gray-400 hover:text-white hover:bg-gray-700 mt-2"
        aria-label={isCollapsed ? "Expand toolbox" : "Collapse toolbox"}
      >
        {isCollapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
        <span className="sr-only">{isCollapsed ? "Expand" : "Collapse"}</span>
      </Button>
    </motion.div>
  )
}
