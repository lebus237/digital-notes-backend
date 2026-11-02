import { CollectionResponse } from '#shared/application/collection/collection_response'
import { GetLevelCollectionQuery } from '../use-cases/query/get_level_collection_query'
import { GetLevelQuery } from '../use-cases/query/get_level_query'

export type LevelListItemData = {
  id: string
  departmentId: string
  name: string
  year: number
  createdAt: string
  updatedAt: string
}

export type LevelData = {
  id: string
  departmentId: string
  name: string
  year: number
  createdAt: string
  updatedAt: string
}

export interface LevelService {
  levelCollection(query: GetLevelCollectionQuery): Promise<CollectionResponse<LevelListItemData>>

  viewLevel(query: GetLevelQuery): Promise<LevelData>
}
