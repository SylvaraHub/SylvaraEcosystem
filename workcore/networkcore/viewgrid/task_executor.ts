/**
 * Simple task executor: registers and runs tasks by type.
 */

export type TaskParams = Record<string, any>
export type Handler<T = any> = (params: TaskParams) => Promise<T>

export interface Task {
  id: string
  type: string
  params: TaskParams
}

export interface TaskResult<T = any> {
  id: string
  result?: T
  error?: string
  startedAt: number
  finishedAt: number
}

export class ExecutionEngine {
  private handlers: Record<string, Handler<any>> = {}
  private queue: Task[] = []

  /** Register a handler for a given task type */
  register<T = any>(type: string, handler: Handler<T>): void {
    if (this.handlers[type]) {
      throw new Error(`Handler for type "${type}" already registered`)
    }
    this.handlers[type] = handler
  }

  /** Enqueue a new task for execution */
  enqueue(task: Task): void {
    if (!this.handlers[task.type]) {
      throw new Error(`No handler registered for type "${task.type}"`)
    }
    this.queue.push(task)
  }

  /** Run all queued tasks sequentially */
  async runAll(): Promise<TaskResult[]> {
    const results: TaskResult[] = []
    while (this.queue.length > 0) {
      const task = this.queue.shift()!
      const startedAt = Date.now()
      try {
        const result = await this.handlers[task.type](task.params)
        results.push({
          id: task.id,
          result,
          startedAt,
          finishedAt: Date.now(),
        })
      } catch (err: any) {
        results.push({
          id: task.id,
          error: err.message ?? String(err),
          startedAt,
          finishedAt: Date.now(),
        })
      }
    }
    return results
  }

  /** Check if a handler exists */
  hasHandler(type: string): boolean {
    return !!this.handlers[type]
  }

  /** Reset all queued tasks */
  clearQueue(): void {
    this.queue = []
  }

  /** Remove all registered handlers */
  clearHandlers(): void {
    this.handlers = {}
  }
}
