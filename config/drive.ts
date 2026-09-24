import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  /**
   * The services object can be used to configure multiple file system
   * services each using the same or a different driver.
   */
  services: {
    /**
     * Local filesystem driver — used in development.
     * Files are served directly by the AdonisJS HTTP server.
     */
    fs: services.fs({
      location: app.makePath(env.get('LOCAL_STORAGE_PATH')),
      serveFiles: true,
      routeBasePath: env.get('STORAGE_BASE_PATH'),
      visibility: 'public',
      appUrl: env.get('LOCAL_STORAGE_URL'),
    }),

    /**
     * S3-compatible driver — used in production (Railway Object Storage).
     * Railway exposes an S3-compatible API; we configure it with
     * `forcePathStyle: true` and the Railway-provided endpoint.
     */
    s3: services.s3({
      credentials: {
        accessKeyId: env.get('RAILWAY_STORAGE_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('RAILWAY_STORAGE_SECRET_ACCESS_KEY', ''),
      },
      region: env.get('RAILWAY_STORAGE_REGION', 'auto'),
      endpoint: env.get('RAILWAY_STORAGE_ENDPOINT', ''),
      bucket: env.get('RAILWAY_STORAGE_BUCKET', ''),
      visibility: 'private',
      /**
       * Railway Object Storage uses path-style URLs
       * (e.g. https://endpoint/<bucket>/<key>).
       */
      forcePathStyle: true,
      /**
       * Railway / Cloudflare-compatible storage does not support ACL.
       */
      supportsACL: false,
    }),

    /**
     * S3-compatible driver — used in production (Contabo Object Storage).
     * Contabo provides S3-compatible object storage for VPS deployments via Coolify.
     * Uses path-style URLs similar to other S3-compatible providers.
     */
    contabo: services.s3({
      credentials: {
        accessKeyId: env.get('CONTABO_STORAGE_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('CONTABO_STORAGE_SECRET_ACCESS_KEY', ''),
      },
      region: env.get('CONTABO_STORAGE_REGION', 'auto'),
      endpoint: env.get('CONTABO_STORAGE_ENDPOINT', ''),
      bucket: env.get('CONTABO_STORAGE_BUCKET', ''),
      visibility: 'private',
      /**
       * Contabo Object Storage uses path-style URLs
       * (e.g. https://endpoint/<bucket>/<key>).
       */
      forcePathStyle: true,
      /**
       * Contabo storage does not support ACL.
       */
      supportsACL: false,
    }),

    /**
     * S3-compatible driver — Neon object storage, media bucket (image objects).
     *
     * Credentials are AWS-standard variables written by `neon env pull`; the
     * buckets themselves are declared in `neon.ts` and provisioned per branch
     * with `neon deploy`. The bucket names are app-owned and read from
     * NEON_STORAGE_BUCKET / NEON_DOCS_STORAGE_BUCKET.
     */
    neon: services.s3({
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY', ''),
      },
      region: env.get('AWS_REGION', 'us-east-2'),
      endpoint: env.get('AWS_ENDPOINT_URL_S3', ''),
      bucket: env.get('NEON_STORAGE_BUCKET', ''),
      visibility: 'private',
      /**
       * Neon's storage gateway only speaks path-style addressing (SigV4).
       */
      forcePathStyle: true,
      /**
       * Neon does not support ACLs; read access is granted through presigned URLs.
       */
      supportsACL: false,
    }),

    /**
     * S3-compatible driver — Neon object storage, documents bucket.
     */
    neon_docs: services.s3({
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY', ''),
      },
      region: env.get('AWS_REGION', 'us-east-2'),
      endpoint: env.get('AWS_ENDPOINT_URL_S3', ''),
      bucket: env.get('NEON_DOCS_STORAGE_BUCKET', ''),
      visibility: 'private',
      forcePathStyle: true,
      supportsACL: false,
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
