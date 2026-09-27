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

  test('should have forgotPassword method', ({ assert }) => {
    const controller = new AuthController()

    assert.property(controller, 'forgotPassword')
    assert.typeOf(controller.forgotPassword, 'function')
  })

  test('should have resetPassword method', ({ assert }) => {
    const controller = new AuthController()

    assert.property(controller, 'resetPassword')
    assert.typeOf(controller.resetPassword, 'function')
  })

  test('should have changePassword method', ({ assert }) => {
    const controller = new AuthController()

    assert.property(controller, 'changePassword')
    assert.typeOf(controller.changePassword, 'function')
  })

  test('should have adminResetPassword method', ({ assert }) => {
    const controller = new AuthController()

    assert.property(controller, 'adminResetPassword')
    assert.typeOf(controller.adminResetPassword, 'function')
  })
})
