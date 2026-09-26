import { CommandBus } from '#shared/infrastructure/bus/command_bus'
import { QueryBus } from '#shared/infrastructure/bus/query_bus'
import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import type { UniversityService } from '#kernel/organisation/application/services/university_service'
import type { FacultyService } from '#kernel/organisation/application/services/faculty_service'
import type { DepartmentService } from '#kernel/organisation/application/services/department_service'
import type { LevelService } from '#kernel/organisation/application/services/level_service'
import type { SemesterService } from '#kernel/organisation/application/services/semester_service'
import type { CourseService } from '#kernel/organisation/application/services/course_service'
import type { NoteService } from '#kernel/notes/application/services/note_service'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    'CQRS/CommandBus': CommandBus
    'CQRS/QueryBus': QueryBus

    //AGGREGATES REPOSITORY
    'UploadRepository': RepositoryInterface
    'UniversityRepository': RepositoryInterface
    'FacultyRepository': RepositoryInterface
    'DepartmentRepository': RepositoryInterface
    'LevelRepository': RepositoryInterface
    'SemesterRepository': RepositoryInterface
    'CourseRepository': RepositoryInterface
    'NoteRepository': RepositoryInterface

    //SERVICE
    'MediaUploadService': MediaManagerInterface
    'UniversityService': UniversityService
    'FacultyService': FacultyService
    'DepartmentService': DepartmentService
    'LevelService': LevelService
    'SemesterService': SemesterService
    'CourseService': CourseService
    'NoteService': NoteService
  }
}
