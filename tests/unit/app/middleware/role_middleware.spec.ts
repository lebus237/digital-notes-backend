import { test } from '@japa/runner'
import type { HttpContext } from '@adonisjs/core/http'
import RoleMiddleware from '#middleware/role_middleware'
import { UserRole } from '#kernel/user/domain/types/user_role'

test.group('RoleMiddleware', () => {
  test('rejects a user whose role is not allowed', async ({ assert }) => {
    const middleware = new RoleMiddleware()
    let forbiddenBody: unknown
    const ctx = {
      auth: { user: { role: UserRole.STUDENT } },
      response: {
        forbidden(body: unknown) {
          forbiddenBody = body
          return body
        },
      },
    } as unknown as HttpContext

    await middleware.handle(ctx, async () => assert.fail('next should not run'), {
      roles: [UserRole.ADMINISTRATOR],
    })

    assert.deepEqual(forbiddenBody, {
      status: 'error',
      error: { code: 'FORBIDDEN', message: 'Forbidden' },
    })
  })

  test('allows an administrator through', async ({ assert }) => {
    const middleware = new RoleMiddleware()
    let called = false
    const ctx = {
      auth: { user: { role: UserRole.ADMINISTRATOR } },
      response: { forbidden() {} },
    } as unknown as HttpContext

    await middleware.handle(
      ctx,
      async () => {
        called = true
      },
      { roles: [UserRole.ADMINISTRATOR] }
    )

    assert.isTrue(called)
  })
})
