import { DateTime } from 'luxon'

export abstract class DateTimeUtils {
  static parseISODate(value: string): string {
    const dt = DateTime.fromISO(value)
    if (!dt.isValid) {
      throw new Error(`Invalid ISO date: ${value} (${dt.invalidReason})`)
    }
    return value
  }

  static parseISODateOrNull(value: string | undefined): string | null {
    if (value === undefined) return null
    return DateTimeUtils.parseISODate(value)
  }
}
