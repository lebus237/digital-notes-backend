import { ApplicationService } from '@adonisjs/core/types'
import { UploadARRepository } from '#kernel/uploads/infrastructure/persistence/upload_ar_repository'
import { UniversityARRepository } from '#kernel/organisation/infrastructure/persistence/aggregates/university_ar_repository'
import { FacultyARRepository } from '#kernel/organisation/infrastructure/persistence/aggregates/faculty_ar_repository'
import { DepartmentARRepository } from '#kernel/organisation/infrastructure/persistence/aggregates/department_ar_repository'
import { LevelARRepository } from '#kernel/organisation/infrastructure/persistence/aggregates/level_ar_repository'
import { SemesterARRepository } from '#kernel/organisation/infrastructure/persistence/aggregates/semester_ar_repository'
import { CourseARRepository } from '#kernel/organisation/infrastructure/persistence/aggregates/course_ar_repository'
import { NoteARRepository } from '#kernel/notes/infrastructure/persistence/note_ar_repository'

export default class AggregateProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    if (this.app.nodeEnvironment !== 'test') {
      this.app.container.bind('UploadRepository', () => {
        return new UploadARRepository()
      })
      this.app.container.bind('UniversityRepository', () => {
        return new UniversityARRepository()
      })
      this.app.container.bind('FacultyRepository', () => {
        return new FacultyARRepository()
      })
      this.app.container.bind('DepartmentRepository', () => {
        return new DepartmentARRepository()
      })
      this.app.container.bind('LevelRepository', () => {
        return new LevelARRepository()
      })
      this.app.container.bind('SemesterRepository', () => {
        return new SemesterARRepository()
      })
      this.app.container.bind('CourseRepository', () => {
        return new CourseARRepository()
      })
      this.app.container.bind('NoteRepository', () => {
        return new NoteARRepository()
      })
    }
  }

  public async boot() {}
  public async ready() {}
  public async shutdown() {}
}
