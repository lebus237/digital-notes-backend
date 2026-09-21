import { test } from '@japa/runner'
import { StoreMediaHandler } from '#kernel/medias/application/command_handler/store_media.handler'
import { StoreMediaCommand } from '#kernel/medias/application/command/store_media_command'
import { MediaRepository } from '#kernel/medias/domain/media_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { MediaType } from '#shared/application/services/upload/types'
import { AppFile } from '#shared/domain/app_file'
import { Media } from '#kernel/medias/domain/media'

test.group('StoreMediaHandler', () => {
  const createMockAppFile = (overrides: Partial<AppFile> = {}): AppFile => {
    return {
      getBuffer: async () => Buffer.from('test-file-data'),
      originalName: 'test-image.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
      metadata: {},
      getFile: () => ({}) as any,
      ...overrides,
    } as AppFile
  }

  const createMockMediaManager = (): MediaManagerInterface => ({
    uploadFile: async () => ({
      success: true,
      url: 'https://cdn.example.com/media/test-image.jpg',
      key: 'media/test-image.jpg',
      metadata: {
        originalName: 'test-image.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
        uploadedAt: new Date(),
      },
    }),
    uploadImage: async () => ({ success: true }),
    uploadDocument: async () => ({ success: true }),
    deleteFile: async () => true,
    getSignedUrl: async () => 'https://signed-url.example.com/media.jpg',
    fileExists: async () => true,
    getFileMetadata: async () => ({}),
    getMediaType: (mimeType: string) =>
      mimeType.startsWith('image/') ? MediaType.IMAGE : MediaType.DOCUMENT,
    setProvider: () => {},
    getProvider: () => ({}) as any,
  })

  const createMockRepository = (): MediaRepository => ({
    save: async () => 'media-123',
    findById: async () => null,
    findByUrl: async () => null,
    delete: async () => {},
  })

  test('should store an image and return id, url, signedUrl and type', async ({ assert }) => {
    const handler = new StoreMediaHandler(createMockRepository(), createMockMediaManager())
    const command = new StoreMediaCommand('user-1', createMockAppFile(), 'Test Image', 'A caption')

    const result = await handler.handle(command)

    assert.equal(result.id, 'media-123')
    assert.equal(result.url, 'https://cdn.example.com/media/test-image.jpg')
    assert.equal(result.signedUrl, 'https://signed-url.example.com/media.jpg')
    assert.equal(result.type, MediaType.IMAGE)
  })

  test('should store a document and return type=document', async ({ assert }) => {
    const mockFile = createMockAppFile({
      originalName: 'report.pdf',
      mimeType: 'application/pdf',
      size: 2048,
    })
    const handler = new StoreMediaHandler(createMockRepository(), createMockMediaManager())
    const command = new StoreMediaCommand('user-1', mockFile, 'Report', null)

    const result = await handler.handle(command)

    assert.equal(result.type, MediaType.DOCUMENT)
  })

  test('should call uploadService with correct file data', async ({ assert }) => {
    let capturedFileInfo: any = null

    const mockMediaManager: MediaManagerInterface = {
      ...createMockMediaManager(),
      uploadFile: async (fileInfo) => {
        capturedFileInfo = fileInfo
        return {
          success: true,
          url: 'https://cdn.example.com/test.jpg',
          key: 'test.jpg',
        }
      },
    }

    const handler = new StoreMediaHandler(createMockRepository(), mockMediaManager)
    await handler.handle(new StoreMediaCommand('user-1', createMockAppFile(), 'Test', 'Caption'))

    assert.equal(capturedFileInfo.originalName, 'test-image.jpg')
    assert.equal(capturedFileInfo.mimeType, 'image/jpeg')
    assert.equal(capturedFileInfo.size, 1024)
  })

  test('should throw error when upload fails', async ({ assert }) => {
    const mockMediaManager: MediaManagerInterface = {
      ...createMockMediaManager(),
      uploadFile: async () => ({
        success: false,
        error: 'Upload failed: Invalid file type',
      }),
    }

    const handler = new StoreMediaHandler(createMockRepository(), mockMediaManager)

    try {
      await handler.handle(new StoreMediaCommand('user-1', createMockAppFile(), 'Test', null))
      assert.fail('Should have thrown an error')
    } catch (error) {
      assert.instanceOf(error, Error)
      assert.include((error as Error).message, 'Upload failed')
    }
  })

  test('should save Media with correct data', async ({ assert }) => {
    let savedMedia: Media | null = null

    const mockRepository: MediaRepository = {
      ...createMockRepository(),
      save: async (media: Media) => {
        savedMedia = media
        return 'media-456'
      },
    }

    const handler = new StoreMediaHandler(mockRepository, createMockMediaManager())
    await handler.handle(
      new StoreMediaCommand('user-1', createMockAppFile(), 'My File', 'My caption')
    )

    assert.isDefined(savedMedia)
    assert.equal(savedMedia!.getTitle(), 'My File')
    assert.equal(savedMedia!.getDescription(), 'My caption')
    assert.equal(savedMedia!.getUrl(), 'https://cdn.example.com/media/test-image.jpg')
    assert.equal(savedMedia!.getType(), MediaType.IMAGE)
    assert.equal(savedMedia!.getMimeType(), 'image/jpeg')
    assert.equal(savedMedia!.getSize(), 1024)
    assert.equal(savedMedia!.getCreatedBy(), 'user-1')
  })

  test('should use default values for title and description', async ({ assert }) => {
    let savedMedia: Media | null = null

    const mockRepository: MediaRepository = {
      ...createMockRepository(),
      save: async (media: Media) => {
        savedMedia = media
        return 'media-789'
      },
    }

    const handler = new StoreMediaHandler(mockRepository, createMockMediaManager())
    await handler.handle(new StoreMediaCommand('user-1', createMockAppFile()))

    assert.equal(savedMedia!.getTitle(), '')
    assert.isNull(savedMedia!.getDescription())
  })
})
