import { AppId } from '#shared/domain/app_id'

export class University {
  constructor(
    private readonly id: AppId | null,
    private readonly name: string,
    private readonly slug: string,
    private readonly createdAt: Date | null,
    private readonly updatedAt: Date | null
  ) {}

  getId() {
    return this.id?.value
  }

  getName(): string {
    return this.name
  }

  getSlug(): string {
    return this.slug
  }

  getCreatedAt(): Date | null {
    return this.createdAt
  }

  getUpdatedAt(): Date | null {
    return this.updatedAt
  }
}
