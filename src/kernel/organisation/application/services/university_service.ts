import { CollectionResponse } from '#shared/application/collection/collection_response'
import { GetUniversityCollectionQuery } from '../use-cases/query/get_university_collection_query'
import { GetUniversityQuery } from '../use-cases/query/get_university_query'

export type UniversityListItemData = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type UniversityData = {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface UniversityService {
  universityCollection(
    query: GetUniversityCollectionQuery
  ): Promise<CollectionResponse<UniversityListItemData>>

  viewUniversity(query: GetUniversityQuery): Promise<UniversityData>
}
