import { AppId } from '#shared/domain/app_id'

export class Course {
  constructor(
    private readonly id: AppId | null,
    private readonly departmentId: string,
    private readonly levelId: string,
    private readonly semesterId: string,
    private readonly code: string,
    private readonly name: string,
    private readonly description: string | null,
    private isArchived: boolean,
    private readonly createdAt: Date | null,
    private readonly updatedAt: Date | null
  ) {}

  getId() {
    return this.id?.value
  }

  getDepartmentId(): string {
    return this.departmentId
  }

  getLevelId(): string {
    return this.levelId
  }

  getSemesterId(): string {
    return this.semesterId
  }

  getCode(): string {
    return this.code
  }

  getName(): string {
    return this.name
  }

  getDescription(): string | null {
    return this.description
  }

  getIsArchived(): boolean {
    return this.isArchived
  }

  isVisibleToStudents(): boolean {
    return !this.isArchived
  }

  archive() {
    this.isArchived = true
  }

  getCreatedAt(): Date | null {
    return this.createdAt
  }

  getUpdatedAt(): Date | null {
    return this.updatedAt
  }
}
