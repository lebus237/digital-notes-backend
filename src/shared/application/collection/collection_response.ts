export interface CollectionResponse<TData> {
  data: TData[]
  total: number
  meta: Record<string, unknown>
  analytics?: Record<string, unknown>
}
