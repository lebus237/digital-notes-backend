import { test } from '@japa/runner'
import { DeleteImageHandler } from '#kernel/medias/application/command_handler/delete_image_handler'
import { DeleteImageCommand } from '#kernel/medias/application/command/delete_image_command'
import { ImageMediaRepository } from '#kernel/medias/domain/image_media_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { MediaType } from '#shared/application/services/upload/types'
import { ImageMedia } from '#kernel/medias/domain/image_media'
import { AppId } from '#shared/domain/app_id'
import { MediaNotOwnedError } from '#kernel/medias/domain/errors/media_not_owned_error'
import { UserRole } from '#kernel/user/domain/types/user_role'

test.group('DeleteImageHandler', () => {
  const IMG_123 = '00000000-0000-4000-8000-000000000123'
  const IMG_456 = '00000000-0000-4000-8000-000000000456'
  const NON_EXISTENT = '00000000-0000-4000-8000-00000000ffff'

  const createMockImage = (): ImageMedia => {
    return new ImageMedia(
      AppId.fromString(IMG_123),
      'Test Image',
      'https://example.com/image.jpg',
      'Alt text',
      {},
      new Date(),
      null,
      'images/test-image.jpg',
      'user-1'
    )
  }

  const createMockRepository = (
    image: ImageMedia | null = createMockImage()
  ): ImageMediaRepository => ({
    save: async () => {},
    findById: async () => image,
    findByUrl: async () => null,
    delete: async () => {},
  })

  const createMockMediaManager = (): MediaManagerInterface => ({
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
  })

  test('should delete image when found and file exists', async ({ assert }) => {
    let deleteFileCalled = false
    let repositoryDeleteCalled = false

    const mockImage = createMockImage()
    const mockRepository: ImageMediaRepository = {
      ...createMockRepository(mockImage),
      delete: async () => {
        repositoryDeleteCalled = true
      },
    }
    const mockMediaManager: MediaManagerInterface = {
      ...createMockMediaManager(),
      deleteFile: async () => {
        deleteFileCalled = true
        return true
      },
    }

    const handler = new DeleteImageHandler(mockRepository, mockMediaManager)
    const command = new DeleteImageCommand('user-1', AppId.fromString(IMG_123))

    await handler.handle(command)

    assert.isTrue(deleteFileCalled)
    assert.isTrue(repositoryDeleteCalled)
  })

  test('should throw error when image not found', async ({ assert }) => {
    const mockRepository: ImageMediaRepository = {
      ...createMockRepository(null),
    }
    const mockMediaManager = createMockMediaManager()

    const handler = new DeleteImageHandler(mockRepository, mockMediaManager)
    const command = new DeleteImageCommand('user-1', AppId.fromString(NON_EXISTENT))

    try {
      await handler.handle(command)
      assert.fail('Should have thrown an error')
    } catch (error) {
      assert.instanceOf(error, Error)
      assert.equal((error as Error).message, 'Image not found')
    }
  })

  test('should call findById with correct id', async ({ assert }) => {
    let capturedId: string | null = null

    const mockImage = createMockImage()
    const mockRepository: ImageMediaRepository = {
      ...createMockRepository(mockImage),
      findById: async (id: string) => {
        capturedId = id
        return mockImage
      },
    }
    const mockMediaManager = createMockMediaManager()

    const handler = new DeleteImageHandler(mockRepository, mockMediaManager)
    const command = new DeleteImageCommand('user-1', AppId.fromString(IMG_456))

    await handler.handle(command)

    assert.equal(capturedId, IMG_456)
  })

  test('should not delete from repository if file does not exist', async ({ assert }) => {
    let repositoryDeleteCalled = false

    const mockImage = createMockImage()
    const mockRepository: ImageMediaRepository = {
      ...createMockRepository(mockImage),
      delete: async () => {
        repositoryDeleteCalled = true
      },
    }
    const mockMediaManager: MediaManagerInterface = {
      ...createMockMediaManager(),
      fileExists: async () => false,
    }

    const handler = new DeleteImageHandler(mockRepository, mockMediaManager)
    const command = new DeleteImageCommand('user-1', AppId.fromString(IMG_123))

    await handler.handle(command)

    assert.isFalse(repositoryDeleteCalled)
  })

  test('should not delete from repository if deleteFile returns false', async ({ assert }) => {
    let repositoryDeleteCalled = false

    const mockImage = createMockImage()
    const mockRepository: ImageMediaRepository = {
      ...createMockRepository(mockImage),
      delete: async () => {
        repositoryDeleteCalled = true
      },
    }
    const mockMediaManager: MediaManagerInterface = {
      ...createMockMediaManager(),
      deleteFile: async () => false,
    }

    const handler = new DeleteImageHandler(mockRepository, mockMediaManager)
    const command = new DeleteImageCommand('user-1', AppId.fromString(IMG_123))

    await handler.handle(command)

    assert.isFalse(repositoryDeleteCalled)
  })

  test('should call deleteFile with correct key', async ({ assert }) => {
    let capturedKey: string | null = null

    const mockImage = createMockImage()
    const mockRepository = createMockRepository(mockImage)
    const mockMediaManager: MediaManagerInterface = {
      ...createMockMediaManager(),
      deleteFile: async (key: string) => {
        capturedKey = key
        return true
      },
    }

    const handler = new DeleteImageHandler(mockRepository, mockMediaManager)
    const command = new DeleteImageCommand('user-1', AppId.fromString(IMG_123))

    await handler.handle(command)

    assert.equal(capturedKey, 'images/test-image.jpg')
  })

  test('should call fileExists with correct key', async ({ assert }) => {
    let capturedKey: string | null = null

    const mockImage = createMockImage()
    const mockRepository = createMockRepository(mockImage)
    const mockMediaManager: MediaManagerInterface = {
      ...createMockMediaManager(),
      fileExists: async (key: string) => {
        capturedKey = key
        return true
      },
    }

    const handler = new DeleteImageHandler(mockRepository, mockMediaManager)
    const command = new DeleteImageCommand('user-1', AppId.fromString(IMG_123))

    await handler.handle(command)

    assert.equal(capturedKey, 'images/test-image.jpg')
  })

  test('should reject deletion by a different user', async ({ assert }) => {
    const handler = new DeleteImageHandler(createMockRepository(), createMockMediaManager())

    try {
      await handler.handle(new DeleteImageCommand('user-2', AppId.fromString(IMG_123)))
      assert.fail('Should have thrown an error')
    } catch (error) {
      assert.instanceOf(error, MediaNotOwnedError)
      assert.equal((error as Error).message, 'Media not found')
    }
  })

  test('should allow an administrator to delete another user image', async ({ assert }) => {
    let repositoryDeleteCalled = false
    const mockRepository: ImageMediaRepository = {
      ...createMockRepository(),
      delete: async () => {
        repositoryDeleteCalled = true
      },
    }
    const handler = new DeleteImageHandler(mockRepository, createMockMediaManager())

    await handler.handle(
      new DeleteImageCommand('admin-1', AppId.fromString(IMG_123), UserRole.ADMINISTRATOR)
    )

    assert.isTrue(repositoryDeleteCalled)
  })
})
