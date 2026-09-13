import AuthMiddleware from '#middleware/auth_middleware'
import { test } from '@japa/runner'

test.group('AuthMiddleware', () => {
  test('should have redirectTo property set to /login', ({ assert }) => {
    const middleware = new AuthMiddleware()

    assert.equal(middleware.redirectTo, '/login')
  })

  test('should be a class with handle method', ({ assert }) => {
    const middleware = new AuthMiddleware()

    assert.property(middleware, 'handle')
    assert.typeOf(middleware.handle, 'function')
  })

  test('handle method should accept ctx, next, and options parameters', ({ assert }) => {
    const middleware = new AuthMiddleware()

    // Verify the handle method signature - options has default value so reported as 2
    assert.equal(middleware.handle.length, 2)
  })

  test('should have redirectTo as instance property', ({ assert }) => {
    const middleware1 = new AuthMiddleware()
    const middleware2 = new AuthMiddleware()

    // Each instance should have its own redirectTo
    assert.equal(middleware1.redirectTo, '/login')
    assert.equal(middleware2.redirectTo, '/login')
  })
})
