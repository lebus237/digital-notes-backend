import { test } from '@japa/runner'
import UploadController from '#controllers/uploads/upload_controller'

test.group('UploadController', () => {
  test('should have index method', ({ assert }) => {
    const controller = new UploadController()

    assert.property(controller, 'index')
    assert.typeOf(controller.index, 'function')
  })

  test('should have store method', ({ assert }) => {
    const controller = new UploadController()

    assert.property(controller, 'store')
    assert.typeOf(controller.store, 'function')
  })

  test('should have destroy method', ({ assert }) => {
    const controller = new UploadController()

    assert.property(controller, 'destroy')
    assert.typeOf(controller.destroy, 'function')
  })
})
