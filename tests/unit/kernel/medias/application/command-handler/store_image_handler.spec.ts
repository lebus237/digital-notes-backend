import { test } from '@japa/runner'
import { StoreImageHandler } from '#kernel/medias/application/command_handler/store_image.handler'
import { StoreImageCommand } from '#kernel/medias/application/command/store_image_command'
import { ImageMediaRepository } from '#kernel/medias/domain/image_media_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { MediaType } from '#shared/application/services/upload/types'
import { AppFile } from '#shared/domain/app_file'
import { ImageMedia } from '#kernel/medias/domain/image_media'

test.group('StoreImageHandler', () => {
  const createMockAppFile = (): AppFile => {
    return {
      getBuffer: async () => Buffer.from('test-image-data'),
      originalName: 'test-image.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
      metadata: {},
      getFile: () => ({}) as any,
    } as AppFile
  }

  const createMockMediaManager = (): MediaManagerInterface => ({
    uploadImage: async () => ({
      success: true,
      url: 'https://cdn.example.com/images/test-image.jpg',
      key: 'images/test-image.jpg',
      metadata: {
        originalName: 'test-image.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
      },
    }),
    uploadFile: async () => ({ success: true }),
    uploadDocument: async () => ({ success: true }),
    deleteFile: async () => true,
    getSignedUrl: async () => 'https://signed-url.example.com/image.jpg',
    fileExists: async () => true,
    getFileMetadata: async () => ({}),
    getMediaType: () => MediaType.IMAGE,
    setProvider: () => {},
    getProvider: () => ({}) as any,
  })

  const createMockRepository = (): ImageMediaRepository => ({
    save: async () => 'img-123',
    findById: async () => null,
    findByUrl: async () => null,
    delete: async () => {},
  })

  test('should store image and return id, url, signedUrl', async ({ assert }) => {
    const mockFile = createMockAppFile()
    const mockMediaManager = createMockMediaManager()
    const mockRepository = createMockRepository()

    const handler = new StoreImageHandler(mockRepository, mockMediaManager)
    const command = new StoreImageCommand(mockFile, 'Test Image', 'Test description')

    const result = await handler.handle(command)

    assert.equal(result.id, 'img-123')
    assert.equal(result.url, 'https://cdn.example.com/images/test-image.jpg')
    assert.equal(result.signedUrl, 'https://signed-url.example.com/image.jpg')
  })

  test('should call uploadService with correct file data', async ({ assert }) => {
    let capturedFileInfo: any = null

    const mockFile = createMockAppFile()
    const mockMediaManager: MediaManagerInterface = {
      ...createMockMediaManager(),
      uploadImage: async (fileInfo) => {
        capturedFileInfo = fileInfo
        return {
          success: true,
          url: 'https://cdn.example.com/test.jpg',
          key: 'test.jpg',
        }
      },
    }
    const mockRepository = createMockRepository()

    const handler = new StoreImageHandler(mockRepository, mockMediaManager)
    const command = new StoreImageCommand(mockFile, 'Test', 'Alt')

    await handler.handle(command)

    assert.equal(capturedFileInfo.originalName, 'test-image.jpg')
    assert.equal(capturedFileInfo.mimeType, 'image/jpeg')
    assert.equal(capturedFileInfo.size, 1024)
  })

  test('should throw error when upload fails', async ({ assert }) => {
    const mockFile = createMockAppFile()
    const mockMediaManager: MediaManagerInterface = {
      ...createMockMediaManager(),
      uploadImage: async () => ({
        success: false,
        error: 'Upload failed: Invalid file type',
      }),
    }
    const mockRepository = createMockRepository()

    const handler = new StoreImageHandler(mockRepository, mockMediaManager)
    const command = new StoreImageCommand(mockFile, 'Test', 'Alt')

    try {
      await handler.handle(command)
      assert.fail('Should have thrown an error')
    } catch (error) {
      assert.instanceOf(error, Error)
      assert.include((error as Error).message, 'Upload failed')
    }
  })

  test('should save ImageMedia types with correct data', async ({ assert }) => {
    let savedImage: ImageMedia | null = null

    const mockFile = createMockAppFile()
    const mockMediaManager = createMockMediaManager()
    const mockRepository: ImageMediaRepository = {
      ...createMockRepository(),
      save: async (image: ImageMedia) => {
        savedImage = image
        return 'img-456'
      },
    }

    const handler = new StoreImageHandler(mockRepository, mockMediaManager)
    const command = new StoreImageCommand(mockFile, 'My Image', 'My alt text')

    await handler.handle(command)

    assert.isDefined(savedImage)
    assert.equal(savedImage!.getTitle(), 'My Image')
    assert.equal(savedImage!.getAltDescription(), 'My alt text')
    assert.equal(savedImage!.getUrl(), 'https://cdn.example.com/images/test-image.jpg')
  })

  test('should use default values for title and altDescription', async ({ assert }) => {
    let savedImage: ImageMedia | null = null

    const mockFile = createMockAppFile()
    const mockMediaManager = createMockMediaManager()
    const mockRepository: ImageMediaRepository = {
      ...createMockRepository(),
      save: async (image: ImageMedia) => {
        savedImage = image
        return 'img-789'
      },
    }

    const handler = new StoreImageHandler(mockRepository, mockMediaManager)
    const command = new StoreImageCommand(mockFile)

    await handler.handle(command)

    assert.equal(savedImage!.getTitle(), '')
    assert.equal(savedImage!.getAltDescription(), '')
  })

  test('should get signed url after successful upload', async ({ assert }) => {
    let capturedKey: string | null = null

    const mockFile = createMockAppFile()
    const mockMediaManager: MediaManagerInterface = {
      ...createMockMediaManager(),
      getSignedUrl: async (key: string) => {
        capturedKey = key
        return `https://signed.example.com/${key}`
      },
    }
    const mockRepository = createMockRepository()

    const handler = new StoreImageHandler(mockRepository, mockMediaManager)
    const command = new StoreImageCommand(mockFile, 'Test', 'Alt')

    const result = await handler.handle(command)

    assert.equal(capturedKey, 'images/test-image.jpg')
    assert.equal(result.signedUrl, 'https://signed.example.com/images/test-image.jpg')
  })
})
