import vine from '@vinejs/vine'
import { StoragePath } from '#shared/application/services/upload/storage_path'

const ALLOWED_EXTNAMES = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'txt',
]

export const uploadSchema = vine.compile(
  vine.object({
    title: vine.string().optional(),
    description: vine.string().optional(),
    storagePath: vine.enum(Object.values(StoragePath)).optional(),
    file: vine.file({ size: '10mb', extnames: ALLOWED_EXTNAMES }),
  })
)
