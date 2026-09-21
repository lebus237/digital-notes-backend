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
import { authThrottle, mediaDestroyThrottle, mediaStoreThrottle } from '#start/limiter'

const ImageMediasController = () => import('#controllers/media/image_medias_controller')
const DocumentMediasController = () => import('#controllers/media/document_medias_controller')
const MediasController = () => import('#controllers/media/medias_controller')
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
        .resource('media', MediasController)
        .apiOnly()
        .only(['store', 'destroy'])
        .use('store', [middleware.auth(), mediaStoreThrottle])
        .use('destroy', [middleware.auth(), mediaDestroyThrottle])

      // @deprecated shims — use `media` instead. Kept for backward compatibility.
      router
        .resource('image-media', ImageMediasController)
        .apiOnly()
        .only(['store', 'destroy'])
        .use('store', [middleware.auth(), mediaStoreThrottle])
        .use('destroy', [middleware.auth(), mediaDestroyThrottle])

      router
        .resource('document-media', DocumentMediasController)
        .apiOnly()
        .only(['store', 'destroy'])
        .use('store', [middleware.auth(), mediaStoreThrottle])
        .use('destroy', [middleware.auth(), mediaDestroyThrottle])
    })
  })
  .prefix('/api')
