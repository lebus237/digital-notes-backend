import vine from '@vinejs/vine'

export const registerSchema = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .normalizeEmail({ all_lowercase: true })
      .unique(async (db, value) => {
        const match = await db.from('users').select('id').where('email', value).first()

        return !match
      }),

    password: vine.string().minLength(8),
    fullName: vine.string(),
  })
)

export const loginSchema = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
  })
)
