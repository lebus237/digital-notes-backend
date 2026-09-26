import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Level } from '#kernel/organisation/domain/entity/level'
import { AppId } from '#shared/domain/app_id'

export interface LevelRepository extends RepositoryInterface {
  save(level: Level): Promise<string | void>
  findById(id: AppId): Promise<Level | null>
  delete(id: string): Promise<void>
}
