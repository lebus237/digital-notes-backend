import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Semester } from '#kernel/organisation/domain/entity/semester'

export interface SemesterRepository extends RepositoryInterface {
  save(semester: Semester): Promise<string | void>
  findById(id: string): Promise<Semester | null>
  delete(id: string): Promise<void>
}
