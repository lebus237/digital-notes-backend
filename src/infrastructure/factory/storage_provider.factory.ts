import { LocalProviderConfig, LocalStorageProvider } from '#infra/local_storage_provider'
import { RailwayStorageProvider } from '#infra/railway_storage_provider'
import { ContaboStorageProvider } from '#infra/contabo_storage_provider'
import { StorageProviderInterface } from '#shared/application/services/upload/storage_provider_interface'
import env from '#start/env'

export enum ProviderType {
  LOCAL = 'LOCAL',
  RAILWAY = 'RAILWAY',
  CONTABO = 'CONTABO',
}

export type ProviderConfig =
  | { type: ProviderType.LOCAL; config: LocalProviderConfig }
  | { type: ProviderType.RAILWAY }
  | { type: ProviderType.CONTABO }

export class StorageProviderFactory {
  /**
   * Create a storage provider based on configuration.
   *
   * The RAILWAY provider no longer accepts raw S3 credentials — those are
   * managed by the AdonisJS Drive `s3` disk configured in `config/drive.ts`.
   */
  static createProvider(providerConfig: ProviderConfig): StorageProviderInterface {
    switch (providerConfig.type) {
      case ProviderType.LOCAL:
        return new LocalStorageProvider(providerConfig.config)

      case ProviderType.RAILWAY:
        return new RailwayStorageProvider({
          basePath: env.get('STORAGE_BASE_PATH'),
          imageBasePath: env.get('IMAGE_STORAGE_BASE_PATH'),
          documentBasePath: env.get('DOCUMENT_STORAGE_BASE_PATH'),
        })

      case ProviderType.CONTABO:
        return new ContaboStorageProvider({
          basePath: env.get('STORAGE_BASE_PATH'),
          imageBasePath: env.get('IMAGE_STORAGE_BASE_PATH'),
          documentBasePath: env.get('DOCUMENT_STORAGE_BASE_PATH'),
        })

      default:
        throw new Error(`Unknown provider type: ${(providerConfig as any).type}`)
    }
  }

  /**
   * Create provider from environment variables.
   *
   * - `STORAGE_PROVIDER=LOCAL`   → uses the AdonisJS Drive `fs` disk (dev)
   * - `STORAGE_PROVIDER=RAILWAY` → uses the AdonisJS Drive `s3` disk (prod)
   */
  static createFromEnv(): StorageProviderInterface {
    const providerType = env.get('STORAGE_PROVIDER') as ProviderType

    if (!providerType) {
      throw new Error('STORAGE_PROVIDER environment variable is not set')
    }

    switch (providerType) {
      case ProviderType.LOCAL:
        return new LocalStorageProvider({
          storagePath: env.get('STORAGE_BASE_PATH') || './storage',
          baseUrl: env.get('LOCAL_STORAGE_URL') || 'http://localhost:3000/uploads',
          basePath: env.get('STORAGE_BASE_PATH'),
          imageBasePath: env.get('IMAGE_STORAGE_BASE_PATH'),
          documentBasePath: env.get('DOCUMENT_STORAGE_BASE_PATH'),
        })

      case ProviderType.RAILWAY:
        return new RailwayStorageProvider({
          basePath: env.get('STORAGE_BASE_PATH'),
          imageBasePath: env.get('IMAGE_STORAGE_BASE_PATH'),
          documentBasePath: env.get('DOCUMENT_STORAGE_BASE_PATH'),
        })

      case ProviderType.CONTABO:
        return new ContaboStorageProvider({
          basePath: env.get('STORAGE_BASE_PATH'),
          imageBasePath: env.get('IMAGE_STORAGE_BASE_PATH'),
          documentBasePath: env.get('DOCUMENT_STORAGE_BASE_PATH'),
        })

      default:
        throw new Error(`Unknown provider type: ${providerType}`)
    }
  }
}
