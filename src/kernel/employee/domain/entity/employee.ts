import { AppId } from '#shared/domain/app_id'
import { DateTime } from 'luxon'

export class Employee {
  constructor(
    private readonly id: AppId | null,
    private readonly universityId: string,
    private readonly userId: string,
    private readonly createdAt: DateTime | null,
    private readonly updatedAt: DateTime | null
  ) {}

  getId() {
    return this.id?.value
  }

  getUniversityId(): string {
    return this.universityId
  }

  getUserId(): string {
    return this.userId
  }

  getCreatedAt(): DateTime | null {
    return this.createdAt
  }

  getUpdatedAt(): DateTime | null {
    return this.updatedAt
  }
}
