import vine from '@vinejs/vine'
import { StoragePath } from '#shared/application/services/upload/storage_path'

export const uploadSchema = vine.compile(
  vine.object({
    title: vine.string().optional(),
    description: vine.string().optional(),
    storagePath: vine.enum(Object.values(StoragePath)).optional(),
    file: vine.file(),
  })
)
