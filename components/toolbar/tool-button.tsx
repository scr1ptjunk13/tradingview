"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { ChevronRightIcon, CheckIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ToolCategory, DrawingTool } from "@/types/drawing"
import ToolSubmenu from "./tool-submenu"
import EmojiPickerSubmenu from "./emoji-picker-submenu"
import { useToolbox } from "../toolbox-provider"

interface ToolButtonProps {
  tool: ToolCategory
  isActive: boolean
  onClick: (toolId: DrawingTool) => void
  isLoading?: boolean
  isDisabled?: boolean
  isCollapsed: boolean
}

export default function ToolButton({
  tool,
  isActive,
  onClick,
  isLoading = false,
  isDisabled = false,
  isCollapsed,
}: ToolButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { isDrawingMode, activeToolId, setOpenSubmenu, openSubmenu } = useToolbox()

  const isThisToolActive =
    activeToolId === tool.id ||
    (tool.subtools && tool.subtools.some((section) => section.items.some((item) => item.id === activeToolId)))

  const hasSubmenu = (tool.subtools && tool.subtools.length > 0) || tool.id === "emoji-picker-category"

  const handleClick = () => {
    if (!isDisabled && !isLoading) {
      if (hasSubmenu) {
        setOpenSubmenu(openSubmenu === tool.id ? null : tool.id)
      } else {
        onClick(tool.id)
        setOpenSubmenu(null)
      }
    }
  }

  const handleSubmenuSelect = (toolId: string) => {
    onClick(toolId as DrawingTool)
    setOpenSubmenu(null)
  }

  const handleSubmenuClose = () => {
    setOpenSubmenu(null)
  }

  const ToolContent = (
    <ToggleGroupItem
      ref={buttonRef}
      value={tool.id}
      aria-label={`Select ${tool.name} tool`}
      className={cn(
        "relative w-full h-11 flex items-center rounded-md transition-colors duration-200",
        "text-gray-400",
        "data-[state=on]:bg-cyan-600 data-[state=on]:text-white data-[state=on]:hover:bg-cyan-500",
        "hover:bg-gray-700",
        isLoading && "animate-pulse opacity-70 cursor-not-allowed",
        isDisabled && "opacity-50 cursor-not-allowed",
        isCollapsed ? "px-0 justify-center" : "justify-between px-3 py-2", // Adjusted layout for collapsed/expanded
        isThisToolActive && "bg-cyan-600 text-white hover:bg-cyan-500",
      )}
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      role={hasSubmenu ? "button" : "radio"}
      aria-haspopup={hasSubmenu ? "menu" : undefined}
      aria-expanded={hasSubmenu ? openSubmenu === tool.id : undefined}
      aria-selected={isThisToolActive}
    >
      <tool.icon className="h-5 w-5" />
      {!isCollapsed && <span className="ml-2 text-sm font-medium">{tool.name}</span>}
      <span className="sr-only">{tool.name}</span>

      {/* "Stay in Drawing Mode" indicator for drawing tools */}
      {!isCollapsed && isDrawingMode && !tool.isControl && isThisToolActive && (
        <motion.div
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute right-1"
          aria-label="Stay in drawing mode active"
        >
          <CheckIcon className="h-4 w-4 text-green-400" />
        </motion.div>
      )}

      {/* Chevron for submenus - only visible when not collapsed and has submenu */}
      {!isCollapsed && hasSubmenu && <ChevronRightIcon className="h-3 w-3 text-gray-400 ml-auto shrink-0" />}

      {/* Submenu Popups */}
      {tool.id === "emoji-picker-category" ? (
        <EmojiPickerSubmenu
          isOpen={openSubmenu === tool.id}
          anchorEl={buttonRef.current}
          onSelect={handleSubmenuSelect}
          onClose={handleSubmenuClose}
        />
      ) : (
        tool.subtools &&
        tool.subtools.length > 0 && (
          <ToolSubmenu
            isOpen={openSubmenu === tool.id}
            anchorEl={buttonRef.current}
            sections={tool.subtools}
            onSelect={handleSubmenuSelect}
            onClose={handleSubmenuClose}
          />
        )
      )}
    </ToggleGroupItem>
  )

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={800}>
          <TooltipTrigger asChild>{ToolContent}</TooltipTrigger>
          <TooltipContent side="right" className="bg-gray-800 text-white border-gray-700">
            {tool.tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return ToolContent
}
