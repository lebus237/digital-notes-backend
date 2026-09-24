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
