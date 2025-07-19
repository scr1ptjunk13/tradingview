"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { SearchIcon, SmileIcon, PackageIcon, StarIcon } from "lucide-react" // Icons for categories

interface EmojiPickerSubmenuProps {
  isOpen: boolean
  anchorEl: HTMLElement | null
  onSelect: (emoji: string) => void
  onClose: () => void
}

// Simplified emoji data for demonstration
const emojiCategories = [
  {
    name: "Recent",
    icon: StarIcon,
    emojis: ["👍", "😂", "❤️", "🔥", "🎉"],
  },
  {
    name: "Smileys & People",
    icon: SmileIcon,
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩"],
  },
  {
    name: "Objects",
    icon: PackageIcon,
    emojis: ["💡", "💻", "📱", "⌚", "⏰", "⏳", "💰", "💎", "🔑", "🔒", "🔓", "🛡️", "⚙️", "🔗", "🔌"],
  },
  {
    name: "Symbols",
    icon: StarIcon, // Re-using StarIcon for symbols
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗"],
  },
]

export default function EmojiPickerSubmenu({ isOpen, anchorEl, onSelect, onClose }: EmojiPickerSubmenuProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({})
  const [transformOrigin, setTransformOrigin] = useState("top left")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState(emojiCategories[0].name)

  const filteredEmojis =
    emojiCategories
      .find((cat) => cat.name === activeCategory)
      ?.emojis.filter(
        (emoji) => emoji.includes(searchTerm) || emoji.toLowerCase().includes(searchTerm.toLowerCase()),
      ) || []

  const calculatePosition = useCallback(() => {
    if (!isOpen || !anchorEl || !popupRef.current) return

    const anchorRect = anchorEl.getBoundingClientRect()
    const popupRect = popupRef.current.getBoundingClientRect()

    const offset = 8
    let top = anchorRect.top
    let left = anchorRect.right + offset
    let position: "right" | "left" = "right"

    if (left + popupRect.width > window.innerWidth) {
      left = anchorRect.left - popupRect.width - offset
      position = "left"
    }

    if (top + popupRect.height > window.innerHeight) {
      top = window.innerHeight - popupRect.height - 8
    }

    if (top < 0) {
      top = 8
    }

    setPositionStyle({ top, left })
    setTransformOrigin(position === "right" ? "top left" : "top right")
  }, [isOpen, anchorEl])

  useEffect(() => {
    if (isOpen) {
      calculatePosition()
      window.addEventListener("resize", calculatePosition)
      window.addEventListener("scroll", calculatePosition, true)
    } else {
      window.removeEventListener("resize", calculatePosition)
      window.removeEventListener("scroll", calculatePosition, true)
      setSearchTerm("") // Reset search term when closed
      setActiveCategory(emojiCategories[0].name) // Reset active category
    }
    return () => {
      window.removeEventListener("resize", calculatePosition)
      window.removeEventListener("scroll", calculatePosition, true)
    }
  }, [isOpen, anchorEl, calculatePosition])

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault()
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

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
          className="fixed bg-[#1f1f1f] border border-[#404040] rounded-lg shadow-xl z-[1000] w-[300px] h-[400px] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Emoji Picker"
        >
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emojis..."
                className="w-full pl-10 pr-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search emojis"
              />
            </div>
          </div>
          <div className="flex border-b border-gray-700">
            {emojiCategories.map((category) => (
              <button
                key={category.name}
                className={cn(
                  "flex-1 p-2 text-center text-sm font-medium text-gray-400 hover:bg-gray-700",
                  activeCategory === category.name && "bg-gray-700 text-white border-b-2 border-cyan-500",
                )}
                onClick={() => setActiveCategory(category.name)}
                aria-pressed={activeCategory === category.name}
                aria-label={`Select ${category.name} category`}
              >
                <category.icon className="h-5 w-5 mx-auto" />
                <span className="sr-only">{category.name}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-8 gap-2">
            {filteredEmojis.length > 0 ? (
              filteredEmojis.map((emoji, index) => (
                <button
                  key={index}
                  className="p-1 text-2xl hover:bg-gray-700 rounded-md flex items-center justify-center"
                  onClick={() => {
                    onSelect(emoji)
                    onClose()
                  }}
                  aria-label={`Insert emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))
            ) : (
              <div className="col-span-8 text-center text-gray-400 py-4">No emojis found.</div>
            )}
          </div>
          {/* Placeholder for Stickers/Custom Icons section */}
          <div className="p-3 border-t border-gray-700 text-gray-400 text-xs text-center">
            Stickers & Custom Icons (Coming Soon)
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
