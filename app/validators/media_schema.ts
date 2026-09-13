import vine from '@vinejs/vine'

export const mediaSchema = vine.compile(
  vine.object({
    title: vine.string().optional(),
    alt: vine.string().optional(),
    image: vine.file(),
  })
)
