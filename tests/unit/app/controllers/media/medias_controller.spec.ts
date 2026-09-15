import { test } from '@japa/runner'
import MediasController from '#controllers/media/medias_controller'

test.group('MediasController', () => {
  test('should have index method', ({ assert }) => {
    const controller = new MediasController()

    assert.property(controller, 'index')
    assert.typeOf(controller.index, 'function')
  })

  test('should have store method', ({ assert }) => {
    const controller = new MediasController()

    assert.property(controller, 'store')
    assert.typeOf(controller.store, 'function')
  })

  test('should have destroy method', ({ assert }) => {
    const controller = new MediasController()

    assert.property(controller, 'destroy')
    assert.typeOf(controller.destroy, 'function')
  })
})
