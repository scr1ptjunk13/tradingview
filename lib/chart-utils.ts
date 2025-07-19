import type { CandlestickData, VolumeData, Timeframe } from "@/types/chart"

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

const timeframeToMs: Record<Timeframe, number> = {
  "1m": MS_PER_MINUTE,
  "5m": 5 * MS_PER_MINUTE,
  "15m": 15 * MS_PER_MINUTE,
  "1h": MS_PER_HOUR,
  "4h": 4 * MS_PER_HOUR,
  "1d": MS_PER_DAY,
}

export function generateMockCandleData(timeframe: Timeframe, count: number, initialPrice = 100): CandlestickData[] {
  const data: CandlestickData[] = []
  let lastClose = initialPrice
  const interval = timeframeToMs[timeframe]

  // Introduce a "pump" effect around the middle of the data
  const pumpStartIndex = Math.floor(count * 0.6) // Start pump at 60% of data
  const pumpDuration = 5 // Pump over 5 candles
  const pumpMagnitude = 0.8 // 80% increase over pump duration

  for (let i = 0; i < count; i++) {
    const time = Date.now() - (count - 1 - i) * interval
    let open = lastClose * (1 + (Math.random() - 0.5) * 0.02)
    let close = open * (1 + (Math.random() - 0.5) * 0.02)

    // Apply pump effect
    if (i >= pumpStartIndex && i < pumpStartIndex + pumpDuration) {
      const progress = (i - pumpStartIndex) / pumpDuration
      open = lastClose * (1 + pumpMagnitude * progress)
      close = open * (1 + (Math.random() * 0.1 + 0.05)) // Strong upward movement
    } else if (i === pumpStartIndex + pumpDuration) {
      // Ensure the next candle starts from the pumped close
      open = lastClose * (1 + pumpMagnitude)
      close = open * (1 + (Math.random() - 0.5) * 0.02)
    }

    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01)

    data.push({
      time: Math.floor(time / 1000), // Lightweight-charts expects seconds
      open,
      high,
      low,
      close,
    })
    lastClose = close
  }
  return data
}

export function generateMockVolumeData(candlesticks: CandlestickData[]): VolumeData[] {
  return candlesticks.map((candle) => {
    const value = Math.random() * 1000000 + 100000 // Random volume
    const color = candle.close >= candle.open ? "#26a69a" : "#ef5350" // Green for up, red for down
    return {
      time: candle.time,
      value,
      color,
    }
  })
}

export function simulateRealtimeUpdate(
  lastCandle: CandlestickData,
  timeframe: Timeframe,
): { newCandle: CandlestickData; newVolume: VolumeData } {
  const interval = timeframeToMs[timeframe] / 1000 // in seconds
  const newTime = (lastCandle.time as number) + interval

  // Simulate a new candle based on the last one
  const open = lastCandle.close
  const close = open * (1 + (Math.random() - 0.5) * 0.01)
  const high = Math.max(open, close) * (1 + Math.random() * 0.005)
  const low = Math.min(open, close) * (1 - Math.random() * 0.005)

  const newCandle: CandlestickData = {
    time: newTime,
    open,
    high,
    low,
    close,
  }

  const newVolume: VolumeData = {
    time: newTime,
    value: Math.random() * 500000 + 50000,
    color: newCandle.close >= newCandle.open ? "#26a69a" : "#ef5350",
  }

  return { newCandle, newVolume }
}

export function formatPrice(price: number): string {
  return price.toFixed(2)
}
