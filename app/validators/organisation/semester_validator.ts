import vine from '@vinejs/vine'
import { sharedOrganisationRules } from '#validators/organisation/shared_organisation_rules'

export const createSemesterSchema = vine.compile(
  vine.object({
    name: sharedOrganisationRules.name,
  })
)
