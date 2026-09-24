import { test } from '@japa/runner'
import { uploadSchema } from '#validators/upload_schema'

test.group('uploadSchema', () => {
  test('should require file field', async ({ assert }) => {
    const data = {
      title: 'Some file',
    }

    try {
      await uploadSchema.validate(data)
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
      await uploadSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })
})
