import { AppId } from '#shared/domain/app_id'
import { DateTime } from 'luxon'

export class Semester {
  constructor(
    private readonly id: AppId | null,
    private readonly name: string,
    private readonly createdAt: DateTime | null,
    private readonly updatedAt: DateTime | null
  ) {}

  getId() {
    return this.id?.value
  }

  getName(): string {
    return this.name
  }

  getCreatedAt(): DateTime | null {
    return this.createdAt
  }

  getUpdatedAt(): DateTime | null {
    return this.updatedAt
  }
}
