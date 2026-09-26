import { CollectionResponse } from '#shared/application/collection/collection_response'

type PaginateJsonResult = {
  meta: { total: number } & Record<string, any>
  data: any[]
}

export async function mapPaginatedResult<TInput = any, TOutput = TInput>(
  paginateResult: { toJSON(): PaginateJsonResult },
  mapper: (item: TInput) => Promise<TOutput> | TOutput
): Promise<CollectionResponse<TOutput>> {
  const json = paginateResult.toJSON()

  return {
    meta: json.meta,
    data: await Promise.all(json.data.map((item: TInput) => mapper(item))),
    total: json.meta.total,
  }
}
