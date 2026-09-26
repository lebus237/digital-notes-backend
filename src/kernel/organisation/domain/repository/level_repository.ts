import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { Level } from '#kernel/organisation/domain/entity/level'

export interface LevelRepository extends RepositoryInterface {
  save(level: Level): Promise<string | void>
  findById(id: string): Promise<Level | null>
  delete(id: string): Promise<void>
}
