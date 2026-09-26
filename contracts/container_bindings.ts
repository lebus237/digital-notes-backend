import { CommandBus } from '#shared/infrastructure/bus/command_bus'
import { QueryBus } from '#shared/infrastructure/bus/query_bus'
import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'

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
  }
}
