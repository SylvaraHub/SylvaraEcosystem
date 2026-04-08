import type { SightCoreMessage } from "./WebSocketClient"

export interface AggregatedSignal {
  topic: string
  count: number
  lastPayload: any
  lastTimestamp: number
  firstTimestamp?: number
}

export class SignalAggregator {
  private counts: Record<string, AggregatedSignal> = {}

  processMessage(msg: SightCoreMessage): AggregatedSignal {
    const { topic, payload, timestamp } = msg
    let entry = this.counts[topic]

    if (!entry) {
      entry = {
        topic,
        count: 0,
        lastPayload: null,
        lastTimestamp: 0,
        firstTimestamp: timestamp,
      }
    }

    entry.count += 1
    entry.lastPayload = payload
    entry.lastTimestamp = timestamp
    this.counts[topic] = entry
    return entry
  }

  getAggregated(topic: string): AggregatedSignal | undefined {
    return this.counts[topic]
  }

  getAllAggregated(): AggregatedSignal[] {
    return Object.values(this.counts)
  }

  getMostActiveTopic(): AggregatedSignal | undefined {
    const all = Object.values(this.counts)
    if (!all.length) return undefined
    return all.reduce((max, curr) => (curr.count > max.count ? curr : max))
  }

  getLeastActiveTopic(): AggregatedSignal | undefined {
    const all = Object.values(this.counts)
    if (!all.length) return undefined
    return all.reduce((min, curr) => (curr.count < min.count ? curr : min))
  }

  getSummary(): { totalTopics: number; totalMessages: number } {
    const all = Object.values(this.counts)
    const totalTopics = all.length
    const totalMessages = all.reduce((sum, e) => sum + e.count, 0)
    return { totalTopics, totalMessages }
  }

  resetTopic(topic: string): void {
    delete this.counts[topic]
  }

  resetAll(): void {
    this.counts = {}
  }

  exportState(): Record<string, AggregatedSignal> {
    return { ...this.counts }
  }

  importState(state: Record<string, AggregatedSignal>): void {
    this.counts = { ...state }
  }
}
