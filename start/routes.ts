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

const ImageMediasController = () => import('#controllers/media/image_medias_controller')
const DocumentMediasController = () => import('#controllers/media/document_medias_controller')
const AuthController = () => import('#controllers/authentication/auth_controller')

router
  .group(() => {
    router.group(() => {
      router.post('/register', [AuthController, 'register'])
      router.post('/login', [AuthController, 'login'])

      router.get('/me', [AuthController, 'me']).use(middleware.auth())

      router.get('/logout', [AuthController, 'logout'])
    })

    router.group(() => {
      router
        .resource('image-media', ImageMediasController)
        .apiOnly()
        .only(['store', 'destroy'])
        .use('*', middleware.auth())

      router
        .resource('document-media', DocumentMediasController)
        .apiOnly()
        .only(['store', 'destroy'])
        .use('*', middleware.auth())
    })
  })
  .prefix('/api')
