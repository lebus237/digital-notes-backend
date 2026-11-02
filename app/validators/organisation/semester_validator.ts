import vine from '@vinejs/vine'
import { sharedOrganisationRules } from '#validators/organisation/shared_organisation_rules'

export const createSemesterSchema = vine.compile(
  vine.object({
    departmentId: vine.string().uuid(),
    name: sharedOrganisationRules.name,
  })
)

export const updateSemesterSchema = vine.compile(
  vine.object({
    departmentId: vine.string().uuid().optional(),
    name: sharedOrganisationRules.name.optional(),
  })
)
