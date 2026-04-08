import fetch, { Response } from "node-fetch"

/*------------------------------------------------------
 * Types
 *----------------------------------------------------*/

interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

export type CandlestickPattern =
  | "Hammer"
  | "ShootingStar"
  | "BullishEngulfing"
  | "BearishEngulfing"
  | "Doji"

export interface PatternSignal {
  timestamp: number
  pattern: CandlestickPattern
  confidence: number
}

export interface DetectorOptions {
  /** request timeout in ms for HTTP calls */
  timeoutMs?: number
  /** minimum body ratio vs range to consider non-doji bodies (0..1) */
  minBodyToRange?: number
  /** number of HTTP retries on network errors / 5xx */
  retries?: number
}

/*------------------------------------------------------
 * Detector
 *----------------------------------------------------*/

export class CandlestickPatternDetector {
  private readonly timeoutMs: number
  private readonly minBodyToRange: number
  private readonly retries: number

  constructor(private readonly apiUrl: string, opts: DetectorOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? 10_000
    this.minBodyToRange = opts.minBodyToRange ?? 0.02
    this.retries = Math.max(0, Math.min(3, opts.retries ?? 1))
  }

  /* ------------------------- Networking --------------------------- */

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await fetch(url, { signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  /* Fetch recent OHLC candles */
  async fetchCandles(symbol: string, limit = 100): Promise<Candle[]> {
    const safeSymbol = encodeURIComponent(symbol)
    const url = `${this.apiUrl}/markets/${safeSymbol}/candles?limit=${limit}`

    let attempt = 0
    // retry on network errors and 5xx
    while (true) {
      try {
        const res = await this.fetchWithTimeout(url)
        if (!res.ok) {
          // retry only on 5xx
          if (res.status >= 500 && res.status < 600 && attempt < this.retries) {
            attempt += 1
            continue
          }
          throw new Error(`Failed to fetch candles ${res.status}: ${res.statusText}`)
        }
        const data = (await res.json()) as Candle[]
        return data
      } catch (e) {
        if (attempt < this.retries) {
          attempt += 1
          continue
        }
        throw e
      }
    }
  }

  /* ------------------------- Pattern helpers ---------------------- */

  private body(c: Candle): number {
    return Math.abs(c.close - c.open)
  }

  private range(c: Candle): number {
    return Math.max(0, c.high - c.low)
  }

  private bodyToRange(c: Candle): number {
    const r = this.range(c)
    return r > 0 ? this.body(c) / r : 0
  }

  private isHammer(c: Candle): number {
    const body = this.body(c)
    const r = this.range(c)
    if (r <= 0) return 0
    const lowerWick = Math.min(c.open, c.close) - c.low
    const upperWick = c.high - Math.max(c.open, c.close)

    // classic hammer: small body near high, long lower shadow
    const lowerRatio = body > 0 ? lowerWick / body : 0
    const bodyNearHigh = upperWick <= body * 0.5
    const smallBody = body / r < 0.3 && this.bodyToRange(c) >= this.minBodyToRange

    return lowerRatio > 2 && bodyNearHigh && smallBody ? Math.min(lowerRatio / 3, 1) : 0
  }

  private isShootingStar(c: Candle): number {
    const body = this.body(c)
    const r = this.range(c)
    if (r <= 0) return 0
    const upperWick = c.high - Math.max(c.open, c.close)
    const lowerWick = Math.min(c.open, c.close) - c.low

    // shooting star: small body near low, long upper shadow
    const upperRatio = body > 0 ? upperWick / body : 0
    const bodyNearLow = lowerWick <= body * 0.5
    const smallBody = body / r < 0.3 && this.bodyToRange(c) >= this.minBodyToRange

    return upperRatio > 2 && bodyNearLow && smallBody ? Math.min(upperRatio / 3, 1) : 0
  }

  private isBullishEngulfing(prev: Candle, curr: Candle): number {
    const cond =
      curr.close > curr.open && // current bullish
      prev.close < prev.open && // previous bearish
      curr.close >= prev.open &&
      curr.open <= prev.close

    if (!cond) return 0

    const bodyPrev = this.body(prev)
    const bodyCurr = this.body(curr)

    if (bodyPrev === 0) return 0.8
    return Math.min(bodyCurr / bodyPrev, 1)
  }

  private isBearishEngulfing(prev: Candle, curr: Candle): number {
    const cond =
      curr.close < curr.open && // current bearish
      prev.close > prev.open && // previous bullish
      curr.open >= prev.close &&
      curr.close <= prev.open

    if (!cond) return 0

    const bodyPrev = this.body(prev)
    const bodyCurr = this.body(curr)

    if (bodyPrev === 0) return 0.8
    return Math.min(bodyCurr / bodyPrev, 1)
  }

  private isDoji(c: Candle): number {
    const r = this.range(c)
    const b = this.body(c)
    if (r <= 0) return 0
    const ratio = b / r
    // strong doji when body is less than 5% of range
    if (ratio < 0.05) return 1
    // soft doji confidence fades linearly until 10%
    return ratio < 0.1 ? 1 - (ratio - 0.05) / 0.05 : 0
  }

  /* ------------------------- Public API --------------------------- */

  /**
   * Detect patterns over a candle array and return pattern signals
   */
  detect(candles: Candle[]): PatternSignal[] {
    if (candles.length === 0) return []

    const signals: PatternSignal[] = []

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i]

      // single-candle patterns
      const hammer = this.isHammer(c)
      if (hammer > 0) {
        signals.push({ timestamp: c.timestamp, pattern: "Hammer", confidence: this.round2(hammer) })
      }

      const star = this.isShootingStar(c)
      if (star > 0) {
        signals.push({
          timestamp: c.timestamp,
          pattern: "ShootingStar",
          confidence: this.round2(star),
        })
      }

      const doji = this.isDoji(c)
      if (doji > 0) {
        signals.push({ timestamp: c.timestamp, pattern: "Doji", confidence: this.round2(doji) })
      }

      // two-candle patterns
      if (i > 0) {
        const p = candles[i - 1]
        const bull = this.isBullishEngulfing(p, c)
        if (bull > 0) {
          signals.push({
            timestamp: c.timestamp,
            pattern: "BullishEngulfing",
            confidence: this.round2(bull),
          })
        }

        const bear = this.isBearishEngulfing(p, c)
        if (bear > 0) {
          signals.push({
            timestamp: c.timestamp,
            pattern: "BearishEngulfing",
            confidence: this.round2(bear),
          })
        }
      }
    }

    return signals.sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Analyze a market symbol by fetching candles and running detection
   */
  async analyzeSymbol(symbol: string, limit = 100): Promise<PatternSignal[]> {
    const candles = await this.fetchCandles(symbol, limit)
    return this.detect(candles)
  }

  /**
   * Group signals by pattern and compute basic stats
   */
  summarize(signals: PatternSignal[]): Record<CandlestickPattern, { count: number; last?: number }> {
    const summary: Record<CandlestickPattern, { count: number; last?: number }> = {
      Hammer: { count: 0 },
      ShootingStar: { count: 0 },
      BullishEngulfing: { count: 0 },
      BearishEngulfing: { count: 0 },
      Doji: { count: 0 },
    }
    for (const s of signals) {
      const entry = summary[s.pattern]
      entry.count += 1
      entry.last = s.timestamp
    }
    return summary
  }

  /* ------------------------- Utils -------------------------------- */

  private round2(v: number): number {
    return Math.round(v * 100) / 100
  }
}
