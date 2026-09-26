import vine from '@vinejs/vine'
import { sharedOrganisationRules } from '#validators/organisation/shared_organisation_rules'

export const createDepartmentSchema = vine.compile(
  vine.object({
    facultyId: vine.string().uuid(),
    name: sharedOrganisationRules.name,
    slug: sharedOrganisationRules.slug,
  })
)
