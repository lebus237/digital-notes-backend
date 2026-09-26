import { LevelRepository } from '#kernel/organisation/domain/repository/level_repository'
import { Level } from '#kernel/organisation/domain/entity/level'
import { default as LevelRecord } from '#database/active-records/level'
import { AppId } from '#shared/domain/app_id'

export class LevelARRepository implements LevelRepository {
  async save(entity: Level): Promise<string | void> {
    const object = {
      departmentId: entity.getDepartmentId() as any,
      name: entity.getName(),
      createdAt: entity.getCreatedAt() as any,
      updatedAt: entity.getUpdatedAt() as any,
    }

    if (entity.getId()) {
      await LevelRecord.updateOrCreate({ id: entity.getId() }, object)
      return Promise.resolve()
    }

    const result = await LevelRecord.create(object)
    return result.id
  }

  async findById(id: string): Promise<Level | null> {
    const record = await LevelRecord.find(id)
    if (!record) return null
    return new Level(new AppId(record.id), String(record.departmentId), record.name, record.createdAt as any, record.updatedAt as any)
  }

  async delete(id: string): Promise<void> {
    const record = await LevelRecord.findOrFail(id)
    await record.delete()
  }
}
