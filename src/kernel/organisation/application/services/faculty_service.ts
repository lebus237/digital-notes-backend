import { CollectionResponse } from '#shared/application/collection/collection_response'
import { GetFacultyCollectionQuery } from '../use-cases/query/get_faculty_collection_query'
import { GetFacultyQuery } from '../use-cases/query/get_faculty_query'

export type FacultyListItemData = {
  id: string
  universityId: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export type FacultyData = {
  id: string
  universityId: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface FacultyService {
  facultyCollection(
    query: GetFacultyCollectionQuery
  ): Promise<CollectionResponse<FacultyListItemData>>

  viewFaculty(query: GetFacultyQuery): Promise<FacultyData>
}
