export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d"

export interface CandlestickData {
  time: string | number // Unix timestamp or ISO string
  open: number
  high: number
  low: number
  close: number
}

export interface VolumeData {
  time: string | number
  value: number
  color?: string // Optional color for volume bar
}

export interface ChartData {
  candlesticks: CandlestickData[]
  volume: VolumeData[]
}

export interface WebSocketMessage {
  type: "candle" | "volume"
  data: CandlestickData | VolumeData
}

export type ChartType =
  | "candlestick"
  | "bar"
  | "hollow-candlestick"
  | "hlc-bar"
  | "line"
  | "line-with-markers"
  | "step-line"
  | "area"
  | "hlc-area"
  | "baseline"
  | "columns"
  | "high-low"
  | "heikin-ashi"
