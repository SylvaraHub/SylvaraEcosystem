export interface PricePoint {
  timestamp: number
  priceUsd: number
}

export interface TrendResult {
  startTime: number
  endTime: number
  trend: "upward" | "downward" | "neutral"
  changePct: number
  duration: number
}

export interface TrendSummary {
  totalSegments: number
  upwardSegments: number
  downwardSegments: number
  neutralSegments: number
  avgChangePct: number
}

/**
 * Analyze a series of price points to determine overall trend segments.
 */
export function analyzePriceTrends(
  points: PricePoint[],
  minSegmentLength: number = 5
): TrendResult[] {
  const results: TrendResult[] = []
  if (points.length < minSegmentLength) return results

  let segStart = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].priceUsd
    const curr = points[i].priceUsd
    const direction = curr > prev ? 1 : curr < prev ? -1 : 0

    const isSegmentEnd =
      i - segStart >= minSegmentLength &&
      (i === points.length - 1 ||
        (direction === 1 && points[i + 1].priceUsd < curr) ||
        (direction === -1 && points[i + 1].priceUsd > curr))

    if (isSegmentEnd) {
      const start = points[segStart]
      const end = points[i]
      const changePct = ((end.priceUsd - start.priceUsd) / start.priceUsd) * 100
      results.push({
        startTime: start.timestamp,
        endTime: end.timestamp,
        trend: changePct > 0 ? "upward" : changePct < 0 ? "downward" : "neutral",
        changePct: Math.round(changePct * 100) / 100,
        duration: end.timestamp - start.timestamp,
      })
      segStart = i
    }
  }
  return results
}

/**
 * Summarize multiple trend results into aggregated statistics.
 */
export function summarizeTrends(results: TrendResult[]): TrendSummary {
  if (!results.length) {
    return {
      totalSegments: 0,
      upwardSegments: 0,
      downwardSegments: 0,
      neutralSegments: 0,
      avgChangePct: 0,
    }
  }

  const upwardSegments = results.filter(r => r.trend === "upward").length
  const downwardSegments = results.filter(r => r.trend === "downward").length
  const neutralSegments = results.filter(r => r.trend === "neutral").length
  const avgChangePct =
    results.reduce((acc, r) => acc + r.changePct, 0) / results.length

  return {
    totalSegments: results.length,
    upwardSegments,
    downwardSegments,
    neutralSegments,
    avgChangePct: Math.round(avgChangePct * 100) / 100,
  }
}

/**
 * Detect the most significant trend segment by absolute change percentage.
 */
export function findStrongestTrend(results: TrendResult[]): TrendResult | null {
  if (!results.length) return null
  return results.reduce((max, curr) =>
    Math.abs(curr.changePct) > Math.abs(max.changePct) ? curr : max
  )
}
