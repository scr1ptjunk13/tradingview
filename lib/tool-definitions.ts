import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BarChart,
  BarChartHorizontal,
  Box,
  Brush,
  Bug,
  Calendar,
  Car,
  Circle,
  Clock,
  CloudSun,
  Crosshair,
  Disc,
  DollarSign,
  Dot,
  Eraser,
  Eye,
  Flag,
  Frame,
  Ghost,
  GitFork,
  GitPullRequest,
  Highlighter,
  Info,
  LineChart,
  ListTree,
  Lock,
  Magnet,
  Maximize2,
  MessageSquare,
  Minus,
  MousePointer2,
  NotebookText,
  Pin,
  Play,
  Plus,
  RectangleVertical,
  RefreshCw,
  Repeat,
  Ruler,
  Ship,
  Shapes,
  Signpost,
  SmileIcon,
  SplitSquareHorizontal,
  Square,
  SquareDot,
  Table,
  Tag,
  Timer,
  TrendingUp,
  Triangle,
  Type,
  Users,
  WavesIcon as WaveSine,
  ZoomOut,
  Anchor,
  ArrowBigDown,
  ArrowBigLeft,
  ArrowBigRight,
  ArrowBigUp,
  Trash2,
} from "lucide-react"
import type { ToolCategory } from "@/types/drawing"

