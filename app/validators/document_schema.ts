import vine from '@vinejs/vine'

export const documentSchema = vine.compile(
  vine.object({
    title: vine.string().optional(),
    description: vine.string().optional(),
    document: vine.file(),
  })
)
