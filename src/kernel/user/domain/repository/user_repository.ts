import { RepositoryInterface } from '#shared/infrastructure/repository_interface'
import { User } from '#kernel/user/domain/entity/user'
import { AppId } from '#shared/domain/app_id'

export interface UserRepository extends RepositoryInterface {
  save(user: User): Promise<string | void>
  findById(id: AppId): Promise<User | null>
  delete(id: string): Promise<void>
}
