import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import HttpExceptionHandler from '#exceptions/handler'
import { MediaNotFoundError } from '#kernel/medias/domain/errors/media_not_found_error'
import { MediaNotOwnedError } from '#kernel/medias/domain/errors/media_not_owned_error'
import { ApplicationError } from '#shared/application/errors/application_error'

class ProbeHandler extends HttpExceptionHandler {
  isDebug() {
    return this.debug
  }
}

function captureContext() {
  const sent: { status?: number; body?: unknown } = {}
  const ctx = {
    logger: { error() {} },
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

test.group('HttpExceptionHandler', () => {
  test('enables debug only in development', ({ assert }) => {
    const handler = new ProbeHandler()

    assert.equal(handler.isDebug(), app.inDev)
  })

  test('returns a generic 404 without the record id', async ({ assert }) => {
    const handler = new HttpExceptionHandler()
    const { sent, ctx } = captureContext()

    await handler.handle(new MediaNotFoundError('secret-media-id'), ctx)

    assert.equal(sent.status, 404)
    assert.deepEqual(sent.body, {
      status: 'error',
      error: { code: 'MEDIA_NOT_FOUND', message: 'Resource not found' },
    })
    assert.notInclude(JSON.stringify(sent.body), 'secret-media-id')
  })

  test('hides ownership failures as not found', async ({ assert }) => {
    const handler = new HttpExceptionHandler()
    const { sent, ctx } = captureContext()

    await handler.handle(new MediaNotOwnedError(), ctx)

    assert.equal(sent.status, 404)
    assert.equal((sent.body as { error: { code: string } }).error.code, 'MEDIA_NOT_OWNED')
  })

  test('maps unknown application errors to a generic 500', async ({ assert }) => {
    const handler = new HttpExceptionHandler()
    const { sent, ctx } = captureContext()

    await handler.handle(
      new ApplicationError(
        'HANDLER_NOT_REGISTERED',
        'No handler registered for command: StoreMediaCommand',
        {
          name: 'StoreMediaCommand',
        }
      ),
      ctx
    )

    assert.equal(sent.status, 500)
    assert.deepEqual(sent.body, {
      status: 'error',
      error: { code: 'HANDLER_NOT_REGISTERED', message: 'Internal server error' },
    })
    assert.notInclude(JSON.stringify(sent.body), 'StoreMediaCommand')
  })
})
