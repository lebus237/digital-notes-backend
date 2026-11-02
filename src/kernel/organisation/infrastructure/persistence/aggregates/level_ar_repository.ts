import { LevelRepository } from '#kernel/organisation/domain/repository/level_repository'
import { Level } from '#kernel/organisation/domain/entity/level'
import { default as LevelRecord } from '#database/active-records/level'
import { AppId } from '#shared/domain/app_id'
import { LevelAlreadyExistsError } from '#kernel/organisation/domain/errors/level_already_exists_error'

function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

export class LevelARRepository implements LevelRepository {
  async save(entity: Level): Promise<string | void> {
    const object = {
      departmentId: entity.getDepartmentId() as any,
      name: entity.getName(),
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    try {
      if (entity.getId()) {
        await LevelRecord.updateOrCreate({ id: entity.getId() }, object)
        return Promise.resolve()
      }

      const result = await LevelRecord.create(object)
      return result.id
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new LevelAlreadyExistsError()
      }
      throw error
    }
  }

  async findById(id: AppId): Promise<Level | null> {
    const record = await LevelRecord.find(id.value)
    if (!record) return null
    return new Level(
      new AppId(record.id),
      String(record.departmentId),
      record.name,
      record.createdAt as any,
      record.updatedAt as any
    )
  }

  async delete(id: string): Promise<void> {
    const record = await LevelRecord.findOrFail(id)
    await record.delete()
  }
}
