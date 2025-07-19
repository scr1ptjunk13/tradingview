import type { CandlestickData } from "./chart"
import type React from "react" // Import React for React.ElementType

export type DrawingTool =
  | "cursor" // Generic cursor, now replaced by specific cross/dot/arrow
  | "cross"
  | "dot"
  | "arrow"
  | "demonstration"
  | "eraser"
  | "drawing-tools-category" // Category for cursor tools
  | "trend-line"
  | "ray"
  | "horizontal-line"
  | "parallel-channel"
  | "rectangle"
  | "ellipse"
  | "text"
  | "zoom-in"
  | "zoom-out"
  | "magnet"
  | "cross-line"
  | "info-line"
  | "extended-line"
  | "trend-angle"
  | "horizontal-ray"
  | "vertical-line"
  | "regression-trend"
  | "flat-top-bottom"
  | "disjoint-channel"
  | "pitchfork"
  | "schiff-pitchfork"
  | "modified-schiff"
  | "inside-pitchfork"
  | "fib-retracement"
  | "fib-extension"
  | "fib-channel"
  | "fib-time-zone"
  | "fib-fan"
  | "fib-time"
  | "fib-circles"
  | "fib-spiral"
  | "fib-arcs"
  | "fib-wedge"
  | "pitchfan"
  | "gann-box"
  | "gann-square-fixed"
  | "gann-square"
  | "gann-fan"
  | "measurement" // New measurement tool
  | "icon-emoji" // New icon/emoji tool (now a category)
  | "stay-in-drawing-mode" // New control tool
  | "magnet-mode-toggle" // New control tool
  | "lock-drawings" // New control tool
  | "hide-drawings" // New control tool
  | "trend-line-category" // Category for trend line tools
  | "fibonacci-category" // Category for fibonacci tools
  | "pattern-category" // Category for pattern tools
  | "xabcd-pattern"
  | "cypher-pattern"
  | "head-and-shoulders"
  | "abcd-pattern"
  | "triangle-pattern"
  | "three-drives-pattern"
  | "elliott-impulse-wave"
  | "elliott-correction-wave"
  | "elliott-triangle-wave"
  | "elliott-double-combo-wave"
  | "elliott-triple-combo-wave"
  | "cyclic-lines"
  | "time-cycles"
  | "sine-line"
  | "position-category" // Category for position tools
  | "long-position"
  | "short-position"
  | "forecast"
  | "bars-pattern"
  | "ghost-feed-projection"
  | "anchored-vwap"
  | "fixed-range-volume-profile"
  | "price-range"
  | "date-range"
  | "geometric-shapes-category" // Category for geometric shapes
  | "brush"
  | "highlighter"
  | "arrow-marker"
  | "arrow-mark-up"
  | "arrow-mark-down"
  | "arrow-mark-left"
  | "arrow-mark-right"
  | "rotated-rectangle"
  | "annotation-category" // Category for annotation tools
  | "anchored-text"
  | "note"
  | "price-note"
  | "pin"
  | "table"
  | "callout"
  | "comment"
  | "price-label"
  | "signpost"
  | "flag-mark"
  | "emojis" // Sub-item for emoji picker
  | "stickers" // Sub-item for emoji picker
  | "icons" // Sub-item for emoji picker
  | "remove-tool" // Category for remove tool
  | "remove-drawings"
  | "remove-indicators"
  | "remove-all"
  | "show-object-tree" // New tool
  | "emoji-picker-category" // New category for emoji picker

export interface Point {
  time: CandlestickData["time"]
  price: number
}

export interface LineDrawing {
  id: string
  type: "trend-line" | "horizontal-line" | "ray"
  points: [Point, Point?] // For trend line/ray, 2 points. For horizontal, only 1 (price)
  color: string
  lineWidth: number
  lineStyle: "solid" | "dashed" | "dotted"
}

export interface MeasurementDrawing {
  id: string
  type: "measurement"
  points: [Point, Point]
  color: string
  lineWidth: number
}

// Union type for all possible drawing types
export type Drawing = LineDrawing | MeasurementDrawing // | ShapeDrawing | TextDrawing;

export interface DrawingAction {
  type: "add" | "update" | "delete"
  drawing?: Drawing // The drawing involved in the action
  prevDrawing?: Drawing // Previous state for 'update'
}

export interface SubtoolItem {
  id: DrawingTool // Use DrawingTool for subtool IDs
  name: string
  icon: React.ElementType
  label: string // Added label for display in submenu
  shortcut?: string
  disabled?: boolean
}

export interface SubtoolSection {
  section: string // Renamed from 'title' to 'section' as per prompt
  items: SubtoolItem[]
}

export interface ToolCategory {
  id: DrawingTool // Main tool ID
  name: string // Display name for the main tool button
  icon: React.ElementType
  tooltip: string
  shortcut?: string
  subtools?: SubtoolSection[] // Optional array of sections for submenus
  isControl?: boolean // New: indicates if this is a control toggle, not a drawing tool
}

export type MagnetMode = "off" | "weak" | "strong"

export interface ToolboxState {
  // UI State
  isCollapsed: boolean
  activeToolId: DrawingTool | null
  openSubmenu: DrawingTool | null // ID of the tool whose submenu is open
  isMobile: boolean

  // Tool States
  isDrawingMode: boolean // "Stay in Drawing Mode"
  magnetMode: MagnetMode
  lockDrawings: boolean
  hideDrawings: boolean

  // History (managed by useDrawingManager, exposed here)
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean

  // Drawing data (from useDrawingManager)
  drawings: Drawing[]
  drawingInProgress: Drawing | null
  handleMouseDown: (event: React.MouseEvent<SVGSVGElement>) => void
  handleMouseMove: (event: React.MouseEvent<SVGSVGElement>) => void
  handleMouseUp: () => void
  setDrawings: React.Dispatch<React.SetStateAction<Drawing[]>>

  // Actions
  toggleCollapse: () => void
  selectTool: (toolId: DrawingTool) => void
  setOpenSubmenu: (submenu: DrawingTool | null) => void
  toggleDrawingMode: () => void
  setMagnetMode: (mode: MagnetMode) => void
  toggleLockDrawings: () => void
  toggleHideDrawings: () => void
}

// Placeholder for tool settings, can be expanded later
export interface ToolSettings {
  color: string
  lineWidth: number
  lineStyle: "solid" | "dashed" | "dotted"
  // ... other settings per tool type
}
