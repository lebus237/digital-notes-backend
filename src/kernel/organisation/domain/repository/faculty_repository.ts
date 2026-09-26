import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Faculty } from '#kernel/organisation/domain/entity/faculty'

export interface FacultyRepository extends RepositoryInterface {
  save(faculty: Faculty): Promise<string | void>
  findById(id: string): Promise<Faculty | null>
  delete(id: string): Promise<void>
}
