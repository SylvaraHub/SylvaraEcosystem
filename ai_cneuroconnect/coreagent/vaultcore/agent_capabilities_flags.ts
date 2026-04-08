export interface AgentCapabilities {
  canAnswerProtocolQuestions: boolean
  canAnswerTokenQuestions: boolean
  canDescribeTooling: boolean
  canReportEcosystemNews: boolean
  canExplainValidators?: boolean
  canGuideDevelopers?: boolean
}

export interface AgentFlags {
  requiresExactInvocation: boolean
  noAdditionalCommentary: boolean
  strictMode?: boolean
  logInvocations?: boolean
}

export const SOLANA_AGENT_CAPABILITIES: AgentCapabilities = {
  canAnswerProtocolQuestions: true,
  canAnswerTokenQuestions: true,
  canDescribeTooling: true,
  canReportEcosystemNews: true,
  canExplainValidators: true,
  canGuideDevelopers: true,
}

export const SOLANA_AGENT_FLAGS: AgentFlags = {
  requiresExactInvocation: true,
  noAdditionalCommentary: true,
  strictMode: true,
  logInvocations: false,
}

/**
 * Utility: Summarize agent capabilities as human-readable list
 */
export function summarizeCapabilities(caps: AgentCapabilities): string[] {
  const list: string[] = []
  if (caps.canAnswerProtocolQuestions) list.push("Protocol knowledge")
  if (caps.canAnswerTokenQuestions) list.push("Token knowledge")
  if (caps.canDescribeTooling) list.push("Tooling descriptions")
  if (caps.canReportEcosystemNews) list.push("Ecosystem news")
  if (caps.canExplainValidators) list.push("Validator explanations")
  if (caps.canGuideDevelopers) list.push("Developer guidance")
  return list
}

/**
 * Utility: Check if commentary should be suppressed
 */
export function shouldSuppressCommentary(flags: AgentFlags): boolean {
  return flags.noAdditionalCommentary || flags.strictMode === true
}
