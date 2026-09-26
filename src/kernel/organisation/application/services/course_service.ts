import { CollectionResponse } from '#shared/application/collection/collection_response'
import { GetCourseCollectionQuery } from '../use-cases/query/get_course_collection_query'
import { GetCourseDetailQuery } from '../use-cases/query/get_course_detail_query'

export type CourseListItemData = {
  id: string
  departmentId: string
  levelId: string
  semesterId: string
  code: string
  name: string
  description: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export type CourseData = {
  id: string
  departmentId: string
  levelId: string
  semesterId: string
  code: string
  name: string
  description: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface CourseService {
  courseCollection(query: GetCourseCollectionQuery): Promise<CollectionResponse<CourseListItemData>>

  viewCourse(query: GetCourseDetailQuery): Promise<CourseData>
}
