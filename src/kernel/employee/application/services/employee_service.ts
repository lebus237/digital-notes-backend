import { CollectionResponse } from '#shared/application/collection/collection_response'
import { GetEmployeeCollectionQuery } from '../use-cases/query/get_employee_collection_query'
import { GetEmployeeQuery } from '../use-cases/query/get_employee_query'
import { UserRole } from '#kernel/user/domain/types/user_role'

export type EmployeeListItemData = {
  id: string
  universityName: string
  fullName: string | null
  email: string
  phoneNumber: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export type EmployeeData = {
  id: string
  universityId: string
  userId: string
  universityName: string
  fullName: string | null
  email: string
  phoneNumber: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface EmployeeService {
  employeeCollection(
    query: GetEmployeeCollectionQuery
  ): Promise<CollectionResponse<EmployeeListItemData>>

  viewEmployee(query: GetEmployeeQuery): Promise<EmployeeData>
}
