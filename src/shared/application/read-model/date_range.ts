import { DateTime } from 'luxon'

export class DateRange {
  constructor(
    public fromDate: string | null = null,
    public toDate: string | null = DateTime.now().toISO()
  ) {
    this.fromDate = fromDate ?? DateTime.now().minus({ days: 30 }).toISO()
  }
}
