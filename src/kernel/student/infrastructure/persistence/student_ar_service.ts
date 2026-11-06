import { DateTime } from 'luxon'
import User from '#database/active-records/user'
import { NoteFavoriteRecord, NoteViewRecord } from '#database/active-records/index'
import {
  StudentProfileData,
  StudentService,
  UpdateStudentProfilePayload,
} from '#kernel/student/application/services/student_service'
import { ApplicationError } from '#shared/application/errors/application_error'
import { ErrorCategory } from '#shared/domain/errors/app_error'

export class StudentARService implements StudentService {
  async viewProfile(userId: string): Promise<StudentProfileData> {
    const user = await User.query()
      .where('id', userId)
      .preload('university')
      .preload('faculty')
      .preload('department')
      .preload('level')
      .preload('semester')
      .first()

    if (!user) {
      throw new ApplicationError(
        'STUDENT_PROFILE_NOT_FOUND',
        'Student profile not found',
        ErrorCategory.NOT_FOUND
      )
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt.toISO()!,
      universityId: user.universityId ?? null,
      universityName: user.university?.name ?? null,
      facultyId: user.facultyId ?? null,
      facultyName: user.faculty?.name ?? null,
      departmentId: user.departmentId ?? null,
      departmentName: user.department?.name ?? null,
      levelId: user.levelId ?? null,
      levelName: user.level?.name ?? null,
      semesterId: user.semesterId ?? null,
      semesterName: user.semester?.name ?? null,
    }
  }

  async updateProfile(
    userId: string,
    payload: UpdateStudentProfilePayload
  ): Promise<StudentProfileData> {
    const user = await User.find(userId)

    if (!user) {
      throw new ApplicationError(
        'STUDENT_PROFILE_NOT_FOUND',
        'Student profile not found',
        ErrorCategory.NOT_FOUND
      )
    }

    const fields: UpdateStudentProfilePayload = {
      universityId: payload.universityId,
      facultyId: payload.facultyId,
      departmentId: payload.departmentId,
      levelId: payload.levelId,
      semesterId: payload.semesterId,
    }

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        ;(user as any)[key] = value
      }
    }

    await user.save()

    return this.viewProfile(userId)
  }

  async favoriteIds(userId: string): Promise<string[]> {
    const rows = await NoteFavoriteRecord.query()
      .where('userId', userId)
      .orderBy('createdAt', 'desc')

    return rows.map((row) => row.noteId)
  }

  async addFavorite(userId: string, noteId: string): Promise<void> {
    const existing = await NoteFavoriteRecord.query()
      .where('userId', userId)
      .where('noteId', noteId)
      .first()

    if (!existing) {
      await NoteFavoriteRecord.create({ userId, noteId } as any)
    }
  }

  async removeFavorite(userId: string, noteId: string): Promise<void> {
    await NoteFavoriteRecord.query().where('userId', userId).where('noteId', noteId).delete()
  }

  async historyIds(userId: string, limit = 20): Promise<string[]> {
    const rows = await NoteViewRecord.query()
      .where('userId', userId)
      .orderBy('viewedAt', 'desc')
      .limit(limit)

    return rows.map((row) => row.noteId)
  }

  async recordView(userId: string, noteId: string): Promise<void> {
    const existing = await NoteViewRecord.query()
      .where('userId', userId)
      .where('noteId', noteId)
      .first()

    if (existing) {
      existing.viewedAt = DateTime.now()
      await existing.save()
      return
    }

    await NoteViewRecord.create({ userId, noteId, viewedAt: DateTime.now() } as any)
  }
}
