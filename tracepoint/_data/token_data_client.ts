export interface TokenDataPoint {
  timestamp: number
  priceUsd: number
  volumeUsd: number
  marketCapUsd: number
}

export interface TokenMetadata {
  symbol: string
  name?: string
  decimals?: number
  chain?: string
}

export class TokenDataFetcher {
  constructor(private apiBase: string, private timeoutMs: number = 10000) {}

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await fetch(url, { signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Fetches an array of TokenDataPoint for the given token symbol.
   * Expects endpoint: `${apiBase}/tokens/${symbol}/history`
   */
  async fetchHistory(symbol: string, limit?: number): Promise<TokenDataPoint[]> {
    const url = `${this.apiBase}/tokens/${encodeURIComponent(symbol)}/history${
      limit ? `?limit=${limit}` : ""
    }`
    const res = await this.fetchWithTimeout(url)
    if (!res.ok) throw new Error(`Failed to fetch history for ${symbol}: ${res.status}`)
    const raw = (await res.json()) as any[]
    return raw.map(r => ({
      timestamp: (r.time ?? r.timestamp) * 1000,
      priceUsd: Number(r.priceUsd),
      volumeUsd: Number(r.volumeUsd),
      marketCapUsd: Number(r.marketCapUsd),
    }))
  }

  /**
   * Fetch token metadata.
   * Expects endpoint: `${apiBase}/tokens/${symbol}/metadata`
   */
  async fetchMetadata(symbol: string): Promise<TokenMetadata> {
    const url = `${this.apiBase}/tokens/${encodeURIComponent(symbol)}/metadata`
    const res = await this.fetchWithTimeout(url)
    if (!res.ok) throw new Error(`Failed to fetch metadata for ${symbol}: ${res.status}`)
    return (await res.json()) as TokenMetadata
  }

  /**
   * Fetch the latest token price snapshot.
   * Expects endpoint: `${apiBase}/tokens/${symbol}/price`
   */
  async fetchLatestPrice(symbol: string): Promise<number> {
    const url = `${this.apiBase}/tokens/${encodeURIComponent(symbol)}/price`
    const res = await this.fetchWithTimeout(url)
    if (!res.ok) throw new Error(`Failed to fetch latest price for ${symbol}: ${res.status}`)
    const data = await res.json()
    return Number(data.priceUsd)
  }
}
