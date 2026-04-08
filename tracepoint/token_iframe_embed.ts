import type { TokenMetrics } from "./tokenAnalysisCalculator"

export interface IframeConfig {
  containerId: string
  srcUrl: string
  metrics: TokenMetrics
  refreshIntervalMs?: number
  targetOrigin?: string
  className?: string
  sandbox?: string
  allow?: string
}

export class TokenAnalysisIframe {
  private iframeEl: HTMLIFrameElement | null = null
  private intervalId: number | null = null
  private destroyed = false

  constructor(private config: IframeConfig) {}

  init(): void {
    if (this.destroyed) throw new Error("TokenAnalysisIframe instance destroyed")
    if (this.iframeEl) return

    const container = document.getElementById(this.config.containerId)
    if (!container) throw new Error("Container not found: " + this.config.containerId)

    const iframe = document.createElement("iframe")
    iframe.src = this.config.srcUrl
    iframe.width = "100%"
    iframe.height = "100%"
    if (this.config.className) iframe.className = this.config.className
    if (this.config.sandbox !== undefined) iframe.sandbox.value = this.config.sandbox
    if (this.config.allow !== undefined) iframe.allow = this.config.allow

    iframe.onload = () => this.postMetrics()
    container.appendChild(iframe)
    this.iframeEl = iframe

    if (this.config.refreshIntervalMs && this.config.refreshIntervalMs > 0) {
      this.intervalId = window.setInterval(
        () => this.postMetrics(),
        this.config.refreshIntervalMs
      )
    }
  }

  updateMetrics(metrics: TokenMetrics): void {
    this.config.metrics = metrics
    this.postMetrics()
  }

  refreshNow(): void {
    this.postMetrics()
  }

  destroy(): void {
    this.destroyed = true
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.iframeEl?.parentElement) {
      this.iframeEl.parentElement.removeChild(this.iframeEl)
    }
    this.iframeEl = null
  }

  private getTargetOrigin(): string {
    if (this.config.targetOrigin) return this.config.targetOrigin
    try {
      const url = new URL(this.config.srcUrl)
      return url.origin
    } catch {
      return "*"
    }
  }

  private postMetrics(): void {
    if (!this.iframeEl?.contentWindow) return
    const payload = {
      type: "TOKEN_ANALYSIS_METRICS",
      payload: this.config.metrics,
      ts: Date.now(),
    }
    this.iframeEl.contentWindow.postMessage(payload, this.getTargetOrigin())
    if (typeof console !== "undefined" && console.debug) {
      console.debug("[TokenAnalysisIframe] Posted metrics", payload)
    }
  }
}
