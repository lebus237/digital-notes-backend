import { test } from '@japa/runner'
import { ImageMedia } from '#kernel/medias/domain/image_media'
import { AppId } from '#shared/domain/app_id'

test.group('ImageMedia Entity', () => {
  const IMG_123 = '00000000-0000-4000-8000-000000000123'
  const IMG_1 = '00000000-0000-4000-8000-000000000001'
  const TEST_ID_123 = '00000000-0000-4000-8000-0000000000a1'

  const createMockImageMedia = () => {
    return new ImageMedia(
      AppId.fromString(IMG_123),
      'Test Image',
      'https://example.com/image.jpg',
      'A test image description',
      { width: 800, height: 600 },
      new Date('2024-01-01'),
      new Date('2024-01-15'),
      'images/test-image.jpg',
      'user-1'
    )
  }

  // ============================================
  // Constructor
  // ============================================

  test('should create image media with all properties', ({ assert }) => {
    const image = createMockImageMedia()

    assert.equal(image.getId(), IMG_123)
    assert.equal(image.getTitle(), 'Test Image')
    assert.equal(image.getUrl(), 'https://example.com/image.jpg')
    assert.equal(image.getAltDescription(), 'A test image description')
  })

  test('should accept null id for new entities', ({ assert }) => {
    const image = new ImageMedia(
      null,
      'New Image',
      'https://example.com/new.jpg',
      'Description',
      {},
      null,
      null
    )

    assert.isUndefined(image.getId())
  })

  // ============================================
  // Getters
  // ============================================

  test('should return id via getId', ({ assert }) => {
    const image = new ImageMedia(
      AppId.fromString(TEST_ID_123),
      'Test',
      'https://example.com/test.jpg',
      'Alt',
      {},
      null,
      null
    )

    assert.equal(image.getId(), TEST_ID_123)
  })

  test('should return undefined id when null', ({ assert }) => {
    const image = new ImageMedia(
      null,
      'Test',
      'https://example.com/test.jpg',
      'Alt',
      {},
      null,
      null
    )

    assert.isUndefined(image.getId())
  })

  test('should return url via getUrl', ({ assert }) => {
    const image = createMockImageMedia()

    assert.equal(image.getUrl(), 'https://example.com/image.jpg')
  })

  test('should return title via getTitle', ({ assert }) => {
    const image = createMockImageMedia()

    assert.equal(image.getTitle(), 'Test Image')
  })

  test('should return altDescription via getAltDescription', ({ assert }) => {
    const image = createMockImageMedia()

    assert.equal(image.getAltDescription(), 'A test image description')
  })

  test('should return metadata via getMetadata', ({ assert }) => {
    const image = createMockImageMedia()

    assert.deepEqual(image.getMetadata(), { width: 800, height: 600 })
  })

  test('should return relativeKey via getRelativeKey', ({ assert }) => {
    const image = createMockImageMedia()

    assert.equal(image.getRelativeKey(), 'images/test-image.jpg')
  })

  test('should return undefined relativeKey when not provided', ({ assert }) => {
    const image = new ImageMedia(
      AppId.fromString(IMG_1),
      'Test',
      'https://example.com/test.jpg',
      'Alt',
      {},
      null,
      null
    )

    assert.isUndefined(image.getRelativeKey())
  })

  test('should return createdAt via getCreatedAt', ({ assert }) => {
    const date = new Date('2024-01-01')
    const image = new ImageMedia(AppId.fromString(IMG_1), 'Test', 'url', 'Alt', {}, date, null)

    assert.deepEqual(image.getCreatedAt(), date)
  })

  test('should return null createdAt when not provided', ({ assert }) => {
    const image = new ImageMedia(AppId.fromString(IMG_1), 'Test', 'url', 'Alt', {}, null, null)

    assert.isNull(image.getCreatedAt())
  })

  test('should return updatedAt via getUpdatedAt', ({ assert }) => {
    const date = new Date('2024-01-15')
    const image = new ImageMedia(AppId.fromString(IMG_1), 'Test', 'url', 'Alt', {}, null, date)

    assert.deepEqual(image.getUpdatedAt(), date)
  })

  test('should return null updatedAt when not provided', ({ assert }) => {
    const image = new ImageMedia(AppId.fromString(IMG_1), 'Test', 'url', 'Alt', {}, null, null)

    assert.isNull(image.getUpdatedAt())
  })

  test('should return key via getKey', ({ assert }) => {
    const image = createMockImageMedia()

    assert.equal(image.getKey(), 'images/test-image.jpg')
  })
})
