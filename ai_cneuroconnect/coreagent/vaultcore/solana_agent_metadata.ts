export const SOLANA_KNOWLEDGE_AGENT_ID = "solana-knowledge-agent" as const

export const SOLANA_KNOWLEDGE_AGENT_VERSION = "1.0.0" as const

export const SOLANA_KNOWLEDGE_AGENT_LABEL = "Solana Knowledge Agent"

export const SOLANA_KNOWLEDGE_AGENT_TAGS = [
  "solana",
  "knowledge",
  "protocol",
  "rpc",
  "validators",
  "ecosystem",
] as const

export type SolanaKnowledgeAgentInfo = {
  id: typeof SOLANA_KNOWLEDGE_AGENT_ID
  version: typeof SOLANA_KNOWLEDGE_AGENT_VERSION
  label: string
  tags: string[]
}

/**
 * Metadata describing the Solana Knowledge Agent
 */
export const SOLANA_KNOWLEDGE_AGENT_INFO: SolanaKnowledgeAgentInfo = {
  id: SOLANA_KNOWLEDGE_AGENT_ID,
  version: SOLANA_KNOWLEDGE_AGENT_VERSION,
  label: SOLANA_KNOWLEDGE_AGENT_LABEL,
  tags: [...SOLANA_KNOWLEDGE_AGENT_TAGS],
}
