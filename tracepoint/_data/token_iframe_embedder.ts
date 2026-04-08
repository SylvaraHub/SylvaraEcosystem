import type { TokenDataPoint } from "./tokenDataFetcher"
import { TokenDataFetcher } from "./tokenDataFetcher"

export interface DataIframeConfig {
  containerId: string
  iframeUrl: string
  apiBase: string
  token: string
  refreshMs?: number
  targetOrigin?: string
  className?: string
  sandbox?: string
}

export class TokenDataIframeEmbedder {
  private iframe?: HTMLIFrameElement
  private intervalId: number | null = null
  private fetcher: TokenDataFetcher
  private destroyed = false

  constructor(private cfg: DataIframeConfig) {
    this.fetcher = new TokenDataFetcher(cfg.apiBase)
  }

  async init() {
    if (this.destroyed) throw new Error("Instance already destroyed")
    if (this.iframe) return

    const container = document.getElementById(this.cfg.containerId)
    if (!container) throw new Error(`Container not found: ${this.cfg.containerId}`)

    this.iframe = document.createElement("iframe")
    this.iframe.src = this.cfg.iframeUrl
    this.iframe.style.border = "none"
    this.iframe.width = "100%"
    this.iframe.height = "100%"
    if (this.cfg.className) this.iframe.className = this.cfg.className
    if (this.cfg.sandbox !== undefined) this.iframe.sandbox.value = this.cfg.sandbox

    this.iframe.onload = () => this.postTokenData()
    container.appendChild(this.iframe)

    if (this.cfg.refreshMs && this.cfg.refreshMs > 0) {
      this.intervalId = window.setInterval(() => this.postTokenData(), this.cfg.refreshMs)
    }
  }

  private getTargetOrigin(): string {
    if (this.cfg.targetOrigin) return this.cfg.targetOrigin
    try {
      const url = new URL(this.cfg.iframeUrl)
      return url.origin
    } catch {
      return "*"
    }
  }

  private async postTokenData() {
    if (!this.iframe?.contentWindow) return
    try {
      const data: TokenDataPoint[] = await this.fetcher.fetchHistory(this.cfg.token, 50)
      this.iframe.contentWindow.postMessage(
        {
          type: "TOKEN_DATA_EMBED",
          token: this.cfg.token,
          data,
          ts: Date.now(),
        },
        this.getTargetOrigin()
      )
    } catch (err: any) {
      console.error("[TokenDataIframeEmbedder] Failed to fetch token data:", err.message)
    }
  }

  updateToken(token: string): void {
    this.cfg.token = token
    this.postTokenData()
  }

  refreshNow(): void {
    this.postTokenData()
  }

  destroy(): void {
    this.destroyed = true
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.iframe?.parentElement) {
      this.iframe.parentElement.removeChild(this.iframe)
    }
    this.iframe = undefined
  }
}
