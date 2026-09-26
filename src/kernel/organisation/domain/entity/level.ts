import { AppId } from '#shared/domain/app_id'

export class Level {
  constructor(
    private readonly id: AppId | null,
    private readonly departmentId: string,
    private readonly name: string,
    private readonly createdAt: Date | null,
    private readonly updatedAt: Date | null
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

  getCreatedAt(): Date | null {
    return this.createdAt
  }

  getUpdatedAt(): Date | null {
    return this.updatedAt
  }
}
