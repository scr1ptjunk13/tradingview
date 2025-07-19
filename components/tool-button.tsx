"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { ChevronRightIcon, CheckIcon } from "lucide-react" // Import CheckIcon
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ToolCategory, DrawingTool } from "@/types/drawing"
import SubmenuPopup from "./submenu-popup"
import { useToolbox } from "./toolbox-provider" // Import useToolbox

interface ToolButtonProps {
  tool: ToolCategory
  // isActive now indicates if the tool itself or one of its subtools is active
  // For category buttons, this means if any of its subtools is the activeToolId
  isActive: boolean
  onClick: (toolId: DrawingTool) => void
  isLoading?: boolean
  isDisabled?: boolean
  isCollapsed: boolean // To know if the parent toolbox is collapsed
}

export default function ToolButton({
  tool,
  isActive,
  onClick,
  isLoading = false,
  isDisabled = false,
  isCollapsed,
}: ToolButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { isDrawingMode, activeToolId, setOpenSubmenu, openSubmenu } = useToolbox() // Get context values

  // Check if THIS specific tool (or its category) is active
  // For a category button, it's active if its ID matches openSubmenu, or if any of its subtools is activeToolId
  const isThisToolActive =
    activeToolId === tool.id ||
    (tool.subtools && tool.subtools.some((section) => section.items.some((item) => item.id === activeToolId)))

  const handleClick = () => {
    if (!isDisabled && !isLoading) {
      if (tool.subtools && tool.subtools.length > 0) {
        // If it's a category with subtools, toggle its submenu
        setOpenSubmenu(openSubmenu === tool.id ? null : tool.id)
      } else {
        // If it's a direct tool, select it and close any open submenu
        onClick(tool.id)
        setOpenSubmenu(null)
      }
    }
  }

  const handleSubmenuSelect = (toolId: string) => {
    onClick(toolId as DrawingTool)
    setOpenSubmenu(null) // Close submenu after selection
  }

  const handleSubmenuClose = () => {
    setOpenSubmenu(null)
  }

  const ToolContent = (
    <ToggleGroupItem
      ref={buttonRef}
      value={tool.id} // Use the tool's ID as the value for ToggleGroupItem
      aria-label={`Select ${tool.name} tool`}
      className={cn(
        "relative w-full h-11 flex items-center justify-center rounded-md transition-colors duration-200",
        "text-gray-400",
        "data-[state=on]:bg-cyan-600 data-[state=on]:text-white data-[state=on]:hover:bg-cyan-500",
        "hover:bg-gray-700",
        isLoading && "animate-pulse opacity-70 cursor-not-allowed",
        isDisabled && "opacity-50 cursor-not-allowed",
        // Adjust padding/justify based on collapsed state
        isCollapsed ? "px-0" : "justify-start px-2",
        // Active state for the main button (if it's a category or a direct tool)
        isThisToolActive && "bg-cyan-600 text-white hover:bg-cyan-500", // Use isThisToolActive for visual highlight
        // For mobile, ensure larger touch targets
        !isCollapsed && "h-12 w-12 md:h-11 md:w-auto", // Larger for mobile, default for desktop
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      role={tool.subtools && tool.subtools.length > 0 ? "button" : "radio"} // ARIA role
      aria-haspopup={tool.subtools && tool.subtools.length > 0 ? "menu" : undefined} // ARIA haspopup
      aria-expanded={tool.subtools && tool.subtools.length > 0 ? openSubmenu === tool.id : undefined} // ARIA expanded
      aria-selected={isThisToolActive} // ARIA selected for active tool
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

      {tool.subtools && tool.subtools.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 5 }}
          transition={{ duration: 0.2 }}
          className="absolute right-1"
          // Prevent click on chevron from closing submenu immediately
          onMouseDown={(e) => e.stopPropagation()}
          aria-label={`Show subtools for ${tool.name}`}
        >
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
        </motion.div>
      )}
      {tool.subtools && tool.subtools.length > 0 && (
        <SubmenuPopup
          isOpen={openSubmenu === tool.id} // Only open if this tool's submenu is active
          anchorEl={buttonRef.current}
          sections={tool.subtools}
          onSelect={handleSubmenuSelect}
          onClose={handleSubmenuClose}
        />
      )}
    </ToggleGroupItem>
  )

  // Only show tooltip if toolbox is collapsed (desktop only)
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
