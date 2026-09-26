import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { StoreUploadHandler } from '#kernel/uploads/application/command_handler/store_upload.handler'
import { StoreUploadCommand } from '#kernel/uploads/application/command/store_upload_command'
import { UploadRepository } from '#kernel/uploads/domain/upload_repository'
import { MediaManagerInterface } from '#shared/application/services/upload/media_manager_interface'
import { MediaType } from '#shared/application/services/upload/types'
import { StoragePath } from '#shared/application/services/upload/storage_path'
import { AppFile } from '#shared/domain/app_file'
import { Upload } from '#kernel/uploads/domain/upload'

test.group('StoreUploadHandler', () => {
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
        uploadedAt: DateTime.now(),
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

  const createMockRepository = (): UploadRepository => ({
    save: async () => 'upload-123',
    findById: async () => null,
    findByUrl: async () => null,
    delete: async () => {},
  })

  test('should store an image and return id, url, signedUrl and type', async ({ assert }) => {
    const handler = new StoreUploadHandler(createMockRepository(), createMockMediaManager())
    const command = new StoreUploadCommand('user-1', createMockAppFile(), 'Test Image', 'A caption')

    const result = await handler.handle(command)

    assert.equal(result.id, 'upload-123')
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
    const handler = new StoreUploadHandler(createMockRepository(), createMockMediaManager())
    const command = new StoreUploadCommand('user-1', mockFile, 'Report', null)

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

    const handler = new StoreUploadHandler(createMockRepository(), mockMediaManager)
    await handler.handle(new StoreUploadCommand('user-1', createMockAppFile(), 'Test', 'Caption'))

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

    const handler = new StoreUploadHandler(createMockRepository(), mockMediaManager)

    try {
      await handler.handle(new StoreUploadCommand('user-1', createMockAppFile(), 'Test', null))
      assert.fail('Should have thrown an error')
    } catch (error) {
      assert.instanceOf(error, Error)
      assert.include((error as Error).message, 'Upload failed')
    }
  })

  test('should save Upload with correct data', async ({ assert }) => {
    let savedUpload: Upload | null = null

    const mockRepository: UploadRepository = {
      ...createMockRepository(),
      save: async (upload: Upload) => {
        savedUpload = upload
        return 'upload-456'
      },
    }

    const handler = new StoreUploadHandler(mockRepository, createMockMediaManager())
    await handler.handle(
      new StoreUploadCommand('user-1', createMockAppFile(), 'My File', 'My caption')
    )

    assert.isDefined(savedUpload)
    assert.equal(savedUpload!.getTitle(), 'My File')
    assert.equal(savedUpload!.getDescription(), 'My caption')
    assert.equal(savedUpload!.getUrl(), 'https://cdn.example.com/media/test-image.jpg')
    assert.equal(savedUpload!.getType(), MediaType.IMAGE)
    assert.equal(savedUpload!.getMimeType(), 'image/jpeg')
    assert.equal(savedUpload!.getSize(), 1024)
    assert.equal(savedUpload!.getCreatedBy(), 'user-1')
  })

  test('should use default values for title and description', async ({ assert }) => {
    let savedUpload: Upload | null = null

    const mockRepository: UploadRepository = {
      ...createMockRepository(),
      save: async (upload: Upload) => {
        savedUpload = upload
        return 'upload-789'
      },
    }

    const handler = new StoreUploadHandler(mockRepository, createMockMediaManager())
    await handler.handle(new StoreUploadCommand('user-1', createMockAppFile()))

    assert.equal(savedUpload!.getTitle(), '')
    assert.isNull(savedUpload!.getDescription())
  })

  test('should forward storagePath to the upload service', async ({ assert }) => {
    let capturedFileInfo: any = null

    const mockMediaManager: MediaManagerInterface = {
      ...createMockMediaManager(),
      uploadFile: async (fileInfo) => {
        capturedFileInfo = fileInfo
        return { success: true, url: 'https://cdn.example.com/test.jpg', key: 'test.jpg' }
      },
    }

    const handler = new StoreUploadHandler(createMockRepository(), mockMediaManager)
    await handler.handle(
      new StoreUploadCommand('user-1', createMockAppFile(), 'Test', null, StoragePath.DOCUMENTS)
    )

    assert.equal(capturedFileInfo.storagePath, StoragePath.DOCUMENTS)
  })
})
