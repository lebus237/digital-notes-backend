import vine from '@vinejs/vine'

export const sharedOrganisationRules = {
  name: vine.string().minLength(2).maxLength(255),
  courseCode: vine.string().minLength(2).maxLength(20),
}
