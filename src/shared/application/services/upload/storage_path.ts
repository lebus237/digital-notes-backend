export enum StoragePath {
  IMAGES = 'images',
  DOCUMENTS = 'documents',
  RAW_NOTES = 'raw-notes',
}

export const DEFAULT_IMAGE_STORAGE_PATH = StoragePath.IMAGES
export const DEFAULT_DOCUMENT_STORAGE_PATH = StoragePath.DOCUMENTS

export function resolveStorageSubPath(
  mediaType: string | undefined,
  custom?: StoragePath,
  fallback?: { image?: string; document?: string }
): string {
  if (custom) {
    return custom
  }
  if (mediaType === 'image') {
    return fallback?.image || DEFAULT_IMAGE_STORAGE_PATH
  }
  return fallback?.document || DEFAULT_DOCUMENT_STORAGE_PATH
}
