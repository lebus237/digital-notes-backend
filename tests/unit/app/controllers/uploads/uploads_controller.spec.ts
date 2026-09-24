import { test } from '@japa/runner'
import UploadsController from '#controllers/uploads/uploads_controller'

test.group('UploadsController', () => {
  test('should have index method', ({ assert }) => {
    const controller = new UploadsController()

    assert.property(controller, 'index')
    assert.typeOf(controller.index, 'function')
  })

  test('should have store method', ({ assert }) => {
    const controller = new UploadsController()

    assert.property(controller, 'store')
    assert.typeOf(controller.store, 'function')
  })

  test('should have destroy method', ({ assert }) => {
    const controller = new UploadsController()

    assert.property(controller, 'destroy')
    assert.typeOf(controller.destroy, 'function')
  })
})
