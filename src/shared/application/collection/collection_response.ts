export interface CollectionResponse<TData> {
  data: TData[]
  meta: Record<string, unknown>
  analytics?: Record<string, unknown>
}
