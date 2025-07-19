import type { Drawing } from "@/types/drawing"

export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function saveDrawingsToLocalStorage(drawings: Drawing[], chartId = "default-chart"): void {
  try {
    localStorage.setItem(`drawings-${chartId}`, JSON.stringify(drawings))
  } catch (error) {
    console.error("Failed to save drawings to local storage:", error)
  }
}

export function loadDrawingsFromLocalStorage(chartId = "default-chart"): Drawing[] {
  try {
    const storedDrawings = localStorage.getItem(`drawings-${chartId}`)
    return storedDrawings ? JSON.parse(storedDrawings) : []
  } catch (error) {
    console.error("Failed to load drawings from local storage:", error)
    return []
  }
}
