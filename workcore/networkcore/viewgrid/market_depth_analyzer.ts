/**
 * Analyze on-chain orderbook depth for a given market.
 */
export interface Order {
  price: number
  size: number
}

export interface DepthMetrics {
  averageBidDepth: number
  averageAskDepth: number
  spread: number
  midPrice: number
  spreadPct: number
  totalBidSize: number
  totalAskSize: number
  bidImbalance: number // totalBidSize / (totalBidSize + totalAskSize)
  timestamp: number
}

export class TokenDepthAnalyzer {
  constructor(
    private rpcEndpoint: string,
    private marketId: string,
    private timeoutMs: number = 10_000,
    private retries: number = 1
  ) {}

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await fetch(url, { signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  async fetchOrderbook(depth = 50): Promise<{ bids: Order[]; asks: Order[] }> {
    const url = `${this.rpcEndpoint}/orderbook/${encodeURIComponent(this.marketId)}?depth=${depth}`
    let attempt = 0
    while (true) {
      try {
        const res = await this.fetchWithTimeout(url)
        if (!res.ok) throw new Error(`Orderbook fetch failed: ${res.status}`)
        const data = (await res.json()) as { bids?: Order[]; asks?: Order[] }
        const bids = Array.isArray(data.bids) ? data.bids : []
        const asks = Array.isArray(data.asks) ? data.asks : []
        return { bids, asks }
      } catch (err) {
        if (attempt++ < this.retries) continue
        throw err
      }
    }
  }

  private sum(arr: Order[]): number {
    return arr.reduce((s, o) => s + (Number.isFinite(o.size) ? o.size : 0), 0)
  }

  private avgSize(arr: Order[]): number {
    if (!arr.length) return 0
    return this.sum(arr) / arr.length
  }

  private bestBid(bids: Order[]): number {
    return bids.length ? Math.max(...bids.map(b => b.price)) : 0
  }

  private bestAsk(asks: Order[]): number {
    return asks.length ? Math.min(...asks.map(a => a.price)) : 0
  }

  /**
   * Compute depth metrics for the current orderbook snapshot
   */
  async analyze(depth = 50): Promise<DepthMetrics> {
    const { bids, asks } = await this.fetchOrderbook(depth)

    const averageBidDepth = this.avgSize(bids)
    const averageAskDepth = this.avgSize(asks)

    const bestBid = this.bestBid(bids)
    const bestAsk = this.bestAsk(asks)

    const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0
    const midPrice = bestAsk > 0 && bestBid > 0 ? (bestAsk + bestBid) / 2 : 0
    const spreadPct = midPrice > 0 ? (spread / midPrice) * 100 : 0

    const totalBidSize = this.sum(bids)
    const totalAskSize = this.sum(asks)
    const denom = totalBidSize + totalAskSize || 1
    const bidImbalance = totalBidSize / denom

    return {
      averageBidDepth,
      averageAskDepth,
      spread,
      midPrice,
      spreadPct: Math.round(spreadPct * 100) / 100,
      totalBidSize,
      totalAskSize,
      bidImbalance: Math.round(bidImbalance * 10000) / 10000,
      timestamp: Date.now(),
    }
  }
}
