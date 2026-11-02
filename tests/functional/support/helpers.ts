import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import type { ApiClient } from '@japa/api-client'
import User from '#database/active-records/user'
import {
  CourseRecord,
  DepartmentRecord,
  FacultyRecord,
  LevelRecord,
  NotePageRecord,
  NoteRecord,
  SemesterRecord,
  UniversityRecord,
  UploadRecord,
} from '#database/active-records/index'
import { NoteStatus, NoteType } from '#kernel/organisation/domain/types/index'
import { UserRole } from '#kernel/user/domain/types/user_role'

export const DEFAULT_PASSWORD = 'Password123'

/** A valid 1x1 PNG so `file-type` magic-byte sniffing recognises the upload. */
export const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

let phoneSequence = 0

export function uniquePhoneNumber(): string {
  phoneSequence += 1
  return `07${String(phoneSequence).padStart(8, '0')}`
}

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}-${crypto.randomUUID()}@example.com`
}

type UserOverrides = {
  fullName?: string
  email?: string
  phoneNumber?: string
  password?: string
  role?: UserRole
}

export async function createUser(overrides: UserOverrides = {}): Promise<User> {
  return User.create({
    fullName: overrides.fullName ?? 'Test User',
    email: overrides.email ?? uniqueEmail(),
    phoneNumber: overrides.phoneNumber ?? uniquePhoneNumber(),
    password: overrides.password ?? DEFAULT_PASSWORD,
    role: overrides.role ?? UserRole.STUDENT,
  })
}

export async function loginAs(
  client: ApiClient,
  user: User,
  password = DEFAULT_PASSWORD
): Promise<string> {
  const response = await client.post('/api/login').json({ email: user.email, password })
  response.assertStatus(200)

  return response.body().data.accessToken as string
}

export async function createAdmin(): Promise<User> {
  return createUser({ role: UserRole.ADMINISTRATOR, fullName: 'Admin User' })
}

export async function createContributor(): Promise<User> {
  return createUser({ role: UserRole.CONTRIBUTOR, fullName: 'Contributor User' })
}

export type AcademicStructure = {
  university: UniversityRecord
  faculty: FacultyRecord
  department: DepartmentRecord
  level: LevelRecord
  semester: SemesterRecord
  course: CourseRecord
}

/**
 * Seeds one complete university -> course branch. Values are suffixed so
 * tests never collide on unique columns even without truncation.
 */
export async function seedAcademicStructure(levelYear: number = 1): Promise<AcademicStructure> {
  const suffix = crypto.randomUUID().slice(0, 8)

  const university = await UniversityRecord.create({
    name: `University ${suffix}`,
    slug: `university-${suffix}`,
  })

  const faculty = await FacultyRecord.create({
    universityId: university.id,
    name: `Faculty ${suffix}`,
    slug: `faculty-${suffix}`,
  })

  const department = await DepartmentRecord.create({
    facultyId: faculty.id,
    name: `Department ${suffix}`,
    slug: `department-${suffix}`,
  })

  const level = await LevelRecord.create({
    departmentId: department.id,
    name: `Level ${suffix}`,
    year: levelYear,
  })

  const semester = await SemesterRecord.create({
    departmentId: department.id,
    name: `Semester ${suffix}`,
  })

  const course = await CourseRecord.create({
    departmentId: department.id,
    levelId: level.id,
    semesterId: semester.id,
    code: `C${suffix}`,
    name: `Course ${suffix}`,
    description: null,
    lecturerName: null,
    isArchived: false,
  })

  return { university, faculty, department, level, semester, course }
}

type SeedNoteOptions = {
  courseId: string
  uploadedBy: string
  title?: string
  status?: NoteStatus
  noteType?: NoteType
  price?: number
  publishedAt?: DateTime | null
}

export async function seedNote(options: SeedNoteOptions): Promise<NoteRecord> {
  return NoteRecord.create({
    courseId: options.courseId as any,
    title: options.title ?? 'Seeded note',
    description: null,
    noteType: options.noteType ?? NoteType.LECTURE_NOTES,
    price: options.price ?? 0,
    status: options.status ?? NoteStatus.DRAFT,
    uploadedBy: options.uploadedBy as any,
    providedAt: DateTime.utc(),
    publishedAt: options.publishedAt ?? null,
    archivedAt: null,
  })
}

export async function seedNotePage(
  noteId: string,
  sortOrder: number,
  createdBy: string
): Promise<UploadRecord> {
  const key = `raw-notes/${crypto.randomUUID()}.png`

  const upload = await UploadRecord.create({
    type: 'image',
    title: `page-${sortOrder}.png`,
    description: null,
    url: `https://storage.test/${key}`,
    mimeType: 'image/png',
    size: ONE_PIXEL_PNG.length,
    metadata: { originalName: 'page.png' },
    relativeKey: key,
    createdBy,
  })

  await NotePageRecord.create({
    noteId: noteId as any,
    uploadId: upload.id,
    sortOrder,
  })

  return upload
}