export const TOOL_DEFINITIONS: ToolCategory[] = [
  // 1. CURSOR TOOLS
  {
    id: "drawing-tools-category", // Main button for cursor tools
    name: "Cursor Tools",
    icon: Crosshair,
    tooltip: "Cursor Tools",
    subtools: [
      {
        section: "CURSOR",
        items: [
          { id: "cross", name: "Cross", icon: Crosshair, label: "Cross" },
          { id: "dot", name: "Dot", icon: Dot, label: "Dot" },
          { id: "arrow", name: "Arrow", icon: ArrowUpRight, label: "Arrow" },
          { id: "demonstration", name: "Demonstration", icon: Play, label: "Demonstration" },
          { id: "eraser", name: "Eraser", icon: Eraser, label: "Eraser" },
        ],
      },
    ],
  },
  // 2. TREND LINE TOOLS
  {
    id: "trend-line-category", // Main button for trend line tools
    name: "Trend Line Tools",
    icon: LineChart,
    tooltip: "Trend Line Tools",
    subtools: [
      {
        section: "BASIC LINES",
        items: [
          { id: "trend-line", name: "Trend Line Tool", icon: LineChart, label: "Trend Line Tool" },
          { id: "ray", name: "Ray", icon: ArrowRight, label: "Ray" },
          { id: "info-line", name: "Info Line", icon: Info, label: "Info Line" },
          { id: "extended-line", name: "Extended Line", icon: Maximize2, label: "Extended Line" },
          { id: "trend-angle", name: "Trend Angle", icon: TrendingUp, label: "Trend Angle" },
          { id: "horizontal-line", name: "Horizontal Line", icon: Minus, label: "Horizontal Line" },
          { id: "horizontal-ray", name: "Horizontal Ray", icon: ArrowRight, label: "Horizontal Ray" },
          { id: "vertical-line", name: "Vertical Line", icon: Minus, label: "Vertical Line" },
          { id: "cross-line", name: "Cross Line", icon: Crosshair, label: "Cross Line" },
        ],
      },
      {
        section: "CHANNELS",
        items: [
          { id: "parallel-channel", name: "Parallel Channel", icon: GitPullRequest, label: "Parallel Channel" },
          { id: "regression-trend", name: "Regression Trend", icon: Bug, label: "Regression Trend" },
          { id: "flat-top-bottom", name: "Flat Top/Bottom", icon: Square, label: "Flat Top/Bottom" },
          { id: "disjoint-channel", name: "Disjoint Channel", icon: SplitSquareHorizontal, label: "Disjoint Channel" },
        ],
      },
      {
        section: "PITCHFORK",
        items: [
          { id: "pitchfork", name: "Pitchfork", icon: GitFork, label: "Pitchfork" },
          { id: "schiff-pitchfork", name: "Schiff Pitchfork", icon: Ship, label: "Schiff Pitchfork" },
          {
            id: "modified-schiff",
            name: "Modified Schiff Pitchfork",
            icon: GitFork,
            label: "Modified Schiff Pitchfork",
          },
          { id: "inside-pitchfork", name: "Inside Pitchfork", icon: Disc, label: "Inside Pitchfork" },
        ],
      },
    ],
  },
  // 3. FIBONACCI TOOLS
  {
    id: "fibonacci-category", // Main button for fibonacci tools
    name: "Fibonacci Tools",
    icon: Ruler,
    tooltip: "Fibonacci Tools",
    subtools: [
      {
        section: "FIBONACCI",
        items: [
          { id: "fib-retracement", name: "Fib Retracement", icon: Frame, label: "Fib Retracement" },
          {
            id: "fib-extension",
            name: "Trend-based Fib Extension",
            icon: Triangle,
            label: "Trend-based Fib Extension",
          },
          { id: "fib-channel", name: "Fib Channel", icon: SplitSquareHorizontal, label: "Fib Channel" },
          { id: "fib-time-zone", name: "Fib Time Zone", icon: Clock, label: "Fib Time Zone" },
          { id: "fib-fan", name: "Fib Speed Resistance Fan", icon: RefreshCw, label: "Fib Speed Resistance Fan" },
          { id: "fib-time", name: "Trend-Based Fib Time", icon: Timer, label: "Trend-Based Fib Time" },
          { id: "fib-circles", name: "Fib Circles", icon: Circle, label: "Fib Circles" },
          { id: "fib-spiral", name: "Fib Spiral", icon: RefreshCw, label: "Fib Spiral" },
          { id: "fib-arcs", name: "Fib Speed Resistance Arcs", icon: BarChart, label: "Fib Speed Resistance Arcs" },
          { id: "fib-wedge", name: "Fib Wedge", icon: Triangle, label: "Fib Wedge" },
          { id: "pitchfan", name: "Pitchfan", icon: RefreshCw, label: "Pitchfan" },
        ],
      },
      {
        section: "GANN",
        items: [
          { id: "gann-box", name: "Gann Box", icon: Box, label: "Gann Box" },
          { id: "gann-square-fixed", name: "Gann Square Fixed", icon: Square, label: "Gann Square Fixed" },
          { id: "gann-square", name: "Gann Square", icon: Square, label: "Gann Square" },
          { id: "gann-fan", name: "Gann Fan", icon: RefreshCw, label: "Gann Fan" },
        ],
      },
    ],
  },
  // 4. PATTERN TOOLS
  {
    id: "pattern-category", // Main button for pattern tools
    name: "Pattern Tools",
    icon: Shapes,
    tooltip: "Pattern Tools",
    subtools: [
      {
        section: "PATTERNS",
        items: [
          { id: "xabcd-pattern", name: "XABCD Pattern", icon: Shapes, label: "XABCD Pattern" },
          { id: "cypher-pattern", name: "Cypher Pattern", icon: Shapes, label: "Cypher Pattern" },
          { id: "head-and-shoulders", name: "Head and Shoulders", icon: Users, label: "Head and Shoulders" },
          { id: "abcd-pattern", name: "ABCD Pattern", icon: Shapes, label: "ABCD Pattern" },
          { id: "triangle-pattern", name: "Triangle Pattern", icon: Triangle, label: "Triangle Pattern" },
          { id: "three-drives-pattern", name: "Three Drives Pattern", icon: Car, label: "Three Drives Pattern" },
        ],
      },
      {
        section: "ELLIOTT WAVES",
        items: [
          {
            id: "elliott-impulse-wave",
            name: "Elliott Impulse Wave (12345)",
            icon: WaveSine,
            label: "Elliott Impulse Wave (12345)",
          },
          {
            id: "elliott-correction-wave",
            name: "Elliott Correction Wave (ABC)",
            icon: WaveSine,
            label: "Elliott Correction Wave (ABC)",
          },
          {
            id: "elliott-triangle-wave",
            name: "Elliott Triangle Wave (ABCDE)",
            icon: WaveSine,
            label: "Elliott Triangle Wave (ABCDE)",
          },
          {
            id: "elliott-double-combo-wave",
            name: "Elliott Double Combo Wave (WXY)",
            icon: WaveSine,
            label: "Elliott Double Combo Wave (WXY)",
          },
          {
            id: "elliott-triple-combo-wave",
            name: "Elliott Triple Combo Wave (WXYXZ)",
            icon: WaveSine,
            label: "Elliott Triple Combo Wave (WXYXZ)",
          },
        ],
      },
      {
        section: "CYCLES",
        items: [
          { id: "cyclic-lines", name: "Cyclic Lines", icon: Repeat, label: "Cyclic Lines" },
          { id: "time-cycles", name: "Time Cycles", icon: Clock, label: "Time Cycles" },
          { id: "sine-line", name: "Sine Line", icon: WaveSine, label: "Sine Line" },
        ],
      },
    ],
  },
  // 5. POSITION TOOLS
  {
    id: "position-category", // Main button for position tools
    name: "Position Tools",
    icon: ArrowUp, // Default icon for Long Position
    tooltip: "Position Tools",
    subtools: [
      {
        section: "PROJECTION",
        items: [
          { id: "long-position", name: "Long Position", icon: ArrowUp, label: "Long Position" },
          { id: "short-position", name: "Short Position", icon: ArrowDown, label: "Short Position" },
          { id: "forecast", name: "Forecast", icon: CloudSun, label: "Forecast" },
          { id: "bars-pattern", name: "Bars Pattern", icon: BarChart, label: "Bars Pattern" },
          { id: "ghost-feed-projection", name: "Ghost Feed Projection", icon: Ghost, label: "Ghost Feed Projection" },
        ],
      },
      {
        section: "VOLUME BASED",
        items: [
          { id: "anchored-vwap", name: "Anchored VWAP", icon: Anchor, label: "Anchored VWAP" },
          {
            id: "fixed-range-volume-profile",
            name: "Fixed Range Volume Profile",
            icon: BarChartHorizontal,
            label: "Fixed Range Volume Profile",
          },
        ],
      },
      {
        section: "MEASURER",
        items: [
          { id: "price-range", name: "Price Range", icon: Ruler, label: "Price Range" },
          { id: "date-range", name: "Date Range", icon: Calendar, label: "Date Range" },
        ],
      },
    ],
  },
  // 6. GEOMETRIC SHAPES
  {
    id: "geometric-shapes-category", // Main button for geometric shapes
    name: "Geometric Shapes",
    icon: RectangleVertical,
    tooltip: "Geometric Shapes",
    subtools: [
      {
        section: "BRUSHES",
        items: [
          { id: "brush", name: "Brush", icon: Brush, label: "Brush" },
          { id: "highlighter", name: "Highlighter", icon: Highlighter, label: "Highlighter" },
        ],
      },
      {
        section: "ARROWS",
        items: [
          { id: "arrow-marker", name: "Arrow Marker", icon: ArrowBigRight, label: "Arrow Marker" },
          { id: "arrow", name: "Arrow", icon: ArrowRight, label: "Arrow" },
          { id: "arrow-mark-up", name: "Arrow Mark Up", icon: ArrowBigUp, label: "Arrow Mark Up" },
          { id: "arrow-mark-down", name: "Arrow Mark Down", icon: ArrowBigDown, label: "Arrow Mark Down" },
          { id: "arrow-mark-left", name: "Arrow Mark Left", icon: ArrowBigLeft, label: "Arrow Mark Left" },
          { id: "arrow-mark-right", name: "Arrow Mark Right", icon: ArrowBigRight, label: "Arrow Mark Right" },
        ],
      },
      {
        section: "SHAPES",
        items: [
          { id: "rectangle", name: "Rectangle", icon: RectangleVertical, label: "Rectangle" },
          { id: "rotated-rectangle", name: "Rotated Rectangle", icon: SquareDot, label: "Rotated Rectangle" },
          { id: "ellipse", name: "Ellipse", icon: Circle, label: "Ellipse" },
        ],
      },
    ],
  },
  // 7. ANNOTATION TOOLS
  {
    id: "annotation-category", // Main button for annotation tools
    name: "Annotation Tools",
    icon: Type,
    tooltip: "Annotation Tools",
    subtools: [
      {
        section: "ANNOTATIONS",
        items: [
          { id: "text", name: "Text", icon: Type, label: "Text" },
          { id: "anchored-text", name: "Anchored Text", icon: Anchor, label: "Anchored Text" },
          { id: "note", name: "Note", icon: NotebookText, label: "Note" },
          { id: "price-note", name: "Price Note", icon: DollarSign, label: "Price Note" },
          { id: "pin", name: "Pin", icon: Pin, label: "Pin" },
          { id: "table", name: "Table", icon: Table, label: "Table" },
          { id: "callout", name: "Callout", icon: MessageSquare, label: "Callout" },
          { id: "comment", name: "Comment", icon: MessageSquare, label: "Comment" },
          { id: "price-label", name: "Price Label", icon: Tag, label: "Price Label" },
          { id: "signpost", name: "Signpost", icon: Signpost, label: "Signpost" },
          { id: "flag-mark", name: "Flag Mark", icon: Flag, label: "Flag Mark" },
        ],
      },
    ],
  },
  // 8. ICONS/EMOJI
  {
    id: "emoji-picker-category", // Main button for icon/emoji, will open custom picker
    name: "Icon/Emoji",
    icon: SmileIcon,
    tooltip: "Icon/Emoji Tool",
    // No subtools defined here, as it will trigger a custom component
  },
  // 9. MEASURE TOOL (no submenu)
  { id: "measurement", name: "Measure", icon: Ruler, tooltip: "Measure Tool" },
  // 10. ZOOM IN (no submenu)
  { id: "zoom-in", name: "Zoom In", icon: Plus, tooltip: "Zoom In" },
  // 11. ZOOM OUT (no submenu)
  { id: "zoom-out", name: "Zoom Out", icon: ZoomOut, tooltip: "Zoom Out" },
  // 12. MAGNET (with submenu)
  {
    id: "magnet-mode-toggle", // Main button for magnet mode
    name: "Magnet",
    icon: Magnet,
    tooltip: "Magnet Mode",
    isControl: true, // Mark as control for different handling if needed
    subtools: [
      {
        section: "MAGNET MODE",
        items: [
          { id: "off", name: "Off", icon: MousePointer2, label: "Off" },
          { id: "weak", name: "Weak", icon: Magnet, label: "Weak" },
          { id: "strong", name: "Strong", icon: Magnet, label: "Strong" },
        ],
      },
    ],
  },
  // 13. STAY IN DRAWING MODE (toggle button, no submenu)
  {
    id: "stay-in-drawing-mode",
    name: "Stay in Drawing Mode",
    icon: MousePointer2,
    tooltip: "Stay in Drawing Mode",
    isControl: true,
  },
  // 14. LOCK ALL DRAWINGS (no submenu)
  {
    id: "lock-drawings",
    name: "Lock All Drawings",
    icon: Lock,
    tooltip: "Lock All Drawings",
    isControl: true,
  },
  // 15. HIDE/UNHIDE ALL DRAWINGS (toggle button, no submenu)
  {
    id: "hide-drawings",
    name: "Hide All Drawings",
    icon: Eye,
    tooltip: "Hide/Unhide All Drawings",
    isControl: true,
  },
  // 16. REMOVE TOOL (with submenu)
  {
    id: "remove-tool",
    name: "Remove",
    icon: Trash2, // Using Trash2 for remove
    tooltip: "Remove Tool",
    isControl: true,
    subtools: [
      {
        section: "REMOVE OPTIONS",
        items: [
          { id: "remove-drawings", name: "Remove 0 Drawings", icon: Eraser, label: "Remove 0 Drawings" },
          { id: "remove-indicators", name: "Remove 1 Indicator", icon: Trash2, label: "Remove 1 Indicator" },
          {
            id: "remove-all",
            name: "Remove 0 Drawings and 1 Indicator",
            icon: Trash2,
            label: "Remove 0 Drawings and 1 Indicator",
          },
        ],
      },
    ],
  },
  // 17. SHOW OBJECT TREE (no submenu)
  { id: "show-object-tree", name: "Show Object Tree", icon: ListTree, tooltip: "Show Object Tree" },
]
