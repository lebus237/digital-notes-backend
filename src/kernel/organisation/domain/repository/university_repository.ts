import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { University } from '#kernel/organisation/domain/entity/university'
import { AppId } from '#shared/domain/app_id'

export interface UniversityRepository extends RepositoryInterface {
  save(university: University): Promise<string | void>
  findById(id: AppId): Promise<University | null>
  delete(id: string): Promise<void>
}
