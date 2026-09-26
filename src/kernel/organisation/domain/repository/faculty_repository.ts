import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Faculty } from '#kernel/organisation/domain/entity/faculty'
import { AppId } from '#shared/domain/app_id'

export interface FacultyRepository extends RepositoryInterface {
  save(faculty: Faculty): Promise<string | void>
  findById(id: AppId): Promise<Faculty | null>
  delete(id: string): Promise<void>
}
