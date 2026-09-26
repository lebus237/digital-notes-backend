export interface CollectionResponse<TData> {
  data: TData[]
  count: number
  meta: Record<string, unknown>
  analytics?: Record<string, unknown>
}
