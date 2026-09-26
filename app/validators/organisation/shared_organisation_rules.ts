import vine from '@vinejs/vine'

export const sharedOrganisationRules = {
  slug: vine
    .string()
    .minLength(2)
    .maxLength(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: vine.string().minLength(2).maxLength(255),
  courseCode: vine.string().minLength(2).maxLength(20),
}
