import { test } from '@japa/runner'
import AuthController from '#controllers/authentication/auth_controller'

test.group('AuthController', () => {
  test('should have register method', ({ assert }) => {
    const controller = new AuthController()

    assert.property(controller, 'register')
    assert.typeOf(controller.register, 'function')
  })

  test('should have login method', ({ assert }) => {
    const controller = new AuthController()

    assert.property(controller, 'login')
    assert.typeOf(controller.login, 'function')
  })

  test('should have me method', ({ assert }) => {
    const controller = new AuthController()

    assert.property(controller, 'me')
    assert.typeOf(controller.me, 'function')
  })

  test('should have logout method', ({ assert }) => {
    const controller = new AuthController()

    assert.property(controller, 'logout')
    assert.typeOf(controller.logout, 'function')
  })
})
