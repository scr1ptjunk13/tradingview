"use client"

import React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { SubtoolSection } from "@/types/drawing"

interface SubmenuPopupProps {
  isOpen: boolean
  anchorEl: HTMLElement | null
  sections: SubtoolSection[] // Changed from SubmenuSection to SubtoolSection
  onSelect: (toolId: string) => void
  onClose: () => void
}

export default function SubmenuPopup({ isOpen, anchorEl, sections, onSelect, onClose }: SubmenuPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({})
  const [transformOrigin, setTransformOrigin] = useState("top left")
  const [activeItemIndex, setActiveItemIndex] = useState(-1)

  const allItems = sections.flatMap((section) => section.items)

  const calculatePosition = useCallback(() => {
    if (!isOpen || !anchorEl || !popupRef.current) return

    const anchorRect = anchorEl.getBoundingClientRect()
    const popupRect = popupRef.current.getBoundingClientRect()

    const offset = 8 // 8px offset from trigger button
    let top = anchorRect.top
    let left = anchorRect.right + offset
    let position: "right" | "left" = "right"

    // Check for horizontal overflow
    if (left + popupRect.width > window.innerWidth) {
      left = anchorRect.left - popupRect.width - offset
      position = "left"
    }

    // Check for vertical overflow (bottom)
    if (top + popupRect.height > window.innerHeight) {
      top = window.innerHeight - popupRect.height - 8 // 8px margin from bottom
    }

    // Check for vertical overflow (top)
    if (top < 0) {
      top = 8 // 8px margin from top
    }

    setPositionStyle({ top, left })
    setTransformOrigin(position === "right" ? "top left" : "top right")
  }, [isOpen, anchorEl])

  useEffect(() => {
    if (isOpen) {
      calculatePosition()
      // Recalculate on resize or scroll
      window.addEventListener("resize", calculatePosition)
      window.addEventListener("scroll", calculatePosition, true) // Use capture phase for better detection
    } else {
      window.removeEventListener("resize", calculatePosition)
      window.removeEventListener("scroll", calculatePosition, true)
      setActiveItemIndex(-1) // Reset active item when closed
    }
    return () => {
      window.removeEventListener("resize", calculatePosition)
      window.removeEventListener("scroll", calculatePosition, true)
    }
  }, [isOpen, anchorEl, calculatePosition])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        anchorEl &&
        !anchorEl.contains(event.target as Node)
      ) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, anchorEl, onClose])

  // Escape key to close & Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        setActiveItemIndex((prev) => (prev + 1) % allItems.length)
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setActiveItemIndex((prev) => (prev - 1 + allItems.length) % allItems.length)
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        if (activeItemIndex !== -1 && !allItems[activeItemIndex]?.disabled) {
          onSelect(allItems[activeItemIndex].id)
        }
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, allItems, activeItemIndex, onSelect, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ ...positionStyle, transformOrigin }}
          className="fixed bg-[#1f1f1f] border border-[#404040] rounded-lg shadow-xl z-[1000] min-w-[250px] max-w-[320px] py-2"
          role="menu" // ARIA role for menu
          aria-orientation="vertical" // ARIA orientation
        >
          {sections.map((section, sectionIndex) => (
            <React.Fragment key={section.section}>
              {" "}
              {/* Use section.section as key */}
              {section.section && ( // Use section.section for title
                <div className="px-4 py-1 text-xs uppercase text-gray-400 font-medium">{section.section}</div>
              )}
              <ul className="list-none p-0 m-0">
                {section.items.map((item, itemIndex) => {
                  const isCurrentActive = allItems.indexOf(item) === activeItemIndex
                  return (
                    <li
                      key={item.id}
                      role="menuitem" // ARIA role for menu item
                      className={cn(
                        "flex items-center h-9 px-3 cursor-pointer transition-colors duration-100",
                        "text-white text-sm font-medium",
                        item.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-700",
                        isCurrentActive && "bg-gray-700", // Highlight active item for keyboard nav
                      )}
                      onClick={() => !item.disabled && onSelect(item.id)}
                      onMouseEnter={() => setActiveItemIndex(allItems.indexOf(item))}
                      onMouseLeave={() => setActiveItemIndex(-1)}
                      aria-disabled={item.disabled} // ARIA disabled
                      aria-label={item.name} // Use item.name for ARIA label
                    >
                      {item.icon && <item.icon className="h-4 w-4 mr-2 shrink-0" />}
                      <span className="flex-1 truncate">{item.name}</span> {/* Use item.name for display */}
                      {item.shortcut && <span className="ml-4 text-xs text-gray-400">{item.shortcut}</span>}
                    </li>
                  )
                })}
              </ul>
              {sectionIndex < sections.length - 1 && <div className="mx-3 my-2 border-t border-gray-700" />}
            </React.Fragment>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
