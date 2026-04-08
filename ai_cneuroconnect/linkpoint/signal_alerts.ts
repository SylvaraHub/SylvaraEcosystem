import nodemailer from "nodemailer"

export interface AlertConfig {
  email?: {
    host: string
    port: number
    user: string
    pass: string
    from: string
    to: string[]
    secure?: boolean
  }
  console?: boolean
}

export interface AlertSignal {
  title: string
  message: string
  level: "info" | "warning" | "critical"
  timestamp?: number
}

export interface DispatchResult {
  signal: AlertSignal
  emailSent: boolean
  consoleLogged: boolean
  error?: string
}

export class AlertService {
  constructor(private cfg: AlertConfig) {}

  private async sendEmail(signal: AlertSignal): Promise<boolean> {
    if (!this.cfg.email) return false
    const { host, port, user, pass, from, to, secure } = this.cfg.email
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: secure ?? false,
        auth: { user, pass },
      })
      await transporter.sendMail({
        from,
        to,
        subject: `[${signal.level.toUpperCase()}] ${signal.title}`,
        text: signal.message,
      })
      return true
    } catch (err: any) {
      console.error("[AlertService] Email send failed:", err.message)
      return false
    }
  }

  private logConsole(signal: AlertSignal): boolean {
    if (!this.cfg.console) return false
    const ts = new Date(signal.timestamp ?? Date.now()).toISOString()
    console.log(
      `[AlertService][${signal.level.toUpperCase()}][${ts}] ${signal.title}\n${signal.message}`
    )
    return true
  }

  async dispatch(signals: AlertSignal[]): Promise<DispatchResult[]> {
    const results: DispatchResult[] = []
    for (const sig of signals) {
      const res: DispatchResult = {
        signal: { ...sig, timestamp: sig.timestamp ?? Date.now() },
        emailSent: false,
        consoleLogged: false,
      }
      try {
        res.emailSent = await this.sendEmail(res.signal)
        res.consoleLogged = this.logConsole(res.signal)
      } catch (e: any) {
        res.error = e.message
      }
      results.push(res)
    }
    return results
  }
}
