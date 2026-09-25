import { test } from '@japa/runner'
import { NeonStorageProvider } from '#infra/neon_storage_provider'
import { MediaType } from '#shared/application/services/upload/types'
import { StoragePath } from '#shared/application/services/upload/storage_path'

const createFakeDisk = () => {
  const calls = {
    put: [] as Array<{ key: string; options: any }>,
    delete: [] as string[],
    getSignedUrl: [] as string[],
    exists: [] as string[],
    getMetaData: [] as string[],
  }

  return {
    calls,
    put: async (key: string, _body: any, options: any) => {
      calls.put.push({ key, options })
    },
    getUrl: async (key: string) => `https://storage.example.com/${key}`,
    getSignedUrl: async (key: string) => {
      calls.getSignedUrl.push(key)
      return `https://signed.example.com/${key}`
    },
    delete: async (key: string) => {
      calls.delete.push(key)
    },
    exists: async (key: string) => {
      calls.exists.push(key)
      return true
    },
    getMetaData: async (key: string) => {
      calls.getMetaData.push(key)
      return { key }
    },
  }
}

const createProvider = (basePath = 'uploads') => {
  const mediaDisk = createFakeDisk()
  const docsDisk = createFakeDisk()
  const provider = new NeonStorageProvider(
    { basePath, imageBasePath: 'images', documentBasePath: 'documents' },
    { media: mediaDisk as any, docs: docsDisk as any }
  )

  return { provider, mediaDisk, docsDisk }
}

const imageFileInfo = {
  buffer: Buffer.from('image-bytes'),
  originalName: 'photo.jpg',
  mimeType: 'image/jpeg',
  size: 11,
  type: MediaType.IMAGE,
}

const documentFileInfo = {
  buffer: Buffer.from('document-bytes'),
  originalName: 'report.pdf',
  mimeType: 'application/pdf',
  size: 14,
  type: MediaType.DOCUMENT,
}

test.group('NeonStorageProvider', () => {
  test('should upload an image to the media disk', async ({ assert }) => {
    const { provider, mediaDisk, docsDisk } = createProvider()

    const result = await provider.upload(imageFileInfo)

    assert.isTrue(result.success)
    assert.lengthOf(mediaDisk.calls.put, 1)
    assert.lengthOf(docsDisk.calls.put, 0)
    assert.match(mediaDisk.calls.put[0].key, /^uploads\/images\/\d+-[a-z0-9]+\.jpg$/)
    assert.equal(result.key, mediaDisk.calls.put[0].key)
    assert.equal(result.url, `https://storage.example.com/${result.key}`)
  })

  test('should upload a document to the docs disk', async ({ assert }) => {
    const { provider, mediaDisk, docsDisk } = createProvider()

    const result = await provider.upload(documentFileInfo)

    assert.isTrue(result.success)
    assert.lengthOf(docsDisk.calls.put, 1)
    assert.lengthOf(mediaDisk.calls.put, 0)
    assert.match(docsDisk.calls.put[0].key, /^uploads\/documents\/\d+-[a-z0-9]+\.pdf$/)
  })

  test('should pass content type and metadata to the upload', async ({ assert }) => {
    const { provider, docsDisk } = createProvider()

    await provider.upload(documentFileInfo)

    const options = docsDisk.calls.put[0].options
    assert.equal(options.contentType, 'application/pdf')
    assert.equal(options.contentLength, 14)
    assert.equal(options.metadata.originalName, 'report.pdf')
  })

  test('should omit the base path when none is configured', async ({ assert }) => {
    const { provider, mediaDisk } = createProvider('')

    await provider.upload(imageFileInfo)

    assert.match(mediaDisk.calls.put[0].key, /^images\/\d+-[a-z0-9]+\.jpg$/)
  })

  test('should delete a document key from the docs disk', async ({ assert }) => {
    const { provider, mediaDisk, docsDisk } = createProvider()

    const deleted = await provider.delete('uploads/documents/report.pdf')

    assert.isTrue(deleted)
    assert.deepEqual(docsDisk.calls.delete, ['uploads/documents/report.pdf'])
    assert.lengthOf(mediaDisk.calls.delete, 0)
  })

  test('should delete an image key from the media disk', async ({ assert }) => {
    const { provider, mediaDisk, docsDisk } = createProvider()

    const deleted = await provider.delete('uploads/images/photo.jpg')

    assert.isTrue(deleted)
    assert.deepEqual(mediaDisk.calls.delete, ['uploads/images/photo.jpg'])
    assert.lengthOf(docsDisk.calls.delete, 0)
  })

  test('should route signed URLs by key prefix', async ({ assert }) => {
    const { provider, mediaDisk, docsDisk } = createProvider()

    const imageUrl = await provider.getSignedUrl('uploads/images/photo.jpg')
    const documentUrl = await provider.getSignedUrl('uploads/documents/report.pdf')

    assert.equal(imageUrl, 'https://signed.example.com/uploads/images/photo.jpg')
    assert.equal(documentUrl, 'https://signed.example.com/uploads/documents/report.pdf')
    assert.deepEqual(mediaDisk.calls.getSignedUrl, ['uploads/images/photo.jpg'])
    assert.deepEqual(docsDisk.calls.getSignedUrl, ['uploads/documents/report.pdf'])
  })

  test('should route exists and metadata lookups by key prefix', async ({ assert }) => {
    const { provider, mediaDisk, docsDisk } = createProvider()

    await provider.exists('uploads/documents/report.pdf')
    await provider.getMetadata('uploads/images/photo.jpg')

    assert.deepEqual(docsDisk.calls.exists, ['uploads/documents/report.pdf'])
    assert.lengthOf(mediaDisk.calls.exists, 0)
    assert.deepEqual(mediaDisk.calls.getMetaData, ['uploads/images/photo.jpg'])
    assert.lengthOf(docsDisk.calls.getMetaData, 0)
  })

  test('should use the payload storagePath as an override', async ({ assert }) => {
    const { provider, mediaDisk, docsDisk } = createProvider()

    const result = await provider.upload({ ...imageFileInfo, storagePath: StoragePath.DOCUMENTS })

    assert.isTrue(result.success)
    assert.match(mediaDisk.calls.put[0].key, /^uploads\/documents\/\d+-[a-z0-9]+\.jpg$/)
    assert.lengthOf(docsDisk.calls.put, 0)
  })

  test('should return a failed result when the upload throws', async ({ assert }) => {
    const mediaDisk = createFakeDisk()
    mediaDisk.put = async () => {
      throw new Error('SignatureDoesNotMatch')
    }
    const provider = new NeonStorageProvider({}, { media: mediaDisk as any, docs: {} as any })

    const result = await provider.upload(imageFileInfo)

    assert.isFalse(result.success)
    assert.equal(result.error, 'SignatureDoesNotMatch')
  })
})
