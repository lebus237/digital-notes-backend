import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Course } from '#kernel/organisation/domain/entity/course'
import { AppId } from '#shared/domain/app_id'

export interface CourseRepository extends RepositoryInterface {
  save(course: Course): Promise<string | void>
  findById(id: AppId): Promise<Course | null>
  delete(id: string): Promise<void>
}
