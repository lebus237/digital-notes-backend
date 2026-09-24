import vine from '@vinejs/vine'

export const uploadSchema = vine.compile(
  vine.object({
    title: vine.string().optional(),
    description: vine.string().optional(),
    file: vine.file(),
  })
)
