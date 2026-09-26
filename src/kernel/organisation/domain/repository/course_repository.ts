import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Course } from '#kernel/organisation/domain/entity/course'

export interface CourseRepository extends RepositoryInterface {
  save(course: Course): Promise<string | void>
  findById(id: string): Promise<Course | null>
  delete(id: string): Promise<void>
}
