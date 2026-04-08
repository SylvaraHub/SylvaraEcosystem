import { z } from "zod"

/**
 * Base types for any action.
 */
export type ActionSchema = z.ZodObject<z.ZodRawShape>

export interface ActionResponse<T> {
  notice: string
  data?: T
  status: "ok" | "error"
  error?: {
    code?: string
    message: string
  }
  meta?: {
    durationMs?: number
    requestId?: string
  }
}

export interface BaseAction<S extends ActionSchema, R, Ctx = unknown> {
  id: string
  summary: string
  input: S
  execute(args: { payload: z.infer<S>; context: Ctx }): Promise<ActionResponse<R>>
}

/** Helper: infer input payload type from schema */
export type InferPayload<S extends ActionSchema> = z.infer<S>

/** Factory: success response */
export function makeSuccessResponse<T>(
  data: T,
  notice = "ok",
  meta?: ActionResponse<T>["meta"]
): ActionResponse<T> {
  return { notice, data, status: "ok", meta }
}

/** Factory: error response */
export function makeErrorResponse<T = never>(
  message: string,
  code?: string,
  notice = "error",
  meta?: ActionResponse<T>["meta"]
): ActionResponse<T> {
  return {
    notice,
    status: "error",
    error: { code, message },
    meta,
  }
}

/** Type guard: check if response is ok */
export function isOk<T>(res: ActionResponse<T>): res is ActionResponse<T> & { data: T } {
  return res.status === "ok" && "data" in res
}
