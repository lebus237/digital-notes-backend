import { test } from '@japa/runner'
import { unifiedMediaSchema } from '#validators/unified_media_schema'

test.group('unifiedMediaSchema', () => {
  test('should require file field', async ({ assert }) => {
    const data = {
      title: 'Some file',
    }

    try {
      await unifiedMediaSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })

  test('should reject missing file', async ({ assert }) => {
    const data = {
      title: 'Test',
      description: 'Test description',
    }

    try {
      await unifiedMediaSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })
})
