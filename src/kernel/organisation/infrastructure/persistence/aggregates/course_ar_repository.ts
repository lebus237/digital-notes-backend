import { CourseRepository } from '#kernel/organisation/domain/repository/course_repository'
import { Course } from '#kernel/organisation/domain/entity/course'
import { default as CourseRecord } from '#database/active-records/course'
import { AppId } from '#shared/domain/app_id'

export class CourseARRepository implements CourseRepository {
  async save(entity: Course): Promise<string | void> {
    const object = {
      departmentId: entity.getDepartmentId() as any,
      levelId: entity.getLevelId() as any,
      semesterId: entity.getSemesterId() as any,
      code: entity.getCode(),
      name: entity.getName(),
      description: entity.getDescription(),
      isArchived: entity.getIsArchived(),
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    if (entity.getId()) {
      await CourseRecord.updateOrCreate({ id: entity.getId() }, object)
      return Promise.resolve()
    }

    const result = await CourseRecord.create(object)
    return result.id
  }

  async findById(id: AppId): Promise<Course | null> {
    const record = await CourseRecord.find(id.value)
    if (!record) return null
    return new Course(
      new AppId(record.id),
      String(record.departmentId),
      String(record.levelId),
      String(record.semesterId),
      record.code,
      record.name,
      record.description,
      record.isArchived,
      record.createdAt as any,
      record.updatedAt as any
    )
  }

  async delete(id: string): Promise<void> {
    const record = await CourseRecord.findOrFail(id)
    await record.delete()
  }
}
