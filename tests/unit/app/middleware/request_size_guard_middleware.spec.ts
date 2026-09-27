import { test } from '@japa/runner'
import type { HttpContext } from '@adonisjs/core/http'
import RequestSizeGuardMiddleware from '#middleware/request_size_guard_middleware'

function captureContext(contentLength?: string) {
  const sent: { status?: number; body?: unknown } = {}
  const ctx = {
    request: {
      header(name: string) {
        return name === 'content-length' ? contentLength : undefined
      },
    },
    response: {
      status(code: number) {
        sent.status = code
        return {
          send(body: unknown) {
            sent.body = body
          },
        }
      },
    },
  } as unknown as HttpContext
  return { sent, ctx }
}

test.group('RequestSizeGuardMiddleware', () => {
  test('rejects bodies declaring more than the cap (default 2mb)', async ({ assert }) => {
    const middleware = new RequestSizeGuardMiddleware()
    const { sent, ctx } = captureContext(String(3 * 1024 * 1024))

    await middleware.handle(ctx, async () => assert.fail('next should not run'))

    assert.equal(sent.status, 413)
    assert.deepEqual(sent.body, {
      status: 'error',
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' },
    })
  })

  test('lets small and length-less bodies through to the parser', async ({ assert }) => {
    const middleware = new RequestSizeGuardMiddleware()

    for (const contentLength of ['1024', undefined]) {
      let called = false
      const { ctx } = captureContext(contentLength)
      await middleware.handle(ctx, async () => {
        called = true
      })
      assert.isTrue(called)
    }
  })
})
