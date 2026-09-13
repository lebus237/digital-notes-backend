import { test } from '@japa/runner'
import { mediaSchema } from '#validators/media_schema'

test.group('mediaSchema', () => {
  test('should require image field', async ({ assert }) => {
    const data = {
      title: 'Product Image',
    }

    try {
      await mediaSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })

  test('should reject missing image file', async ({ assert }) => {
    const data = {
      title: 'Test',
      alt: 'Test alt',
    }

    try {
      await mediaSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })
})
