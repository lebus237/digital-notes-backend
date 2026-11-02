import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const nodeEnv = env.get('NODE_ENV')
const isTest = nodeEnv === 'test'
const dbDriver = env.get('DB_DRIVER')
const dbSsl = env.get('DB_SSL') ?? (isTest ? 'false' : 'true')

if (dbSsl && !['true', 'false', 'no-verify'].includes(dbSsl)) {
  throw new Error(`DB_SSL must be one of 'true', 'false', 'no-verify' (received: '${dbSsl}')`)
}

if ((nodeEnv === 'production' || nodeEnv === 'stage') && dbSsl === 'false') {
  throw new Error(
    "DB_SSL must be 'true' or 'no-verify' in production/stage (plaintext DB connections are refused)"
  )
}

if (!dbDriver && env.get('DATABASE_URL')) {
  console.warn(
    'DATABASE_URL is set but DB_DRIVER is not. Falling back to DB_DRIVER=postgres and ignoring DATABASE_URL. Set DB_DRIVER=neon to use it.'
  )
}

/**
 * `no-verify` keeps TLS on but skips certificate verification, for servers
 * using self-signed certificates. Prefer `true`.
 */
const sslConfig = { rejectUnauthorized: dbSsl !== 'no-verify' }

function resolveConnection() {
  if (dbDriver === 'neon') {
    const connectionString = env.get('DATABASE_URL')
    if (!connectionString) {
      throw new Error('DB_DRIVER=neon requires the DATABASE_URL environment variable')
    }

    return { connectionString, ssl: sslConfig }
  }

  /*
   * Functional tests run against a dedicated local database. These defaults
   * match docker-compose.test.yml so a fresh checkout can run the suite
   * without extra configuration. Values from the environment always win.
   */
  const connection = {
    host: env.get('DB_HOST') ?? (isTest ? '127.0.0.1' : undefined),
    port: env.get('DB_PORT') ?? (isTest ? 5433 : undefined),
    user: env.get('DB_USER') ?? (isTest ? 'postgres' : undefined),
    password: env.get('DB_PASSWORD') ?? (isTest ? 'postgres' : undefined),
    database: env.get('DB_DATABASE') ?? (isTest ? 'digitalnotes_test' : undefined),
  }

  /*
   * Every non-test environment fails fast on incomplete configuration.
   */
  if (!isTest) {
    const missing = Object.entries(connection)
      .filter(([, value]) => value === undefined || value === null || value === '')
      .map(([key]) => `DB_${key.toUpperCase()}`)

    if (missing.length > 0) {
      throw new Error(
        `DB_DRIVER=postgres requires these environment variables: ${missing.join(', ')}`
      )
    }
  }

  return dbSsl === 'false' ? connection : { ...connection, ssl: sslConfig }
}

const dbConfig = defineConfig({
  prettyPrintDebugQueries: nodeEnv === 'development',
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: resolveConnection(),
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
        disableRollbacksInProduction: true,
      },
    },
  },
})

export default dbConfig
