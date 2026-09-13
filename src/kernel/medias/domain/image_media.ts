import { AppId } from '#shared/domain/app_id'

export class ImageMedia {
  constructor(
    private readonly id: AppId | null,
    private readonly title: string,
    private readonly url: string,
    private readonly altDescription: string,
    private readonly metadata: any,
    private readonly createdAt: Date | null,
    private readonly updatedAt: Date | null,
    private readonly relativeKey?: string,
    private readonly createdBy?: any
  ) {}

  getId() {
    return this.id?.value
  }

  getKey() {
    return this.relativeKey
  }

  getUrl(): string {
    return this.url
  }

  getTitle(): string {
    return this.title
  }

  getAltDescription(): string {
    return this.altDescription
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
}
