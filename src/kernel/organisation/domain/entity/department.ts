import { AppId } from '#shared/domain/app_id'
import { DateTime } from 'luxon'

export class Department {
  constructor(
    private readonly id: AppId | null,
    private readonly facultyId: string,
    private readonly name: string,
    private readonly slug: string,
    private readonly createdAt: DateTime | null,
    private readonly updatedAt: DateTime | null
  ) {}

  getId() {
    return this.id?.value
  }

  getFacultyId(): string {
    return this.facultyId
  }

  getName(): string {
    return this.name
  }

  getSlug(): string {
    return this.slug
  }

  getCreatedAt(): DateTime | null {
    return this.createdAt
  }

  getUpdatedAt(): DateTime | null {
    return this.updatedAt
  }
}
