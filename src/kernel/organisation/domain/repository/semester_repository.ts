import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Semester } from '#kernel/organisation/domain/entity/semester'
import { AppId } from '#shared/domain/app_id'

export interface SemesterRepository extends RepositoryInterface {
  save(semester: Semester): Promise<string | void>
  findById(id: AppId): Promise<Semester | null>
  delete(id: string): Promise<void>
}
