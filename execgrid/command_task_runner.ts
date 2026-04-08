import { execCommand, execCommandDetailed } from "./execCommand"

export interface ShellTask {
  id: string
  command: string
  description?: string
  cwd?: string
  timeoutMs?: number
}

export interface ShellResult {
  taskId: string
  output?: string
  error?: string
  stderr?: string
  executedAt: number
  durationMs: number
}

export class ShellTaskRunner {
  private tasks: ShellTask[] = []

  /**
   * Schedule a shell task for execution.
   */
  scheduleTask(task: ShellTask): void {
    this.tasks.push(task)
  }

  /**
   * Schedule multiple tasks at once.
   */
  scheduleMany(tasks: ShellTask[]): void {
    for (const t of tasks) this.tasks.push(t)
  }

  /**
   * Execute all scheduled tasks in sequence.
   */
  async runAll(): Promise<ShellResult[]> {
    const results: ShellResult[] = []
    for (const task of this.tasks) {
      const start = Date.now()
      try {
        const { stdout, stderr } = await execCommandDetailed(
          task.command,
          task.timeoutMs ?? 30_000,
          task.cwd
        )
        results.push({
          taskId: task.id,
          output: stdout,
          stderr: stderr || undefined,
          executedAt: start,
          durationMs: Date.now() - start,
        })
      } catch (err: any) {
        results.push({
          taskId: task.id,
          error: err.message,
          executedAt: start,
          durationMs: Date.now() - start,
        })
      }
    }
    this.tasks = []
    return results
  }

  /**
   * Run a single task immediately.
   */
  async runTask(task: ShellTask): Promise<ShellResult> {
    const start = Date.now()
    try {
      const { stdout, stderr } = await execCommandDetailed(
        task.command,
        task.timeoutMs ?? 30_000,
        task.cwd
      )
      return {
        taskId: task.id,
        output: stdout,
        stderr: stderr || undefined,
        executedAt: start,
        durationMs: Date.now() - start,
      }
    } catch (err: any) {
      return {
        taskId: task.id,
        error: err.message,
        executedAt: start,
        durationMs: Date.now() - start,
      }
    }
  }

  /**
   * Clear all scheduled tasks without executing them.
   */
  clear(): void {
    this.tasks = []
  }

  /**
   * List currently scheduled tasks.
   */
  listTasks(): ShellTask[] {
    return [...this.tasks]
  }
}
