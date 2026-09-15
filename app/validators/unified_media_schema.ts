import vine from '@vinejs/vine'

export const unifiedMediaSchema = vine.compile(
  vine.object({
    title: vine.string().optional(),
    description: vine.string().optional(),
    file: vine.file(),
  })
)
