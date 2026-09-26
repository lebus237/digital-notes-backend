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

const UploadsController = () => import('#controllers/uploads/uploads_controller')
const AuthController = () => import('#controllers/authentication/auth_controller')
const UniversitiesController = () => import('#controllers/organisation/universities_controller')
const FacultiesController = () => import('#controllers/organisation/faculties_controller')
const DepartmentsController = () => import('#controllers/organisation/departments_controller')
const LevelsController = () => import('#controllers/organisation/levels_controller')
const SemestersController = () => import('#controllers/organisation/semesters_controller')
const CoursesController = () => import('#controllers/organisation/courses_controller')
const NotesController = () => import('#controllers/notes/notes_controller')

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
        .resource('uploads', UploadsController)
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
    router.get('/faculties', [FacultiesController, 'index'])
    router.get('/departments', [DepartmentsController, 'index'])
    router.get('/levels', [LevelsController, 'index'])
    router.get('/semesters', [SemestersController, 'index'])
    router.get('/courses', [CoursesController, 'index'])
    router.get('/courses/:id', [CoursesController, 'show'])

    router.get('/courses/:courseId/notes', [NotesController, 'index'])
    router.get('/notes/:id', [NotesController, 'show'])

    router
      .group(() => {
        router.post('/universities', [UniversitiesController, 'store'])
        router.post('/faculties', [FacultiesController, 'store'])
        router.post('/departments', [DepartmentsController, 'store'])
        router.post('/levels', [LevelsController, 'store'])
        router.post('/semesters', [SemestersController, 'store'])

        router.post('/courses', [CoursesController, 'store'])
        router.patch('/courses/:id', [CoursesController, 'update'])
        router.post('/courses/:id/archive', [CoursesController, 'archive'])

        router.post('/notes', [NotesController, 'store']).use(uploadStoreThrottle)
        router.patch('/notes/:id', [NotesController, 'update'])
        router.post('/notes/:id/publish', [NotesController, 'publish'])
        router.post('/notes/:id/reject', [NotesController, 'reject'])
        router.post('/notes/:id/archive', [NotesController, 'archive'])
      })
      .prefix('/admin')
      .use([middleware.auth(), middleware.role({ roles: ['administrator'] })])
  })
  .prefix('/api/v1')
