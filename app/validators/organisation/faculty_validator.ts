import vine from '@vinejs/vine'
import { sharedOrganisationRules } from '#validators/organisation/shared_organisation_rules'

export const createFacultySchema = vine.compile(
  vine.object({
    universityId: vine.string().uuid(),
    name: sharedOrganisationRules.name,
    slug: sharedOrganisationRules.slug,
  })
)
