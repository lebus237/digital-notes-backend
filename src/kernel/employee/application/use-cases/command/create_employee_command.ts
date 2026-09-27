import { Command } from '#shared/application/use-cases/command'
import { DateTime } from 'luxon'
import { AppId } from '#shared/domain/app_id'
import { UserRole } from '#kernel/user/domain/types/user_role'

export class CreateEmployeeCommand implements Command {
  readonly timestamp: DateTime

  constructor(
    public readonly universityId: AppId,
    public readonly fullName: string,
    public readonly email: string,
    public readonly phoneNumber: string,
    public readonly role: UserRole
  ) {
    this.timestamp = DateTime.now()
  }
}
