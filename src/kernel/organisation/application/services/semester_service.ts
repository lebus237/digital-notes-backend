import { CollectionResponse } from '#shared/application/collection/collection_response'
import { GetSemesterCollectionQuery } from '../use-cases/query/get_semester_collection_query'
import { GetSemesterQuery } from '../use-cases/query/get_semester_query'

export type SemesterListItemData = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type SemesterData = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface SemesterService {
  semesterCollection(
    query: GetSemesterCollectionQuery
  ): Promise<CollectionResponse<SemesterListItemData>>

  viewSemester(query: GetSemesterQuery): Promise<SemesterData>
}
