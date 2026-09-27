import { AppId } from '#shared/domain/app_id'
import { UserRole } from '#kernel/user/domain/types/user_role'
import { DateTime } from 'luxon'

export class User {
  constructor(
    private readonly id: AppId | null,
    private readonly fullName: string | null,
    private readonly email: string,
    private readonly phoneNumber: string,
    private readonly role: UserRole,
    private readonly password: string | null,
    private readonly createdAt: DateTime | null,
    private readonly updatedAt: DateTime | null
  ) {}

  getId() {
    return this.id?.value
  }

  getFullName(): string | null {
    return this.fullName
  }

  getEmail(): string {
    return this.email
  }

  getPhoneNumber(): string {
    return this.phoneNumber
  }

  getRole(): UserRole {
    return this.role
  }

  getPassword(): string | null {
    return this.password
  }

  getCreatedAt(): DateTime | null {
    return this.createdAt
  }

  getUpdatedAt(): DateTime | null {
    return this.updatedAt
  }
}
