import { SemesterRepository } from '#kernel/organisation/domain/repository/semester_repository'
import { Semester } from '#kernel/organisation/domain/entity/semester'
import { default as SemesterRecord } from '#database/active-records/semester'
import { AppId } from '#shared/domain/app_id'

export class SemesterARRepository implements SemesterRepository {
  async save(entity: Semester): Promise<string | void> {
    const object = {
      name: entity.getName(),
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    if (entity.getId()) {
      await SemesterRecord.updateOrCreate({ id: entity.getId() }, object)
      return Promise.resolve()
    }

    const result = await SemesterRecord.create(object)
    return result.id
  }

  async findById(id: string): Promise<Semester | null> {
    const record = await SemesterRecord.find(id)
    if (!record) return null
    return new Semester(new AppId(record.id), record.name, record.createdAt as any, record.updatedAt as any)
  }

  async delete(id: string): Promise<void> {
    const record = await SemesterRecord.findOrFail(id)
    await record.delete()
  }
}
