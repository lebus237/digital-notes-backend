import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const nodeEnv = env.get('NODE_ENV')
const dbDriver = env.get('DB_DRIVER')
const dbSsl = env.get('DB_SSL') ?? 'false'

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

  const connection = {
    host: env.get('DB_HOST'),
    port: env.get('DB_PORT'),
    user: env.get('DB_USER'),
    password: env.get('DB_PASSWORD'),
    database: env.get('DB_DATABASE'),
  }

  /*
   * The test suite boots without any env file and never connects to the
   * database, so the values are allowed to be missing there. Every other
   * environment fails fast on incomplete configuration.
   */
  if (nodeEnv !== 'test') {
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
