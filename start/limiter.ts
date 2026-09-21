import env from '#start/env'
import limiter from '@adonisjs/limiter/services/main'

function requestsOrNone(requests: number, blockFor?: string) {
  if (env.get('NODE_ENV') === 'test') {
    return limiter.noLimit()
  }

  const httpLimiter = limiter.allowRequests(requests).every('1 minute')

  return blockFor ? httpLimiter.blockFor(blockFor) : httpLimiter
}

export const authThrottle = limiter.define('auth', () => {
  return requestsOrNone(5, '5 minutes')
})

export const mediaStoreThrottle = limiter.define('mediaStore', () => {
  return requestsOrNone(20)
})

export const mediaDestroyThrottle = limiter.define('mediaDestroy', () => {
  return requestsOrNone(30)
})
