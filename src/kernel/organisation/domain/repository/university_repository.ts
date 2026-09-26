import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { University } from '#kernel/organisation/domain/entity/university'

export interface UniversityRepository extends RepositoryInterface {
  save(university: University): Promise<string | void>
  findById(id: string): Promise<University | null>
  delete(id: string): Promise<void>
}
