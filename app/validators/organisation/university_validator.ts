import vine from '@vinejs/vine'
import { sharedOrganisationRules } from '#validators/organisation/shared_organisation_rules'

export const createUniversitySchema = vine.compile(
  vine.object({
    name: sharedOrganisationRules.name,
    slug: sharedOrganisationRules.slug,
  })
)
