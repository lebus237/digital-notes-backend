import { MediaUploadService } from '#core/application/services/media-upload/media_upload_service'
import { StorageProviderFactory } from '#infra/factory/storage_provider.factory'
import { UniversityARService } from '#kernel/organisation/infrastructure/persistence/projections/university_ar_service'
import { FacultyARService } from '#kernel/organisation/infrastructure/persistence/projections/faculty_ar_service'
import { DepartmentARService } from '#kernel/organisation/infrastructure/persistence/projections/department_ar_service'
import { LevelARService } from '#kernel/organisation/infrastructure/persistence/projections/level_ar_service'
import { SemesterARService } from '#kernel/organisation/infrastructure/persistence/projections/semester_ar_service'
import { CourseARService } from '#kernel/organisation/infrastructure/persistence/projections/course_ar_service'
import { NoteARService } from '#kernel/notes/infrastructure/persistence/projections/note_ar_service'
import UniversityController from '#controllers/organisation/university_controller'
import FacultyController from '#controllers/organisation/faculty_controller'
import DepartmentController from '#controllers/organisation/department_controller'
import LevelController from '#controllers/organisation/level_controller'
import SemesterController from '#controllers/organisation/semester_controller'
import CourseController from '#controllers/organisation/course_controller'
import { ApplicationService } from '@adonisjs/core/types'

export default class ServiceProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    this.app.container.singleton('UniversityService', () => {
      return new UniversityARService()
    })
    this.app.container.singleton('FacultyService', () => {
      return new FacultyARService()
    })
    this.app.container.singleton('DepartmentService', () => {
      return new DepartmentARService()
    })
    this.app.container.singleton('LevelService', () => {
      return new LevelARService()
    })
    this.app.container.singleton('SemesterService', () => {
      return new SemesterARService()
    })
    this.app.container.singleton('CourseService', () => {
      return new CourseARService()
    })
    this.app.container.singleton('NoteService', () => {
      return new NoteARService()
    })

    this.app.container.bind(UniversityController, async (resolver) => {
      return new UniversityController(await resolver.make('UniversityService'))
    })
    this.app.container.bind(FacultyController, async (resolver) => {
      return new FacultyController(await resolver.make('FacultyService'))
    })
    this.app.container.bind(DepartmentController, async (resolver) => {
      return new DepartmentController(await resolver.make('DepartmentService'))
    })
    this.app.container.bind(LevelController, async (resolver) => {
      return new LevelController(await resolver.make('LevelService'))
    })
    this.app.container.bind(SemesterController, async (resolver) => {
      return new SemesterController(await resolver.make('SemesterService'))
    })
    this.app.container.bind(CourseController, async (resolver) => {
      return new CourseController(await resolver.make('CourseService'))
    })

    if (this.app.nodeEnvironment !== 'test') {
      this.app.container.bind('MediaUploadService', () => {
        const provider = StorageProviderFactory.createFromEnv()
        return new MediaUploadService(provider)
      })
    }
  }

  public async boot() {}
  public async ready() {}
  public async shutdown() {}
}
