"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronUpIcon,
  XIcon,
  MousePointer2Icon,
  MagnetIcon,
  LockIcon,
  EyeIcon,
  UndoIcon,
  RedoIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleGroup } from "@/components/ui/toggle-group"
import ToolButton from "./tool-button"
import { useToolbox } from "./toolbox-provider"
import { TOOL_DEFINITIONS } from "@/lib/tool-definitions"
import type { DrawingTool } from "@/types/drawing"

export default function MobileToolbox() {
  const {
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

  const [isOpen, setIsOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const toggleDrawer = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  // Close drawer on tool selection (if not in drawing mode)
  useEffect(() => {
    if (isOpen && activeToolId && !isDrawingMode && activeToolId !== "cursor") {
      // Only close if a drawing tool was selected and not a control
      const selectedToolDef = TOOL_DEFINITIONS.find((tool) => tool.id === activeToolId)
      if (selectedToolDef && !selectedToolDef.isControl) {
        setIsOpen(false)
      }
    }
  }, [activeToolId, isOpen, isDrawingMode])

  // Close drawer if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Keyboard shortcut for closing drawer (Escape)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault()
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Floating Action Button to open drawer */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-4 right-4"
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-cyan-600 text-white shadow-lg hover:bg-cyan-500"
          onClick={toggleDrawer}
          aria-label={isOpen ? "Close drawing tools" : "Open drawing tools"}
          aria-expanded={isOpen}
          aria-controls="mobile-toolbox-drawer"
        >
          {isOpen ? <XIcon className="h-6 w-6" /> : <ChevronUpIcon className="h-6 w-6" />}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={drawerRef}
            id="mobile-toolbox-drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(event, info) => {
              if (info.point.y > window.innerHeight * 0.7) {
                setIsOpen(false)
              }
            }}
            className="absolute bottom-0 left-0 right-0 bg-[#2a2a2a] border-t border-gray-800 rounded-t-xl shadow-2xl max-h-[80vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Drawing Tools"
          >
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 bg-gray-700 rounded-full" />
            </div>
            <div className="flex-1 overflow-hidden pb-4">
              <div
                ref={scrollContainerRef}
                className="flex flex-row overflow-x-auto px-2 py-2 space-x-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
                role="toolbar"
                aria-orientation="horizontal"
                aria-label="Drawing Tools Categories"
              >
                <ToggleGroup
                  type="single"
                  value={activeToolId || "cursor"}
                  onValueChange={(value: DrawingTool) => value && selectTool(value)}
                  className="flex flex-row space-x-2"
                  role="radiogroup"
                  aria-label="Drawing Tools"
                >
                  {TOOL_DEFINITIONS.map((tool) => (
                    <ToolButton
                      key={tool.id}
                      tool={tool}
                      isActive={
                        activeToolId === tool.id ||
                        tool.subtools?.some((section) => section.items.some((item) => item.id === activeToolId))
                      }
                      onClick={selectTool}
                      isCollapsed={false} // Mobile toolbox is never "collapsed" in the desktop sense
                    />
                  ))}
                </ToggleGroup>
              </div>

              {/* Control Toggles for mobile */}
              <ToggleGroup
                type="multiple"
                className="flex flex-wrap justify-center gap-2 p-4 border-t border-gray-800 mt-4"
              >
                <ToolButton
                  tool={{
                    id: "stay-in-drawing-mode",
                    name: "Stay in Drawing Mode",
                    icon: MousePointer2Icon,
                    tooltip: "Stay in Drawing Mode",
                    isControl: true,
                  }}
                  isActive={isDrawingMode}
                  onClick={toggleDrawingMode}
                  isCollapsed={false}
                />
                <ToolButton
                  tool={{
                    id: "magnet-mode-toggle",
                    name: `Magnet: ${magnetMode.charAt(0).toUpperCase() + magnetMode.slice(1)}`,
                    icon: MagnetIcon,
                    tooltip: `Magnet Mode: ${magnetMode.charAt(0).toUpperCase() + magnetMode.slice(1)}`,
                    isControl: true,
                    subtools: [
                      {
                        section: "MAGNET MODE",
                        items: [
                          { id: "off", name: "Off", icon: MousePointer2Icon, label: "Off" },
                          { id: "weak", name: "Weak", icon: MagnetIcon, label: "Weak" },
                          { id: "strong", name: "Strong", icon: MagnetIcon, label: "Strong" },
                        ],
                      },
                    ],
                  }}
                  isActive={magnetMode !== "off"}
                  onClick={() =>
                    setMagnetMode(magnetMode === "off" ? "weak" : magnetMode === "weak" ? "strong" : "off")
                  }
                  isCollapsed={false}
                />
                <ToolButton
                  tool={{
                    id: "lock-drawings",
                    name: "Lock",
                    icon: LockIcon,
                    tooltip: "Lock Drawings",
                    isControl: true,
                  }}
                  isActive={lockDrawings}
                  onClick={toggleLockDrawings}
                  isCollapsed={false}
                />
                <ToolButton
                  tool={{
                    id: "hide-drawings",
                    name: "Hide",
                    icon: EyeIcon,
                    tooltip: "Hide Drawings",
                    isControl: true,
                  }}
                  isActive={hideDrawings}
                  onClick={toggleHideDrawings}
                  isCollapsed={false}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo}
                  className="h-12 w-12 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50"
                  aria-label="Undo last drawing action"
                >
                  <UndoIcon className="h-6 w-6" />
                  <span className="sr-only">Undo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo}
                  className="h-12 w-12 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50"
                  aria-label="Redo last drawing action"
                >
                  <RedoIcon className="h-6 w-6" />
                  <span className="sr-only">Redo</span>
                </Button>
              </ToggleGroup>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
