import { EmployeeRepository } from '#kernel/employee/domain/repository/employee_repository'
import { Employee } from '#kernel/employee/domain/entity/employee'
import { default as EmployeeRecord } from '#database/active-records/employee'
import { AppId } from '#shared/domain/app_id'

export class EmployeeARRepository implements EmployeeRepository {
  async save(entity: Employee): Promise<string | void> {
    const object = {
      universityId: entity.getUniversityId() as any,
      userId: entity.getUserId() as any,
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    if (entity.getId()) {
      await EmployeeRecord.updateOrCreate({ id: entity.getId() }, object)
      return Promise.resolve()
    }

    const result = await EmployeeRecord.create(object)
    return result.id
  }

  async findById(id: AppId): Promise<Employee | null> {
    const record = await EmployeeRecord.find(id.value)
    if (!record) return null
    return new Employee(
      new AppId(record.id),
      String(record.universityId),
      String(record.userId),
      record.createdAt as any,
      record.updatedAt as any
    )
  }

  async delete(id: string): Promise<void> {
    const record = await EmployeeRecord.findOrFail(id)
    await record.delete()
  }
}
