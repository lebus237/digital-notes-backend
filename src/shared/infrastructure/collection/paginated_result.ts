import { CollectionResponse } from '#shared/application/collection/collection_response'

type PaginateJsonResult<T> = {
  meta: CollectionResponse<T>['meta']
  data: T[]
}

export async function mapPaginatedResult<TInput = any, TOutput = TInput>(
  paginateResult: { toJSON(): PaginateJsonResult<TInput> },
  mapper: (item: TInput) => Promise<TOutput> | TOutput
): Promise<CollectionResponse<TOutput>> {
  const json = paginateResult.toJSON()

  return {
    meta: json.meta,
    data: await Promise.all(json.data.map((item) => mapper(item))),
  }
}
