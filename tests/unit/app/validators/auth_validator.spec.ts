import { test } from '@japa/runner'
import { registerSchema, loginSchema } from '#validators/auth_validator'

test.group('registerSchema', () => {
  test('should validate valid registration data', async ({ assert }) => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'John Doe',
    }

    const result = await registerSchema.validate(data)

    assert.equal(result.email, 'test@example.com')
    assert.equal(result.password, 'password123')
    assert.equal(result.fullName, 'John Doe')
  })

  test('should normalize email to lowercase', async ({ assert }) => {
    const data = {
      email: 'TEST@EXAMPLE.COM',
      password: 'password123',
      fullName: 'John Doe',
    }

    const result = await registerSchema.validate(data)

    assert.equal(result.email, 'test@example.com')
  })

  test('should reject invalid email format', async ({ assert }) => {
    const data = {
      email: 'invalid-email',
      password: 'password123',
      fullName: 'John Doe',
    }

    try {
      await registerSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })

  test('should reject password shorter than 8 characters', async ({ assert }) => {
    const data = {
      email: 'test@example.com',
      password: 'short',
      fullName: 'John Doe',
    }

    try {
      await registerSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })

  test('should reject missing fullName', async ({ assert }) => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
    }

    try {
      await registerSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })

  test('should reject missing email', async ({ assert }) => {
    const data = {
      password: 'password123',
      fullName: 'John Doe',
    }

    try {
      await registerSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })

  test('should reject missing password', async ({ assert }) => {
    const data = {
      email: 'test@example.com',
      fullName: 'John Doe',
    }

    try {
      await registerSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })
})

test.group('loginSchema', () => {
  test('should validate valid login data', async ({ assert }) => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
    }

    const result = await loginSchema.validate(data)

    assert.equal(result.email, 'test@example.com')
    assert.equal(result.password, 'password123')
  })

  test('should reject invalid email format', async ({ assert }) => {
    const data = {
      email: 'invalid-email',
      password: 'password123',
    }

    try {
      await loginSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })

  test('should reject missing email', async ({ assert }) => {
    const data = {
      password: 'password123',
    }

    try {
      await loginSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })

  test('should reject missing password', async ({ assert }) => {
    const data = {
      email: 'test@example.com',
    }

    try {
      await loginSchema.validate(data)
      assert.fail('Should have thrown validation error')
    } catch (error) {
      assert.instanceOf(error, Error)
    }
  })

  test('should accept any non-empty password', async ({ assert }) => {
    const data = {
      email: 'test@example.com',
      password: 'x',
    }

    const result = await loginSchema.validate(data)

    assert.equal(result.password, 'x')
  })
})
