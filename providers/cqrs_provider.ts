import { CommandBus } from '#shared/infrastructure/bus/command_bus'
import { QueryBus } from '#shared/infrastructure/bus/query_bus'
import { ApplicationService } from '@adonisjs/core/types'
import { StoreUploadHandler } from '#kernel/uploads/application/command_handler/store_upload.handler'
import { DeleteUploadHandler } from '#kernel/uploads/application/command_handler/delete_upload_handler'
import { UploadNoteHandler } from '#kernel/notes/application/command_handler/upload_note_handler'
import { PublishNoteHandler } from '#kernel/notes/application/command_handler/publish_note_handler'
import { RejectNoteHandler } from '#kernel/notes/application/command_handler/reject_note_handler'
import { ArchiveNoteHandler } from '#kernel/notes/application/command_handler/archive_note_handler'
import { UpdateNoteMetadataHandler } from '#kernel/notes/application/command_handler/update_note_metadata_handler'
import { CreateUniversityHandler } from '#kernel/organisation/application/use-cases/command_handler/create_university_handler'
import { CreateFacultyHandler } from '#kernel/organisation/application/use-cases/command_handler/create_faculty_handler'
import { CreateDepartmentHandler } from '#kernel/organisation/application/use-cases/command_handler/create_department_handler'
import { CreateLevelHandler } from '#kernel/organisation/application/use-cases/command_handler/create_level_handler'
import { CreateSemesterHandler } from '#kernel/organisation/application/use-cases/command_handler/create_semester_handler'
import { CreateCourseHandler } from '#kernel/organisation/application/use-cases/command_handler/create_course_handler'
import { UpdateCourseHandler } from '#kernel/organisation/application/use-cases/command_handler/update_course_handler'
import { ArchiveCourseHandler } from '#kernel/organisation/application/use-cases/command_handler/archive_course_handler'

export default class CqrsProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    this.app.container.singleton('CQRS/CommandBus', () => {
      const commandBus = new CommandBus(this.app)

      //UPLOAD COMMANDS
      commandBus.register('StoreUploadCommand', StoreUploadHandler, [
        'UploadRepository',
        'MediaUploadService',
      ])
      commandBus.register('DeleteUploadCommand', DeleteUploadHandler, [
        'UploadRepository',
        'MediaUploadService',
      ])

      //ORGANISATION COMMANDS
      commandBus.register('CreateUniversityCommand', CreateUniversityHandler, [
        'UniversityRepository',
      ])
      commandBus.register('CreateFacultyCommand', CreateFacultyHandler, [
        'FacultyRepository',
        'UniversityRepository',
      ])
      commandBus.register('CreateDepartmentCommand', CreateDepartmentHandler, [
        'DepartmentRepository',
        'FacultyRepository',
      ])
      commandBus.register('CreateLevelCommand', CreateLevelHandler, [
        'LevelRepository',
        'DepartmentRepository',
      ])
      commandBus.register('CreateSemesterCommand', CreateSemesterHandler, ['SemesterRepository'])
      commandBus.register('CreateCourseCommand', CreateCourseHandler, [
        'CourseRepository',
        'DepartmentRepository',
        'LevelRepository',
        'SemesterRepository',
      ])
      commandBus.register('UpdateCourseCommand', UpdateCourseHandler, ['CourseRepository'])
      commandBus.register('ArchiveCourseCommand', ArchiveCourseHandler, ['CourseRepository'])

      //NOTES COMMANDS
      commandBus.register('UploadNoteCommand', UploadNoteHandler, [
        'NoteRepository',
        'CourseRepository',
        'MediaUploadService',
      ])
      commandBus.register('PublishNoteCommand', PublishNoteHandler, ['NoteRepository'])
      commandBus.register('RejectNoteCommand', RejectNoteHandler, ['NoteRepository'])
      commandBus.register('ArchiveNoteCommand', ArchiveNoteHandler, ['NoteRepository'])
      commandBus.register('UpdateNoteMetadataCommand', UpdateNoteMetadataHandler, [
        'NoteRepository',
      ])

      return commandBus
    })

    this.app.container.singleton('CQRS/QueryBus', () => {
      const queryBus = new QueryBus(this.app)

      //ORGANISATION QUERIES (reads hit Lucid directly via services, no QueryBus registration needed)

      //NOTES QUERIES (reads hit Lucid directly via NoteService, no QueryBus registration needed)

      return queryBus
    })
  }

  public async boot() {}
  public async ready() {}
  public async shutdown() {}
}
