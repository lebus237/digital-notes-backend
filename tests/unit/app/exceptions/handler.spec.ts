import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import HttpExceptionHandler from '#exceptions/handler'
import { UploadNotFoundError } from '#kernel/uploads/domain/errors/upload_not_found_error'
import { UploadNotOwnedError } from '#kernel/uploads/domain/errors/upload_not_owned_error'
import { AppId } from '#shared/domain/app_id'
import { Note } from '#kernel/notes/domain/note'
import { NoteStatus, NoteType } from '#kernel/notes/domain/note'

class ProbeHandler extends HttpExceptionHandler {
  isDebug() {
    return this.debug
  }
}

function captureContext() {
  const sent: { status?: number; body?: unknown } = {}
  const logs: { level: string; args: unknown[] }[] = []
  const ctx = {
    logger: {
      error(...args: unknown[]) {
        logs.push({ level: 'error', args })
      },
      warn(...args: unknown[]) {
        logs.push({ level: 'warn', args })
      },
      info(...args: unknown[]) {
        logs.push({ level: 'info', args })
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

  return { sent, logs, ctx }
}

function draftNote() {
  return new Note(
    null,
    'course-id',
    'title',
    null,
    'file-key',
    100,
    'application/pdf',
    NoteType.SUMMARY,
    0,
    NoteStatus.DRAFT,
    null,
    null,
    null,
    null
  )
}

test.group('HttpExceptionHandler', () => {
  test('enables debug only in development', ({ assert }) => {
    const handler = new ProbeHandler()

    assert.equal(handler.isDebug(), app.inDev)
  })

  test('returns the domain 404 message and details', async ({ assert }) => {
    const handler = new HttpExceptionHandler()
    const { sent, ctx } = captureContext()

    await handler.handle(new UploadNotFoundError('media-id'), ctx)

    assert.equal(sent.status, 404)
    assert.deepEqual(sent.body, {
      status: 'error',
      error: {
        code: 'MEDIA_NOT_FOUND',
        message: 'Media not found',
        details: { uploadId: 'media-id' },
      },
    })
  })

  test('maps ownership failures to forbidden', async ({ assert }) => {
    const handler = new HttpExceptionHandler()
    const { sent, ctx } = captureContext()

    await handler.handle(new UploadNotOwnedError(), ctx)

    assert.equal(sent.status, 403)
    assert.equal(
      (sent.body as { error: { code: string } }).error.code,
      'MEDIA_NOT_OWNED'
    )
  })

  test('maps invalid status transitions to conflict with the domain message', async ({
    assert,
  }) => {
    const handler = new HttpExceptionHandler()
    const { sent, ctx } = captureContext()

    try {
      draftNote().publish()
      assert.fail('Expected publish to throw')
    } catch (error) {
      await handler.handle(error, ctx)
    }

    assert.equal(sent.status, 409)
    assert.deepEqual(sent.body, {
      status: 'error',
      error: {
        code: 'NOTE_STATUS_TRANSITION_INVALID',
        message: 'Cannot publish note in status DRAFT',
      },
    })
  })

  test('maps invalid UUIDs to validation errors instead of 500', async ({ assert }) => {
    const handler = new HttpExceptionHandler()
    const { sent, ctx } = captureContext()

    try {
      AppId.fromString('not-a-uuid')
      assert.fail('Expected fromString to throw')
    } catch (error) {
      await handler.handle(error, ctx)
    }

    assert.equal(sent.status, 422)
    assert.equal(
      (sent.body as { error: { code: string } }).error.code,
      'INVALID_UUID_FORMAT_STRING'
    )
  })

  test('warns on expected client errors without sending a response', async ({ assert }) => {
    const handler = new HttpExceptionHandler()
    const { sent, logs, ctx } = captureContext()

    await handler.report(new UploadNotFoundError('media-id'), ctx)

    assert.isUndefined(sent.status)
    assert.equal(logs.length, 1)
    assert.equal(logs[0].level, 'warn')
  })
})
