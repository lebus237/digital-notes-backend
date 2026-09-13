import { Pagination } from '#shared/application/query-options/pagination'
import { Sort } from '#shared/application/query-options/sort'
import { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { ExtractModelRelations } from '@adonisjs/lucid/types/relations'

export type ModelQueryBuilderInterface<TModel extends LucidModel = any> =
  ModelQueryBuilderContract<TModel>

export class ModelQueryBuilderHelper<TModel extends LucidModel = any> {
  withRelation(list: string[], builder: ModelQueryBuilderContract<TModel>) {
    for (const relation of list) {
      builder.preload(relation as ExtractModelRelations<InstanceType<TModel>>)
    }
    return builder
  }

  applySort(sort: Sort, sortableFields: Array<string>, builder: ModelQueryBuilderContract<TModel>) {
    for (const [column, direction] of Object.entries(sort.entries)) {
      if (sortableFields.includes(column)) {
        builder.orderBy(column, direction)
      }
    }
    return builder
  }

  applyPaginate(pagination: Pagination, builder: ModelQueryBuilderContract<TModel>) {
    return builder.paginate(pagination.page, pagination.limit)
  }

  // withRelation(
  //   list: string[],
  //   builder: ModelQueryBuilderContract<TModel>
  // ): ModelQueryBuilderContract<TModel> {
  //   if (list.length === 0) return builder

  //   return this.withRelation(
  //     _.tail(list),
  //     builder.preload(_.head(list) as ExtractModelRelations<InstanceType<TModel>>)
  //   )
  // }
}
