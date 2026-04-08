export interface LaunchConfig {
  contractName: string
  parameters: Record<string, any>
  deployEndpoint: string
  apiKey?: string
  timeoutMs?: number
}

export interface LaunchResult {
  success: boolean
  address?: string
  transactionHash?: string
  error?: string
  status?: number
  durationMs?: number
}

export class LaunchNode {
  constructor(private config: LaunchConfig) {}

  async deploy(): Promise<LaunchResult> {
    const { deployEndpoint, apiKey, contractName, parameters, timeoutMs } = this.config
    const start = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs ?? 15000)

    try {
      const res = await fetch(deployEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ contractName, parameters }),
        signal: controller.signal,
      })
      clearTimeout(timer)

      const duration = Date.now() - start
      if (!res.ok) {
        const text = await res.text()
        return {
          success: false,
          error: `HTTP ${res.status}: ${text}`,
          status: res.status,
          durationMs: duration,
        }
      }

      const json = await res.json()
      return {
        success: true,
        address: json.contractAddress,
        transactionHash: json.txHash,
        status: res.status,
        durationMs: duration,
      }
    } catch (err: any) {
      return { success: false, error: err.message, durationMs: Date.now() - start }
    }
  }

  async dryRun(): Promise<LaunchResult> {
    try {
      return {
        success: true,
        address: "0x0000000000000000000000000000000000000000",
        transactionHash: "0xDRYRUN",
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }
}
