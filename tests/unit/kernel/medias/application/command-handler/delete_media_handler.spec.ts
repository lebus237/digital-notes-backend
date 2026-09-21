import { test } from '@japa/runner'
import { DeleteMediaHandler } from '#kernel/medias/application/command_handler/delete_media_handler'
import { DeleteMediaCommand } from '#kernel/medias/application/command/delete_media_command'
import { MediaRepository } from '#kernel/medias/domain/media_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { MediaType } from '#shared/application/services/upload/types'
import { Media } from '#kernel/medias/domain/media'
import { AppId } from '#shared/domain/app_id'
import { MediaNotOwnedError } from '#kernel/medias/domain/errors/media_not_owned_error'
import { UserRole } from '#kernel/user/domain/types/user_role'

test.group('DeleteMediaHandler ownership', () => {
  const MEDIA_ID = '00000000-0000-4000-8000-000000000123'

  const media = new Media(
    AppId.fromString(MEDIA_ID),
    MediaType.IMAGE,
    'Title',
    'https://example.com/file.jpg',
    null,
    'image/jpeg',
    10,
    {},
    new Date(),
    null,
    'media/file.jpg',
    'user-a'
  )

  const repository: MediaRepository = {
    save: async () => {},
    findById: async () => media,
    findByUrl: async () => null,
    delete: async () => {},
  }

  const mediaManager: MediaManagerInterface = {
    uploadImage: async () => ({ success: true }),
    uploadFile: async () => ({ success: true }),
    uploadDocument: async () => ({ success: true }),
    deleteFile: async () => true,
    getSignedUrl: async () => '',
    fileExists: async () => true,
    getFileMetadata: async () => ({}),
    getMediaType: () => MediaType.IMAGE,
    setProvider: () => {},
    getProvider: () => ({}) as any,
  }

  test('owner can delete', async ({ assert }) => {
    let deleted = false
    const handler = new DeleteMediaHandler(
      {
        ...repository,
        delete: async () => {
          deleted = true
        },
      },
      mediaManager
    )

    await handler.handle(
      new DeleteMediaCommand('user-a', AppId.fromString(MEDIA_ID), UserRole.STUDENT)
    )

    assert.isTrue(deleted)
  })

  test('another student cannot delete', async ({ assert }) => {
    const handler = new DeleteMediaHandler(repository, mediaManager)

    try {
      await handler.handle(
        new DeleteMediaCommand('user-b', AppId.fromString(MEDIA_ID), UserRole.STUDENT)
      )
      assert.fail('Should have thrown')
    } catch (error) {
      assert.instanceOf(error, MediaNotOwnedError)
    }
  })

  test('administrator can delete another user media', async ({ assert }) => {
    let deleted = false
    const handler = new DeleteMediaHandler(
      {
        ...repository,
        delete: async () => {
          deleted = true
        },
      },
      mediaManager
    )

    await handler.handle(
      new DeleteMediaCommand('admin-1', AppId.fromString(MEDIA_ID), UserRole.ADMINISTRATOR)
    )

    assert.isTrue(deleted)
  })
})
