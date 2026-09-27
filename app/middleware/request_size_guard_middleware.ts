import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

/**
 * Early request-size gate (server stack → runs BEFORE the bodyparser).
 *
 * Containment for GHSA-xx9g-fh25-4q64 (unrestricted memory buffering in the
 * bodyparser PartHandler during file-type detection, @adonisjs/bodyparser
 * <=10.1.2). The parser buffers part bytes in memory while sniffing the file
 * type, so an oversized declared body can spike memory before the parser's own
 * `limit` kicks in. Rejecting on `Content-Length` up-front means the parser
 * never sees those bytes.
 *
 * Uses the same ceiling as `config/bodyparser.ts` (MAX_FILE_SIZE_MB,
 * hard-capped at 10). Chunked bodies without `Content-Length` cannot be judged
 * early and still flow to the parser — that residual is documented, not fixed,
 * here. The real cure remains upgrading past the advisory range.
 */
export default class RequestSizeGuardMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const rawLength = request.header('content-length')
    if (rawLength !== undefined) {
      const length = Number(rawLength)
      if (Number.isFinite(length) && length >= 0) {
        const configuredMb = env.get('MAX_FILE_SIZE_MB') ?? 2
        const capBytes = Math.min(10, configuredMb) * 1024 * 1024
        if (length > capBytes) {
          return response.status(413).send({
            status: 'error',
            error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' },
          })
        }
      }
    }

    return next()
  }
}
