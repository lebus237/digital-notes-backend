/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { authThrottle, uploadDestroyThrottle, uploadStoreThrottle } from '#start/limiter'

const UploadController = () => import('#controllers/uploads/upload_controller')
const AuthController = () => import('#controllers/authentication/auth_controller')
const UniversitiesController = () => import('#controllers/organisation/university_controller')
const FacultyController = () => import('#controllers/organisation/faculty_controller')
const DepartmentController = () => import('#controllers/organisation/department_controller')
const LevelController = () => import('#controllers/organisation/level_controller')
const SemesterController = () => import('#controllers/organisation/semester_controller')
const CourseController = () => import('#controllers/organisation/course_controller')
const NoteController = () => import('#controllers/notes/note_controller')

router
  .group(() => {
    router.group(() => {
      router.post('/register', [AuthController, 'register']).use(authThrottle)
      router.post('/login', [AuthController, 'login']).use(authThrottle)

      router.get('/me', [AuthController, 'me']).use(middleware.auth())

      router.post('/logout', [AuthController, 'logout']).use(middleware.auth())
    })

    router.group(() => {
      router
        .resource('uploads', UploadController)
        .apiOnly()
        .only(['store', 'destroy'])
        .use('store', [middleware.auth(), uploadStoreThrottle])
        .use('destroy', [middleware.auth(), uploadDestroyThrottle])
    })
  })
  .prefix('/api')

router
  .group(() => {
    router.get('/universities', [UniversitiesController, 'index'])
    router.get('/faculties', [FacultyController, 'index'])
    router.get('/departments', [DepartmentController, 'index'])
    router.get('/levels', [LevelController, 'index'])
    router.get('/semesters', [SemesterController, 'index'])
    router.get('/courses', [CourseController, 'index'])
    router.get('/courses/:id', [CourseController, 'show'])

    router.get('/courses/:courseId/notes', [NoteController, 'index'])
    router.get('/notes/:id', [NoteController, 'show'])

    router
      .group(() => {
        router.post('/universities', [UniversitiesController, 'store'])
        router.post('/faculties', [FacultyController, 'store'])
        router.post('/departments', [DepartmentController, 'store'])
        router.post('/levels', [LevelController, 'store'])
        router.post('/semesters', [SemesterController, 'store'])

        router.post('/courses', [CourseController, 'store'])
        router.patch('/courses/:id', [CourseController, 'update'])
        router.post('/courses/:id/archive', [CourseController, 'archive'])

        router.post('/notes', [NoteController, 'store']).use(uploadStoreThrottle)
        router.patch('/notes/:id', [NoteController, 'update'])
        router.post('/notes/:id/publish', [NoteController, 'publish'])
        router.post('/notes/:id/reject', [NoteController, 'reject'])
        router.post('/notes/:id/archive', [NoteController, 'archive'])
      })
      .prefix('/admin')
      .use([middleware.auth(), middleware.role({ roles: ['administrator'] })])
  })
  .prefix('/api/v1')
