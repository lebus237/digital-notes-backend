import { UniversityRepository } from '#kernel/organisation/domain/repository/university_repository'
import { University } from '#kernel/organisation/domain/entity/university'
import { default as UniversityRecord } from '#database/active-records/university'
import { AppId } from '#shared/domain/app_id'

export class UniversityARRepository implements UniversityRepository {
  async save(entity: University): Promise<string | void> {
    const object = {
      name: entity.getName(),
      slug: entity.getSlug(),
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    if (entity.getId()) {
      await UniversityRecord.updateOrCreate({ id: entity.getId() }, object)
      return Promise.resolve()
    }

    const result = await UniversityRecord.create(object)
    return result.id
  }

  async findById(id: AppId): Promise<University | null> {
    const record = await UniversityRecord.find(id.value)
    if (!record) return null
    return new University(
      new AppId(record.id),
      record.name,
      record.slug,
      record.createdAt as any,
      record.updatedAt as any
    )
  }

  async delete(id: string): Promise<void> {
    const record = await UniversityRecord.findOrFail(id)
    await record.delete()
  }
}
