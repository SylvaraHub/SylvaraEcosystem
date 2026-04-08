import { z } from "zod"
import {
  BaseAction,
  ActionResponse,
  ActionSchema,
  makeErrorResponse,
} from "./action_base_types"

interface AgentContext {
  apiEndpoint: string
  apiKey: string
}

/**
 * Central Agent: routes calls to registered actions
 */
export class CoreAgent {
  private actions = new Map<string, BaseAction<any, any, AgentContext>>()

  register<S extends ActionSchema, R>(action: BaseAction<S, R, AgentContext>): void {
    this.actions.set(action.id, action)
  }

  registerMany(actions: Array<BaseAction<any, any, AgentContext>>): void {
    for (const a of actions) this.register(a)
  }

  unregister(actionId: string): boolean {
    return this.actions.delete(actionId)
  }

  hasAction(actionId: string): boolean {
    return this.actions.has(actionId)
  }

  listActionIds(): string[] {
    return Array.from(this.actions.keys())
  }

  getAction<S extends ActionSchema, R>(actionId: string):
    | BaseAction<S, R, AgentContext>
    | undefined {
    return this.actions.get(actionId) as BaseAction<S, R, AgentContext> | undefined
  }

  /**
   * Invoke an action by id with runtime payload validation against its Zod schema
   */
  async invoke<R>(
    actionId: string,
    payload: unknown,
    ctx: AgentContext
  ): Promise<ActionResponse<R>> {
    const action = this.actions.get(actionId)
    const start = Date.now()

    if (!action) {
      return makeErrorResponse<R>(
        `Unknown action "${actionId}"`,
        "ACTION_NOT_FOUND",
        "error",
        { durationMs: Date.now() - start }
      )
    }

    // validate and coerce input via the action's schema
    const parsed = (action.input as z.ZodTypeAny).safeParse(payload)
    if (!parsed.success) {
      return makeErrorResponse<R>(
        parsed.error.issues.map(i => i.message).join("; "),
        "INVALID_PAYLOAD",
        "error",
        { durationMs: Date.now() - start }
      )
    }

    // execute with strongly typed payload
    const result = await action.execute({ payload: parsed.data, context: ctx })
    // attach duration meta if not supplied by the action
    if (!result.meta) {
      result.meta = { durationMs: Date.now() - start }
    } else if (result.meta.durationMs === undefined) {
      result.meta.durationMs = Date.now() - start
    }
    return result
  }
}
