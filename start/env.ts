/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test', 'stage'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Variables for configuring the database connection
  |----------------------------------------------------------
  | DB_DRIVER=neon     → connect via DATABASE_URL (Neon, TLS enforced)
  | DB_DRIVER=postgres → connect via the discrete DB_* values below
  */
  DB_DRIVER: Env.schema.enum.optional(['neon', 'postgres'] as const),
  DATABASE_URL: Env.schema.string.optional(),
  DB_SSL: Env.schema.enum.optional(['true', 'false', 'no-verify'] as const),

  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  /**
   * 'fs'  → local filesystem (development)
   * 's3'  → Railway S3-compatible object storage (production)
   * 'contabo' → Contabo S3-compatible object storage (production)
   * 'neon' → Neon object storage, media bucket (development / production)
   * 'neon_docs' → Neon object storage, documents bucket
   */
  DRIVE_DISK: Env.schema.enum(['fs', 's3', 'contabo', 'neon', 'neon_docs'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring storage provider
  |----------------------------------------------------------
  */
  STORAGE_PROVIDER: Env.schema.string(),
  STORAGE_BASE_PATH: Env.schema.string(),
  LOCAL_STORAGE_PATH: Env.schema.string(),
  LOCAL_STORAGE_URL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Railway object storage
  | (S3-compatible; required when DRIVE_DISK=s3)
  |----------------------------------------------------------
  */
  RAILWAY_STORAGE_ENDPOINT: Env.schema.string.optional(),
  RAILWAY_STORAGE_ACCESS_KEY_ID: Env.schema.string.optional(),
  RAILWAY_STORAGE_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  RAILWAY_STORAGE_BUCKET: Env.schema.string.optional(),
  RAILWAY_STORAGE_REGION: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Contabo object storage
  | (S3-compatible; required when DRIVE_DISK=contabo)
  |----------------------------------------------------------
  */
  CONTABO_STORAGE_ENDPOINT: Env.schema.string.optional(),
  CONTABO_STORAGE_ACCESS_KEY_ID: Env.schema.string.optional(),
  CONTABO_STORAGE_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  CONTABO_STORAGE_BUCKET: Env.schema.string.optional(),
  CONTABO_STORAGE_REGION: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Neon object storage
  | (S3-compatible; AWS_* are written by `neon env pull`)
  |----------------------------------------------------------
  */
  AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  AWS_ENDPOINT_URL_S3: Env.schema.string.optional(),
  AWS_REGION: Env.schema.string.optional(),
  /** Neon bucket holding image objects */
  NEON_STORAGE_BUCKET: Env.schema.string.optional(),
  /** Neon bucket holding document objects */
  NEON_DOCS_STORAGE_BUCKET: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Optional sub-path overrides shared by all providers
  |----------------------------------------------------------
  */
  IMAGE_STORAGE_BASE_PATH: Env.schema.string.optional(),
  DOCUMENT_STORAGE_BASE_PATH: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Comma-separated browser origins allowed to call the API
  | with credentials. Example: http://localhost:3000
  |----------------------------------------------------------
  */
  CORS_ORIGINS: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Multipart upload ceiling in megabytes (hard-capped at 10)
  |----------------------------------------------------------
  */
  MAX_FILE_SIZE_MB: Env.schema.number.optional(),
})
