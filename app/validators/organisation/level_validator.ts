import vine from '@vinejs/vine'
import { sharedOrganisationRules } from '#validators/organisation/shared_organisation_rules'

export const createLevelSchema = vine.compile(
  vine.object({
    departmentId: vine.string().uuid(),
    name: sharedOrganisationRules.name,
  })
)
