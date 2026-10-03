import vine from '@vinejs/vine'
import { NoteType } from '#kernel/organisation/domain/types/index'

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

export const createNoteSchema = vine.compile(
  vine.object({
    courseId: vine.string().uuid(),
    title: vine.string().minLength(2).maxLength(255),
    description: vine.string().optional(),
    noteType: vine.enum(Object.values(NoteType)).optional(),
    price: vine.number().min(0).optional(),
    providedAt: vine.date().optional(),
  })
)

export const createNoteFilesSchema = vine.compile(
  vine.object({
    pages: vine
      .array(vine.file({ size: '10mb', extnames: ALLOWED_EXTNAMES }).optional())
      .minLength(1),
  })
)

export const updateNoteMetadataSchema = vine.compile(
  vine.object({
    title: vine.string().minLength(2).maxLength(255),
    description: vine.string().nullable().optional(),
    price: vine.number().min(0),
  })
)

export const listNotesSchema = vine.compile(
  vine.object({
    noteType: vine.enum(Object.values(NoteType)).optional(),
    search: vine.string().optional(),
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
  })
)
