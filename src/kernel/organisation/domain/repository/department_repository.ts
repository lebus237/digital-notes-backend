import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Department } from '#kernel/organisation/domain/entity/department'

export interface DepartmentRepository extends RepositoryInterface {
  save(department: Department): Promise<string | void>
  findById(id: string): Promise<Department | null>
  delete(id: string): Promise<void>
}
