import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'
import { MediaUploadService } from '#core/application/services/media-upload/media_upload_service'
import { InMemoryStorageProvider } from './functional/support/in_memory_storage_provider.js'

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Storage used by the upload and note endpoints. Tests never touch a real
 * disk or bucket, but they do exercise the real HTTP + validation pipeline.
 */
export const testStorage = new InMemoryStorageProvider()

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [assert(), apiClient(), pluginAdonisJS(app)]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    () => {
      testStorage.clear()

      /*
       * The service provider deliberately skips the media service in the
       * test environment, so tests provide their own storage-backed one.
       */
      app.container.bindValue('MediaUploadService', new MediaUploadService(testStorage))
    },
  ],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
