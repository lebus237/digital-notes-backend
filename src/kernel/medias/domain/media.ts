import { AppId } from '#shared/domain/app_id'
import { MediaType } from '#shared/application/services/upload/types'

export class Media {
  constructor(
    private readonly id: AppId | null,
    private readonly type: MediaType,
    private readonly title: string,
    private readonly url: string,
    private readonly description: string | null,
    private readonly mimeType: string | null,
    private readonly size: number | null,
    private readonly metadata: any,
    private readonly createdAt: Date | null,
    private readonly updatedAt: Date | null,
    private readonly relativeKey?: string,
    private readonly createdBy: string | null = null
  ) {}

  getId() {
    return this.id?.value
  }

  getKey() {
    return this.relativeKey
  }

  getType(): MediaType {
    return this.type
  }

  getUrl(): string {
    return this.url
  }

  getTitle(): string {
    return this.title
  }

  getDescription(): string | null {
    return this.description
  }

  getMimeType(): string | null {
    return this.mimeType
  }

  getSize(): number | null {
    return this.size
  }

  getMetadata(): any {
    return this.metadata
  }

  getRelativeKey(): string | undefined {
    return this.relativeKey
  }

  getCreatedAt(): Date | null {
    return this.createdAt
  }

  getUpdatedAt(): Date | null {
    return this.updatedAt
  }

  getCreatedBy(): string | null {
    return this.createdBy
  }

  isOwnedBy(actorId: string): boolean {
    return this.createdBy !== null && this.createdBy === actorId
  }
}
