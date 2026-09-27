import { test } from '@japa/runner'
import type { HttpContext } from '@adonisjs/core/http'
import BodyGuardMiddleware from '#middleware/body_guard_middleware'

function captureContext(body: unknown) {
  const sent: { status?: number; body?: unknown } = {}
  const logs: { level: string; args: unknown[] }[] = []
  const ctx = {
    request: {
      body() {
        return body
      },
    },
    logger: {
      error(...args: unknown[]) {
        logs.push({ level: 'error', args })
      },
    },
    response: {
      status(code: number) {
        sent.status = code
        return {
          send(responseBody: unknown) {
            sent.body = responseBody
          },
        }
      },
    },
  } as unknown as HttpContext
  return { sent, logs, ctx }
}

test.group('BodyGuardMiddleware', () => {
  test('lets clean bodies through', async ({ assert }) => {
    const middleware = new BodyGuardMiddleware()
    const { ctx } = captureContext({ title: 'hello', nested: { count: 1 } })
    let called = false

    await middleware.handle(ctx, async () => {
      called = true
    })

    assert.isTrue(called)
  })

  test('rejects nested __proto__ keys', async ({ assert }) => {
    const middleware = new BodyGuardMiddleware()
    const { sent, ctx } = captureContext({ user: JSON.parse('{"__proto__":{"polluted":true}}') })

    await middleware.handle(ctx, async () => assert.fail('next should not run'))

    assert.equal(sent.status, 400)
    assert.deepEqual(sent.body, {
      status: 'error',
      error: { code: 'MALFORMED_BODY', message: 'Invalid request body' },
    })
  })

  test('detects a polluted Object.prototype and recovers after cleanup', async ({
    assert,
  }) => {
    const middleware = new BodyGuardMiddleware()
    // Establish the baseline with a clean prototype first.
    const clean = captureContext({ ok: true })
    await middleware.handle(clean.ctx, async () => {})

    // Simulate pollution, then guarantee cleanup even on failure.
    ;(Object.prototype as Record<string, unknown>).polluted_probe_xyz = true
    try {
      const { sent, logs, ctx } = captureContext({ ok: true })
      await middleware.handle(ctx, async () => assert.fail('next should not run'))

      assert.equal(sent.status, 400)
      assert.equal(logs.length, 1)
      assert.equal(logs[0].level, 'error')
    } finally {
      delete (Object.prototype as Record<string, unknown>).polluted_probe_xyz
    }

    // Clean again: requests flow normally after the pollution is removed.
    let called = false
    const after = captureContext({ ok: true })
    await middleware.handle(after.ctx, async () => {
      called = true
    })
    assert.isTrue(called)
  })
})
