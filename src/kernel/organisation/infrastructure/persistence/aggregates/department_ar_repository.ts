import { DepartmentRepository } from '#kernel/organisation/domain/repository/department_repository'
import { Department } from '#kernel/organisation/domain/entity/department'
import { default as DepartmentRecord } from '#database/active-records/department'
import { AppId } from '#shared/domain/app_id'

export class DepartmentARRepository implements DepartmentRepository {
  async save(entity: Department): Promise<string | void> {
    const object = {
      facultyId: entity.getFacultyId() as any,
      name: entity.getName(),
      slug: entity.getSlug(),
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    if (entity.getId()) {
      await DepartmentRecord.updateOrCreate({ id: entity.getId() }, object)
      return Promise.resolve()
    }

    const result = await DepartmentRecord.create(object)
    return result.id
  }

  async findById(id: AppId): Promise<Department | null> {
    const record = await DepartmentRecord.find(id.value)
    if (!record) return null
    return new Department(
      new AppId(record.id),
      String(record.facultyId),
      record.name,
      record.slug,
      record.createdAt as any,
      record.updatedAt as any
    )
  }

  async delete(id: string): Promise<void> {
    const record = await DepartmentRecord.findOrFail(id)
    await record.delete()
  }
}
