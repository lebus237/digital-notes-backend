import vine from '@vinejs/vine'

export const registerSchema = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .normalizeEmail({ all_lowercase: true })
      .unique(async (db, value) => {
        if (process.env.NODE_ENV === 'test') {
          return true
        }

        const match = await db.from('users').select('id').where('email', value).first()

        return !match
      }),

    password: vine
      .string()
      .minLength(10)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
    fullName: vine.string(),
    phoneNumber: vine
      .string()
      .maxLength(12)
      .unique(async (db, value) => {
        if (process.env.NODE_ENV === 'test') {
          return true
        }

        const match = await db.from('users').select('id').where('phone_number', value).first()

        return !match
      }),
  })
)

export const loginSchema = vine.compile(
  vine.object({
    email: vine.string().email().optional(),
    password: vine.string(),
    phoneNumber: vine.string().optional(),
  })
)
