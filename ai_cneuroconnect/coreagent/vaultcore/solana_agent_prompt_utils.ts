import { SOLANA_GET_KNOWLEDGE_NAME } from "@/ai/solana-knowledge/actions/get-knowledge/name"

export interface SolanaToolCall {
  tool: typeof SOLANA_GET_KNOWLEDGE_NAME
  query: string
}

export const SOLANA_TOPIC_HINTS = [
  "solana",
  "spl",
  "rpc",
  "validator",
  "stake",
  "staking",
  "geyser",
  "proof-of-history",
  "poh",
  "slot",
  "epoch",
  "lamports",
  "program",
  "anchor",
  "token-2022",
  "jito",
  "mev",
  "shred",
  "quic",
  "tpu",
  "tip",
  "priority fee",
  "dex",
  "raydium",
  "orca",
  "pump.fun",
  "helius",
  "shinami",
  "wallet adapter",
  "keypair",
  "ed25519"
] as const

/**
 * Prompt for the Solana Knowledge Agent
 * The agent must invoke the tool with the user query verbatim
 */
export const SOLANA_KNOWLEDGE_AGENT_PROMPT = `
You are the Solana Knowledge Agent

Responsibilities:
  • Provide authoritative answers on Solana protocols, tokens, developer tooling, RPC concepts, validators, and ecosystem news
  • For any Solana-related question, invoke the tool ${SOLANA_GET_KNOWLEDGE_NAME} with the user’s exact wording

Invocation Rules:
1) Detect Solana topics (protocol, DEX, token, wallet, staking, on-chain mechanics, validators, RPC)
2) Call:
   {
     "tool": "${SOLANA_GET_KNOWLEDGE_NAME}",
     "query": "<user question as-is>"
   }
3) Do not add commentary, formatting, disclaimers, or extra keys
4) If the question is not about Solana, yield control without responding

Output:
- Emit a single JSON object with keys "tool" and "query"
- Do not wrap in markdown fences
- Do not prepend or append text

Guardrails:
- Preserve the user’s wording exactly in "query" including punctuation and casing
- Do not summarize, translate, or rewrite the query
- Do not include examples, thoughts, or reasoning in the output
- Never include code blocks or additional fields

Routing Examples:

Valid — Solana topic:
{"tool":"${SOLANA_GET_KNOWLEDGE_NAME}","query":"How does Solana’s Proof-of-History work?"}

Valid — Solana RPC:
{"tool":"${SOLANA_GET_KNOWLEDGE_NAME}","query":"What is the difference between getBalance and getTokenAccountBalance?"}

Invalid — Added commentary:
"Sure — here you go: { \\"tool\\": \\"${SOLANA_GET_KNOWLEDGE_NAME}\\", \\"query\\": \\"Explain validators\\" }"

Invalid — Extra keys:
{"tool":"${SOLANA_GET_KNOWLEDGE_NAME}","query":"Explain stake accounts","meta":"extra"}

Non-Solana — yield control:
<no output>
`.trim()

/**
 * Utility to construct a valid tool call payload
 * Ensures strict shape and preserves the query verbatim
 */
export function buildSolanaToolCall(query: string): SolanaToolCall {
  return { tool: SOLANA_GET_KNOWLEDGE_NAME, query }
}

/**
 * Heuristic detector for Solana-related queries
 * Use to preflight routing before emitting the tool call
 */
export function isSolanaTopic(input: string): boolean {
  const q = input.toLowerCase()
  return SOLANA_TOPIC_HINTS.some(h => q.includes(h))
}
