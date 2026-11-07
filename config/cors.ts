import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

const LOCAL_FRONTEND_ORIGINS = [
  ...[3000, 3001, 3002, 3003].flatMap((port) => [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ]),
]

function allowedOrigins(): string[] {
  const configuredOrigins = (env.get('CORS_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)

  if (env.get('NODE_ENV') === 'development' || env.get('NODE_ENV') === 'test') {
    return [...new Set([...configuredOrigins, ...LOCAL_FRONTEND_ORIGINS])]
  }

  return configuredOrigins
}

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: (origin) => allowedOrigins().includes(origin),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
