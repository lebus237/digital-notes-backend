import { FacultyRepository } from '#kernel/organisation/domain/repository/faculty_repository'
import { Faculty } from '#kernel/organisation/domain/entity/faculty'
import { default as FacultyRecord } from '#database/active-records/faculty'
import { AppId } from '#shared/domain/app_id'

export class FacultyARRepository implements FacultyRepository {
  async save(entity: Faculty): Promise<string | void> {
    const object = {
      universityId: entity.getUniversityId() as any,
      name: entity.getName(),
      slug: entity.getSlug(),
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    if (entity.getId()) {
      await FacultyRecord.updateOrCreate({ id: entity.getId() }, object)
      return Promise.resolve()
    }

    const result = await FacultyRecord.create(object)
    return result.id
  }

  async findById(id: string): Promise<Faculty | null> {
    const record = await FacultyRecord.find(id)
    if (!record) return null
    return new Faculty(new AppId(record.id), String(record.universityId), record.name, record.slug, record.createdAt as any, record.updatedAt as any)
  }

  async delete(id: string): Promise<void> {
    const record = await FacultyRecord.findOrFail(id)
    await record.delete()
  }
}
