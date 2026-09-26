import { DateTime } from 'luxon'
export interface Command {
  readonly timestamp: DateTime
}
