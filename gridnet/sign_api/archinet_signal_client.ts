export interface Signal {
  id: string
  type: string
  timestamp: number
  payload: Record<string, any>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  status?: number
  durationMs?: number
}

/**
 * Simple HTTP client for fetching signals from ArchiNet.
 */
export class SignalApiClient {
  constructor(private baseUrl: string, private apiKey?: string, private timeoutMs = 10000) {}

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`
    return headers
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await fetch(url, { ...options, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  async fetchAllSignals(): Promise<ApiResponse<Signal[]>> {
    const start = Date.now()
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/signals`, {
        method: "GET",
        headers: this.getHeaders(),
      })
      const duration = Date.now() - start
      if (!res.ok) return { success: false, error: `HTTP ${res.status}`, status: res.status, durationMs: duration }
      const data = (await res.json()) as Signal[]
      return { success: true, data, status: res.status, durationMs: duration }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async fetchSignalById(id: string): Promise<ApiResponse<Signal>> {
    const start = Date.now()
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/signals/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: this.getHeaders(),
      })
      const duration = Date.now() - start
      if (!res.ok) return { success: false, error: `HTTP ${res.status}`, status: res.status, durationMs: duration }
      const data = (await res.json()) as Signal
      return { success: true, data, status: res.status, durationMs: duration }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async createSignal(signal: Omit<Signal, "id" | "timestamp">): Promise<ApiResponse<Signal>> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/signals`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(signal),
      })
      if (!res.ok) return { success: false, error: `HTTP ${res.status}`, status: res.status }
      const data = (await res.json()) as Signal
      return { success: true, data, status: res.status }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async deleteSignal(id: string): Promise<ApiResponse<null>> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/signals/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      })
      if (!res.ok) return { success: false, error: `HTTP ${res.status}`, status: res.status }
      return { success: true, data: null, status: res.status }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async updateSignal(id: string, updates: Partial<Signal>): Promise<ApiResponse<Signal>> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/signals/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      })
      if (!res.ok) return { success: false, error: `HTTP ${res.status}`, status: res.status }
      const data = (await res.json()) as Signal
      return { success: true, data, status: res.status }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }
}
