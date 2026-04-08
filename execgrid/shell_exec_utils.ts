import { exec } from "child_process"

/**
 * Execute a shell command and return stdout or throw on error.
 * @param command Shell command to run (e.g., "ls -la")
 * @param timeoutMs Optional timeout in milliseconds
 * @param cwd Optional working directory
 * @param env Optional environment overrides
 */
export function execCommand(
  command: string,
  timeoutMs: number = 30_000,
  cwd?: string,
  env?: NodeJS.ProcessEnv
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = exec(
      command,
      { timeout: timeoutMs, cwd, env: { ...process.env, ...env } },
      (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`Command failed: ${stderr || error.message}`))
        }
        resolve(stdout.trim())
      }
    )

    proc.on("error", err => {
      reject(new Error(`Process error: ${err.message}`))
    })
  })
}

/**
 * Execute a shell command and capture both stdout and stderr separately
 */
export async function execCommandDetailed(
  command: string,
  timeoutMs: number = 30_000,
  cwd?: string,
  env?: NodeJS.ProcessEnv
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = exec(
      command,
      { timeout: timeoutMs, cwd, env: { ...process.env, ...env } },
      (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`Command failed: ${stderr || error.message}`))
        }
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
      }
    )

    proc.on("error", err => {
      reject(new Error(`Process error: ${err.message}`))
    })
  })
}

/**
 * Run multiple commands sequentially and collect outputs
 */
export async function execCommandsSequential(
  commands: string[],
  timeoutMs: number = 30_000,
  cwd?: string,
  env?: NodeJS.ProcessEnv
): Promise<string[]> {
  const results: string[] = []
  for (const cmd of commands) {
    const out = await execCommand(cmd, timeoutMs, cwd, env)
    results.push(out)
  }
  return results
}
