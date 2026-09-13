import { test } from '@japa/runner'
import ImageMediasController from '#controllers/media/image_medias_controller'

test.group('ImageMediasController', () => {
  test('should have index method', ({ assert }) => {
    const controller = new ImageMediasController()

    assert.property(controller, 'index')
    assert.typeOf(controller.index, 'function')
  })

  test('should have store method', ({ assert }) => {
    const controller = new ImageMediasController()

    assert.property(controller, 'store')
    assert.typeOf(controller.store, 'function')
  })

  test('should have destroy method', ({ assert }) => {
    const controller = new ImageMediasController()

    assert.property(controller, 'destroy')
    assert.typeOf(controller.destroy, 'function')
  })
})
