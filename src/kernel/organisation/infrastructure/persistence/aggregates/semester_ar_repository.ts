import { SemesterRepository } from '#kernel/organisation/domain/repository/semester_repository'
import { Semester } from '#kernel/organisation/domain/entity/semester'
import { default as SemesterRecord } from '#database/active-records/semester'
import { AppId } from '#shared/domain/app_id'
import { SemesterAlreadyExistsError } from '#kernel/organisation/domain/errors/semester_already_exists_error'

function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

export class SemesterARRepository implements SemesterRepository {
  async save(entity: Semester): Promise<string | void> {
    const object = {
      departmentId: entity.getDepartmentId() as any,
      name: entity.getName(),
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    try {
      if (entity.getId()) {
        await SemesterRecord.updateOrCreate({ id: entity.getId() }, object)
        return Promise.resolve()
      }

      const result = await SemesterRecord.create(object)
      return result.id
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new SemesterAlreadyExistsError()
      }
      throw error
    }
  }

  async findById(id: AppId): Promise<Semester | null> {
    const record = await SemesterRecord.find(id.value)
    if (!record) return null
    return new Semester(
      new AppId(record.id),
      String(record.departmentId),
      record.name,
      record.createdAt as any,
      record.updatedAt as any
    )
  }

  async delete(id: string): Promise<void> {
    const record = await SemesterRecord.findOrFail(id)
    await record.delete()
  }
}
