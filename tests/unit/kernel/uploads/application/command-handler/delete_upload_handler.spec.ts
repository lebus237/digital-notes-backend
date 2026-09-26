import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { DeleteUploadHandler } from '#kernel/uploads/application/command_handler/delete_upload_handler'
import { DeleteUploadCommand } from '#kernel/uploads/application/command/delete_upload_command'
import { UploadRepository } from '#kernel/uploads/domain/upload_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { MediaType } from '#shared/application/services/upload/types'
import { Upload } from '#kernel/uploads/domain/upload'
import { AppId } from '#shared/domain/app_id'
import { UploadNotOwnedError } from '#kernel/uploads/domain/errors/upload_not_owned_error'
import { UserRole } from '#kernel/user/domain/types/user_role'

test.group('DeleteUploadHandler ownership', () => {
  const UPLOAD_ID = '00000000-0000-4000-8000-000000000123'

  const upload = new Upload(
    AppId.fromString(UPLOAD_ID),
    MediaType.IMAGE,
    'Title',
    'https://example.com/file.jpg',
    null,
    'image/jpeg',
    10,
    {},
    DateTime.now(),
    null,
    'media/file.jpg',
    'user-a'
  )

  const repository: UploadRepository = {
    save: async () => {},
    findById: async () => upload,
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
    const handler = new DeleteUploadHandler(
      {
        ...repository,
        delete: async () => {
          deleted = true
        },
      },
      mediaManager
    )

    await handler.handle(
      new DeleteUploadCommand('user-a', AppId.fromString(UPLOAD_ID), UserRole.STUDENT)
    )

    assert.isTrue(deleted)
  })

  test('another student cannot delete', async ({ assert }) => {
    const handler = new DeleteUploadHandler(repository, mediaManager)

    try {
      await handler.handle(
        new DeleteUploadCommand('user-b', AppId.fromString(UPLOAD_ID), UserRole.STUDENT)
      )
      assert.fail('Should have thrown')
    } catch (error) {
      assert.instanceOf(error, UploadNotOwnedError)
    }
  })

  test('administrator can delete another user upload', async ({ assert }) => {
    let deleted = false
    const handler = new DeleteUploadHandler(
      {
        ...repository,
        delete: async () => {
          deleted = true
        },
      },
      mediaManager
    )

    await handler.handle(
      new DeleteUploadCommand('admin-1', AppId.fromString(UPLOAD_ID), UserRole.ADMINISTRATOR)
    )

    assert.isTrue(deleted)
  })
})
