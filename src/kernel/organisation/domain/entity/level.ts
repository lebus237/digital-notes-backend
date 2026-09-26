import { AppId } from '#shared/domain/app_id'
import { DateTime } from 'luxon'

export class Level {
  constructor(
    private readonly id: AppId | null,
    private readonly departmentId: string,
    private readonly name: string,
    private readonly createdAt: DateTime | null,
    private readonly updatedAt: DateTime | null
  ) {}

  getId() {
    return this.id?.value
  }

  getDepartmentId(): string {
    return this.departmentId
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
