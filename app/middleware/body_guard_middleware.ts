import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
const MAX_SCAN_DEPTH = 8
const MAX_SCANNED_KEYS = 500

/**
 * Baseline count of own properties on Object.prototype, captured on first use.
 * Prototype pollution can only ADD keys here, so any growth means the process
 * was polluted at runtime.
 */
let prototypeBaseline: number | null = null

/**
 * Post-parse body guard (router stack → runs AFTER the bodyparser).
 *
 * Containment for GHSA-f5x2-vj4h-vg4c (prototype pollution via multipart field
 * names, @adonisjs/bodyparser <=10.1.2, where user-controlled keys reach
 * `lodash.set`). Two layers:
 *
 * 1. Reject parsed bodies containing `__proto__`/`constructor`/`prototype`
 *    keys at any depth, so a malicious field name never travels further into
 *    validators, handlers, or repositories.
 * 2. Detect a polluted `Object.prototype` (key-count growth vs baseline) and
 *    refuse the request loudly instead of serving with poisoned semantics.
 *
 * This narrows the blast radius; it cannot un-pollute an already-poisoned
 * process (restart is the recovery). The real cure remains upgrading past the
 * advisory range.
 */
export default class BodyGuardMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const body =
      typeof (ctx.request as { body?: () => unknown }).body === 'function'
        ? ctx.request.body()
        : {}

    if (hasDangerousKeys(body)) {
      return ctx.response.status(400).send({
        status: 'error',
        error: { code: 'MALFORMED_BODY', message: 'Invalid request body' },
      })
    }

    if (prototypeBaseline === null) {
      prototypeBaseline = Object.getOwnPropertyNames(Object.prototype).length
    } else if (Object.getOwnPropertyNames(Object.prototype).length !== prototypeBaseline) {
      ctx.logger.error({ code: 'PROTOTYPE_POLLUTION_DETECTED' }, 'Object.prototype key count changed')
      return ctx.response.status(400).send({
        status: 'error',
        error: { code: 'MALFORMED_BODY', message: 'Invalid request body' },
      })
    }

    return next()
  }
}

function hasDangerousKeys(root: unknown): boolean {
  const stack: Array<{ value: unknown; depth: number }> = [{ value: root, depth: 0 }]
  const seen = new Set<object>()
  let scanned = 0

  while (stack.length > 0) {
    const { value, depth } = stack.pop() as { value: unknown; depth: number }
    if (value === null || typeof value !== 'object' || depth > MAX_SCAN_DEPTH) {
      continue
    }
    if (seen.has(value as object)) {
      continue
    }
    seen.add(value as object)

    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (++scanned > MAX_SCANNED_KEYS) {
        return false
      }
      if (DANGEROUS_KEYS.has(key)) {
        return true
      }
      stack.push({ value: (value as Record<string, unknown>)[key], depth: depth + 1 })
    }
  }

  return false
}
