/**
 * Branded types for type-safe identifiers
 * These prevent mixing up different ID types
 */

declare const brand: unique symbol

export type Brand<T, TBrand> = T & { readonly [brand]: TBrand }

export type UserId = Brand<string, 'UserId'>

/**
 * Helper to create branded IDs (for internal use)
 */
export function asUserId(id: string): UserId {
  return id as UserId
}

/**
 * UUID validation helper
 */
function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Convert branded IDs back to strings for persistence layer
 * Use these when passing IDs to Active Record methods
 */
export function toUserIdString(id: UserId): string {
  return id as string
}
