import vine from '@vinejs/vine'
import { NoteType } from '#kernel/organisation/domain/types/index'

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

export const updateNoteSchema = vine.compile(
  vine.object({
    title: vine.string().minLength(2).maxLength(255).optional(),
    description: vine.string().nullable().optional(),
    price: vine.number().min(0).optional(),
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
