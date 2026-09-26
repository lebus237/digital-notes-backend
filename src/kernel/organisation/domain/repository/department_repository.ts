import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Department } from '#kernel/organisation/domain/entity/department'
import { AppId } from '#shared/domain/app_id'

export interface DepartmentRepository extends RepositoryInterface {
  save(department: Department): Promise<string | void>
  findById(id: AppId): Promise<Department | null>
  delete(id: string): Promise<void>
}
