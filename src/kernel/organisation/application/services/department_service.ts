import { CollectionResponse } from '#shared/application/collection/collection_response'
import { GetDepartmentCollectionQuery } from '../use-cases/query/get_department_collection_query'
import { GetDepartmentQuery } from '../use-cases/query/get_department_query'

export type DepartmentListItemData = {
  id: string
  facultyName: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export type DepartmentData = {
  id: string
  facultyId: string
  facultyName: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export interface DepartmentService {
  departmentCollection(
    query: GetDepartmentCollectionQuery
  ): Promise<CollectionResponse<DepartmentListItemData>>

  viewDepartment(query: GetDepartmentQuery): Promise<DepartmentData>
}
