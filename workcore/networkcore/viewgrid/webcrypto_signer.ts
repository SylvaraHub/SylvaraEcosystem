/**
 * SigningEngine: RSA-PKCS1v1.5 (SHA-256) signing & verification with WebCrypto
 * - Works in browser and Node 18+ (uses global webcrypto)
 * - Supports JWK import/export
 */

type SubtleCryptoLike = SubtleCrypto

function getSubtle(): SubtleCryptoLike {
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.subtle) {
    return (globalThis as any).crypto.subtle
  }
  // Node.js fallback (Node 18+ exposes webcrypto via require('crypto').webcrypto)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { webcrypto } = require("crypto")
    return webcrypto.subtle
  } catch {
    throw new Error("WebCrypto SubtleCrypto is not available in this environment")
  }
}

function strToUint8(input: string): Uint8Array {
  return new TextEncoder().encode(input)
}

function toBase64(bytes: ArrayBuffer): string {
  // Prefer Buffer when available (Node), otherwise fall back to btoa
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64")
  }
  let binary = ""
  const arr = new Uint8Array(bytes)
  for (let i = 0; i < arr.byteLength; i++) binary += String.fromCharCode(arr[i])
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"))
  }
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

export interface SigningEngineOptions {
  modulusLength?: number // default 2048
  publicExponent?: Uint8Array // default 0x010001
  hash?: "SHA-256" | "SHA-384" | "SHA-512" // default SHA-256
  extractable?: boolean // default true for export
}

export class SigningEngine {
  private subtle: SubtleCryptoLike
  private keyPair!: CryptoKeyPair

  private algorithm: RsaHashedKeyGenParams

  private constructor(subtle?: SubtleCryptoLike, opts?: SigningEngineOptions) {
    this.subtle = subtle ?? getSubtle()
    const modulusLength = opts?.modulusLength ?? 2048
    const publicExponent = opts?.publicExponent ?? new Uint8Array([1, 0, 1])
    const hash = opts?.hash ?? "SHA-256"
    this.algorithm = { name: "RSASSA-PKCS1-v1_5", modulusLength, publicExponent, hash }
  }

  /**
   * Create a SigningEngine and generate a new key pair
   */
  static async create(opts?: SigningEngineOptions): Promise<SigningEngine> {
    const engine = new SigningEngine(undefined, opts)
    await engine.generateKeyPair(opts?.extractable ?? true)
    return engine
  }

  /**
   * Create a SigningEngine from existing JWK keys
   */
  static async fromJwk(
    publicJwk: JsonWebKey,
    privateJwk?: JsonWebKey,
    opts?: SigningEngineOptions
  ): Promise<SigningEngine> {
    const engine = new SigningEngine(undefined, opts)
    await engine.importFromJwk(publicJwk, privateJwk)
    return engine
  }

  /**
   * Generate a new RSA key pair
   */
  async generateKeyPair(extractable = true): Promise<void> {
    this.keyPair = (await this.subtle.generateKey(this.algorithm, extractable, [
      "sign",
      "verify",
    ])) as CryptoKeyPair
  }

  /**
   * Export public key as JWK
   */
  async exportPublicJwk(): Promise<JsonWebKey> {
    if (!this.keyPair?.publicKey) throw new Error("Key pair not initialized")
    return this.subtle.exportKey("jwk", this.keyPair.publicKey)
  }

  /**
   * Export private key as JWK
   */
  async exportPrivateJwk(): Promise<JsonWebKey> {
    if (!this.keyPair?.privateKey) throw new Error("Key pair not initialized")
    return this.subtle.exportKey("jwk", this.keyPair.privateKey)
  }

  /**
   * Import keys from JWK (public required, private optional)
   */
  async importFromJwk(publicJwk: JsonWebKey, privateJwk?: JsonWebKey): Promise<void> {
    const pubKey = await this.subtle.importKey(
      "jwk",
      publicJwk,
      this.algorithm,
      true,
      ["verify"]
    )

    let privKey: CryptoKey | undefined
    if (privateJwk) {
      privKey = await this.subtle.importKey(
        "jwk",
        privateJwk,
        this.algorithm,
        true,
        ["sign"]
      )
    }
    this.keyPair = { publicKey: pubKey, privateKey: privKey! }
  }

  /**
   * Sign a string and return base64 signature
   */
  async sign(data: string): Promise<string> {
    if (!this.keyPair?.privateKey) throw new Error("Private key is not available")
    const enc = strToUint8(data)
    const sig = await this.subtle.sign(this.algorithm.name, this.keyPair.privateKey, enc)
    return toBase64(sig)
  }

  /**
   * Verify a base64 signature against a string payload
   */
  async verify(data: string, signatureBase64: string): Promise<boolean> {
    if (!this.keyPair?.publicKey) throw new Error("Public key is not available")
    const enc = strToUint8(data)
    const sig = fromBase64(signatureBase64)
    return this.subtle.verify(this.algorithm.name, this.keyPair.publicKey, sig, enc)
  }
}
