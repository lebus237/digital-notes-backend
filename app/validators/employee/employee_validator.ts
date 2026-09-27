import vine from '@vinejs/vine'
import { UserRole } from '#kernel/user/domain/types/user_role'

export const createEmployeeSchema = vine.compile(
  vine.object({
    universityId: vine.string().uuid(),
    fullName: vine.string(),
    email: vine.string().email().normalizeEmail({ all_lowercase: true }),
    phoneNumber: vine.string().maxLength(12),
    role: vine.enum(Object.values(UserRole)),
  })
)
