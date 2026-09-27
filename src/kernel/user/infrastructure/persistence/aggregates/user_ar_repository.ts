import { UserRepository } from '#kernel/user/domain/repository/user_repository'
import { User } from '#kernel/user/domain/entity/user'
import { default as UserRecord } from '#database/active-records/user'
import { UserAlreadyExistsError } from '#kernel/user/domain/errors/user_already_exists_error'
import { AppId } from '#shared/domain/app_id'

function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

export class UserARRepository implements UserRepository {
  async save(entity: User): Promise<string | void> {
    const object: Record<string, unknown> = {
      fullName: entity.getFullName(),
      email: entity.getEmail(),
      phoneNumber: entity.getPhoneNumber(),
      role: entity.getRole(),
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    const password = entity.getPassword()

    if (password !== null && password !== undefined) {
      object.password = password
    }

    try {
      if (entity.getId()) {
        await UserRecord.updateOrCreate({ id: entity.getId() }, object as any)
        return Promise.resolve()
      }

      const result = await UserRecord.create(object as any)
      return result.id
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new UserAlreadyExistsError()
      }
      throw error
    }
  }

  async findById(id: AppId): Promise<User | null> {
    const record = await UserRecord.find(id.value)

    if (!record) return null

    return new User(
      new AppId(record.id),
      record.fullName,
      record.email,
      record.phoneNumber,
      record.role,
      null,
      record.createdAt as any,
      record.updatedAt as any
    )
  }

  async delete(id: string): Promise<void> {
    const record = await UserRecord.findOrFail(id)
    await record.delete()
  }
}
