export interface PairInfo {
  exchange: string
  pairAddress: string
  baseSymbol: string
  quoteSymbol: string
  liquidityUsd: number
  volume24hUsd: number
  priceUsd: number
  updatedAt?: number
}

export interface ApiConfig {
  name: string
  baseUrl: string
  apiKey?: string
}

export interface DexSuiteConfig {
  apis: ApiConfig[]
  timeoutMs?: number
  retries?: number
  retryBackoffMs?: number
}

export class DexSuite {
  private readonly timeoutMs: number
  private readonly retries: number
  private readonly backoffMs: number

  constructor(private config: DexSuiteConfig) {
    if (!config.apis?.length) throw new Error("DexSuite requires at least one API")
    this.timeoutMs = config.timeoutMs ?? 10_000
    this.retries = Math.max(0, Math.min(3, config.retries ?? 1))
    this.backoffMs = Math.max(0, config.retryBackoffMs ?? 300)
  }

  /* ----------------------------- HTTP ----------------------------- */

  private async sleep(ms: number): Promise<void> {
    await new Promise(res => setTimeout(res, ms))
  }

  private async fetchFromApi<T>(api: ApiConfig, path: string): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await fetch(`${api.baseUrl}${path}`, {
        headers: api.apiKey ? { Authorization: `Bearer ${api.apiKey}` } : {},
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`${api.name} ${path} ${res.status}`)
      return (await res.json()) as T
    } finally {
      clearTimeout(timer)
    }
  }

  private async fetchWithRetry<T>(api: ApiConfig, path: string): Promise<T> {
    let attempt = 0
    while (true) {
      try {
        return await this.fetchFromApi<T>(api, path)
      } catch (err) {
        if (attempt >= this.retries) throw err
        attempt += 1
        await this.sleep(this.backoffMs * attempt)
      }
    }
  }

  /* --------------------------- Aggregation ------------------------- */

  /**
   * Retrieve aggregated pair info across all configured DEX APIs.
   * @param pairAddress Blockchain address of the trading pair
   */
  async getPairInfo(pairAddress: string): Promise<PairInfo[]> {
    if (!pairAddress) return []
    const addr = encodeURIComponent(pairAddress)

    const results: PairInfo[] = []
    const tasks = this.config.apis.map(async api => {
      try {
        const data = await this.fetchWithRetry<any>(api, `/pair/${addr}`)
        results.push({
          exchange: api.name,
          pairAddress,
          baseSymbol: data.token0?.symbol ?? data.baseSymbol ?? "BASE",
          quoteSymbol: data.token1?.symbol ?? data.quoteSymbol ?? "QUOTE",
          liquidityUsd: Number(data.liquidityUsd ?? data.liquidity_usd ?? 0),
          volume24hUsd: Number(data.volume24hUsd ?? data.volume_24h_usd ?? 0),
          priceUsd: Number(data.priceUsd ?? data.price_usd ?? data.price ?? 0),
          updatedAt: Date.now(),
        })
      } catch {
        // skip failed API
      }
    })
    await Promise.all(tasks)
    return results
  }

  /**
   * Compare a list of pairs across exchanges, returning the best volume and liquidity.
   * If a pair returns no data from any API, it will be omitted from the result.
   */
  async comparePairs(
    pairs: string[]
  ): Promise<Record<string, { bestVolume: PairInfo; bestLiquidity: PairInfo }>> {
    const entries = await Promise.all(
      pairs.map(async addr => {
        const infos = await this.getPairInfo(addr)
        if (!infos.length) return null
        const bestVolume = infos.reduce((a, b) => (b.volume24hUsd > a.volume24hUsd ? b : a))
        const bestLiquidity = infos.reduce((a, b) => (b.liquidityUsd > a.liquidityUsd ? b : a))
        return [addr, { bestVolume, bestLiquidity }] as const
      })
    )
    return Object.fromEntries(entries.filter(Boolean) as Array<[string, { bestVolume: PairInfo; bestLiquidity: PairInfo }]>)
  }

  /**
   * Return min/max price across venues for a pair plus spread
   */
  async summarizePrices(pairAddress: string): Promise<{
    pairAddress: string
    venues: number
    minPrice?: PairInfo
    maxPrice?: PairInfo
    spreadPct?: number
  }> {
    const infos = await this.getPairInfo(pairAddress)
    if (!infos.length) return { pairAddress, venues: 0 }

    const minPrice = infos.reduce((a, b) => (b.priceUsd < a.priceUsd ? b : a))
    const maxPrice = infos.reduce((a, b) => (b.priceUsd > a.priceUsd ? b : a))
    const spreadPct = maxPrice.priceUsd > 0
      ? Math.round(((maxPrice.priceUsd - minPrice.priceUsd) / maxPrice.priceUsd) * 10000) / 100
      : undefined

    return { pairAddress, venues: infos.length, minPrice, maxPrice, spreadPct }
  }

  /**
   * Choose the "best venue" by a scoring function combining liquidity and volume
   * weightLiquidity and weightVolume are linear weights that must be >= 0
   */
  async selectBestVenue(
    pairAddress: string,
    weightLiquidity = 0.7,
    weightVolume = 0.3
  ): Promise<{ best?: PairInfo; scored: Array<PairInfo & { score: number }> }> {
    const infos = await this.getPairInfo(pairAddress)
    if (!infos.length) return { best: undefined, scored: [] }

    const maxLiq = Math.max(...infos.map(i => i.liquidityUsd || 0)) || 1
    const maxVol = Math.max(...infos.map(i => i.volume24hUsd || 0)) || 1

    const scored = infos.map(i => ({
      ...i,
      score:
        (weightLiquidity * (i.liquidityUsd / maxLiq)) +
        (weightVolume * (i.volume24hUsd / maxVol)),
    }))
    const best = scored.reduce((a, b) => (b.score > a.score ? b : a))
    return { best, scored }
  }
}
