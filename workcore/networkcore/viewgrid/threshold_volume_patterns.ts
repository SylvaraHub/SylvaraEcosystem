/**
 * Detect volume-based patterns in a series of activity amounts.
 * Finds windows with average above a threshold and computes extra metrics.
 */
export interface PatternMatch {
  index: number
  window: number
  average: number
  sum: number
  min: number
  max: number
  stdDev: number
}

function computeStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

export function detectVolumePatterns(
  volumes: number[],
  windowSize: number,
  threshold: number
): PatternMatch[] {
  const matches: PatternMatch[] = []
  if (windowSize <= 0) return matches
  for (let i = 0; i + windowSize <= volumes.length; i++) {
    const slice = volumes.slice(i, i + windowSize)
    const sum = slice.reduce((a, b) => a + b, 0)
    const avg = sum / windowSize
    if (avg >= threshold) {
      const min = Math.min(...slice)
      const max = Math.max(...slice)
      const stdDev = computeStdDev(slice, avg)
      matches.push({
        index: i,
        window: windowSize,
        average: Math.round(avg * 1000) / 1000,
        sum,
        min,
        max,
        stdDev: Math.round(stdDev * 1000) / 1000,
      })
    }
  }
  return matches
}
