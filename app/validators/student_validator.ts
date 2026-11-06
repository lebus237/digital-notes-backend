import vine from '@vinejs/vine'

const nullableId = vine.string().uuid().nullable().optional()

export const updateStudentProfileSchema = vine.compile(
  vine.object({
    universityId: nullableId,
    facultyId: nullableId,
    departmentId: nullableId,
    levelId: nullableId,
    semesterId: nullableId,
  })
)
