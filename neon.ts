import { defineConfig } from '@neon/config/v1'

export default defineConfig({
  // Declare your Neon services here
  auth: false,
  // Object storage buckets, provisioned per branch with `neon deploy`.
  // Object keys are app-owned: see NEON_STORAGE_BUCKET / NEON_DOCS_STORAGE_BUCKET.
  buckets: {
    media: { access: 'private' },
    docs: { access: 'private' },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {}
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: '7d' }
    }
    // Existing branch: no changes
    return {}
  },
})
