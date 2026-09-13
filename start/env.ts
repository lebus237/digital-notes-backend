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
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  /**
   * 'fs'  → local filesystem (development)
   * 's3'  → Railway S3-compatible object storage (production)
   * 'contabo' → Contabo S3-compatible object storage (production)
   */
  DRIVE_DISK: Env.schema.enum(['fs', 's3', 'contabo'] as const),

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
  | Optional sub-path overrides shared by all providers
  |----------------------------------------------------------
  */
  IMAGE_STORAGE_BASE_PATH: Env.schema.string.optional(),
  DOCUMENT_STORAGE_BASE_PATH: Env.schema.string.optional(),
})
