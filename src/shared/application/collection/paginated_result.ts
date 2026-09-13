export interface PaginatedResultDto<T> {
  meta: Record<string, unknown>
  data: T[]
}
