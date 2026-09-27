import vine from '@vinejs/vine'
import { sharedOrganisationRules } from '#validators/organisation/shared_organisation_rules'

export const createCourseSchema = vine.compile(
  vine.object({
    departmentId: vine.string().uuid(),
    levelId: vine.string().uuid(),
    semesterId: vine.string().uuid(),
    code: sharedOrganisationRules.courseCode,
    name: sharedOrganisationRules.name,
    description: vine.string().optional(),
    lecturerName: vine.string().minLength(2).maxLength(255).optional(),
  })
)

export const updateCourseSchema = vine.compile(
  vine.object({
    code: sharedOrganisationRules.courseCode.optional(),
    name: sharedOrganisationRules.name.optional(),
    description: vine.string().nullable().optional(),
    lecturerName: vine.string().minLength(2).maxLength(255).nullable().optional(),
  })
)
