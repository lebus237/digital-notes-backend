import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Employee } from '#kernel/employee/domain/entity/employee'
import { AppId } from '#shared/domain/app_id'

export interface EmployeeRepository extends RepositoryInterface {
  save(employee: Employee): Promise<string | void>
  findById(id: AppId): Promise<Employee | null>
  delete(id: string): Promise<void>
}
