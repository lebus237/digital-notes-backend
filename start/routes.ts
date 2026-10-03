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
import {
  adminWriteThrottle,
  authThrottle,
  publicReadThrottle,
  uploadDestroyThrottle,
  uploadStoreThrottle,
} from '#start/limiter'

const UploadController = () => import('#controllers/uploads/upload_controller')
const AuthController = () => import('#controllers/authentication/auth_controller')
const UniversitiesController = () => import('#controllers/organisation/university_controller')
const FacultyController = () => import('#controllers/organisation/faculty_controller')
const DepartmentController = () => import('#controllers/organisation/department_controller')
const LevelController = () => import('#controllers/organisation/level_controller')
const SemesterController = () => import('#controllers/organisation/semester_controller')
const CourseController = () => import('#controllers/organisation/course_controller')
const EmployeeController = () => import('#controllers/employee/employee_controller')
const NoteController = () => import('#controllers/notes/note_controller')

router
  .group(() => {
    router.group(() => {
      router.post('/register', [AuthController, 'register']).use(authThrottle)
      router.post('/login', [AuthController, 'login']).use(authThrottle)
      router.post('/forgot-password', [AuthController, 'forgotPassword']).use(authThrottle)
      router.post('/reset-password', [AuthController, 'resetPassword']).use(authThrottle)

      router.get('/me', [AuthController, 'me']).use(middleware.auth())

      router.post('/logout', [AuthController, 'logout']).use(middleware.auth())
      router
        .post('/change-password', [AuthController, 'changePassword'])
        .use([middleware.auth(), authThrottle])
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
    router.get('/universities', [UniversitiesController, 'index']).use(publicReadThrottle)
    router.get('/faculties', [FacultyController, 'index']).use(publicReadThrottle)
    router.get('/departments', [DepartmentController, 'index']).use(publicReadThrottle)
    router.get('/levels', [LevelController, 'index']).use(publicReadThrottle)
    router.get('/semesters', [SemesterController, 'index']).use(publicReadThrottle)
    router.get('/courses', [CourseController, 'index']).use(publicReadThrottle)
    router.get('/courses/:id', [CourseController, 'show']).use(publicReadThrottle)

    router.get('/courses/:courseId/notes', [NoteController, 'index']).use(publicReadThrottle)
    router.get('/notes/:id', [NoteController, 'show']).use(publicReadThrottle)

    router
      .group(() => {
        router.post('/universities', [UniversitiesController, 'store']).use(adminWriteThrottle)
        router.post('/faculties', [FacultyController, 'store']).use(adminWriteThrottle)
        router.post('/departments', [DepartmentController, 'store']).use(adminWriteThrottle)
        router.post('/levels', [LevelController, 'store']).use(adminWriteThrottle)
        router.post('/semesters', [SemesterController, 'store']).use(adminWriteThrottle)

        router.post('/courses', [CourseController, 'store']).use(adminWriteThrottle)
        router.patch('/courses/:id', [CourseController, 'update']).use(adminWriteThrottle)
        router.post('/courses/:id/archive', [CourseController, 'archive']).use(adminWriteThrottle)

        router.get('/employees', [EmployeeController, 'index']).use(publicReadThrottle)
        router.get('/employees/:id', [EmployeeController, 'show']).use(publicReadThrottle)
        router.post('/employees', [EmployeeController, 'store']).use(adminWriteThrottle)

        router
          .post('/users/:id/reset-password', [AuthController, 'adminResetPassword'])
          .use(authThrottle)

        router.post('/notes', [NoteController, 'store']).use(uploadStoreThrottle)
        router.patch('/notes/:id', [NoteController, 'update']).use(adminWriteThrottle)
        router.post('/notes/:id/publish', [NoteController, 'publish']).use(adminWriteThrottle)
        router.post('/notes/:id/reject', [NoteController, 'reject']).use(adminWriteThrottle)
        router.post('/notes/:id/archive', [NoteController, 'archive']).use(adminWriteThrottle)
      })
      .prefix('/admin')
      .use([middleware.auth(), middleware.role({ roles: ['administrator'] })])

    router
      .group(() => {
        router.post('/notes', [NoteController, 'store']).use(uploadStoreThrottle)
        router.patch('/notes/:id', [NoteController, 'update']).use(adminWriteThrottle)
      })
      .use([middleware.auth(), middleware.role({ roles: ['administrator', 'contributor'] })])
  })
  .prefix('/api/v1')
