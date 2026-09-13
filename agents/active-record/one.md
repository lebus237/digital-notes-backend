[`Sort`](src/shared/application/query-options/sort.ts:5) already supports **multiple columns** because its [`entries`](src/shared/application/query-options/sort.ts:6) property is a [`Record<string, SortDirection>`](src/shared/application/query-options/sort.ts:6). The main issue is that your repository is still consuming it like a single-field object with [`query.order.field`](src/kernel/product/infrastructure/persistence/projections/product_ar_collection.ts:42) and [`query.order.direction`](src/kernel/product/infrastructure/persistence/projections/product_ar_collection.ts:42), but those properties do not exist on the current [`Sort`](src/shared/application/query-options/sort.ts:5) shape.

## Actual shape of [`Sort`](src/shared/application/query-options/sort.ts:5)

Your current class is:

- [`entries`](src/shared/application/query-options/sort.ts:6): an object like `{ created_at: 'desc', designation: 'asc' }`
- default value: `{ created_at: 'desc' }` in [`sort.ts`](src/shared/application/query-options/sort.ts:6)

So usage should be based on iterating over [`entries`](src/shared/application/query-options/sort.ts:6), not reading a single [`field`](src/kernel/product/infrastructure/persistence/projections/product_ar_collection.ts:42)/[`direction`](src/kernel/product/infrastructure/persistence/projections/product_ar_collection.ts:42) pair.

## How to use it in collection repositories

In a collection repository like [`ProductARCollection.list()`](src/kernel/product/infrastructure/persistence/projections/product_ar_collection.ts:37), build the query first, then apply all sort entries in sequence.

Conceptually:

```ts
const builder = Product.query()

for (const [column, direction] of Object.entries(query.order.entries)) {
  builder.orderBy(column, direction)
}
```

With Lucid, multiple [`orderBy()`](src/kernel/product/infrastructure/persistence/projections/product_ar_collection.ts:42) calls are cumulative, so this gives you SQL like:

```sql
ORDER BY category_id ASC, designation DESC, created_at DESC
```

That is the correct pattern for multi-column sorting.

## Applied to your repository

Instead of this current line in [`product_ar_collection.ts`](src/kernel/product/infrastructure/persistence/projections/product_ar_collection.ts:42):

```ts
.orderBy(query.order.field, query.order.direction)
```

use this structure:

```ts
const builder = Product.query()
  .preload('category')
  .preload('mainImage')
  .whereILike('designation', `%${query.searchQuery.search}%`)

for (const [column, direction] of Object.entries(query.order.entries)) {
  builder.orderBy(column, direction)
}

const result = await builder.paginate(query.pagination.page, query.pagination.limit)
```

## Full example for [`list()`](src/kernel/product/infrastructure/persistence/projections/product_ar_collection.ts:37)

```ts
async list(query: ListProductsQuery): Promise<PaginatedResultDto<ProductListItemDto>> {
  const builder = Product.query()
    .preload('category')
    .preload('mainImage')
    .whereILike('designation', `%${query.searchQuery.search}%`)

  for (const [column, direction] of Object.entries(query.order.entries)) {
    builder.orderBy(column, direction)
  }

  const result = await builder.paginate(query.pagination.page, query.pagination.limit)

  return mapPaginatedResult<ProductActiveRecordWithRelations, ProductListItemDto>(
    result as any,
    async (product) => {
      const mainImageUrl = await this.getSignedUrl(
        product.mainImage?.relativeKey || product.mainImage?.relative_key
      )

      return {
        id: product.id,
        slug: product.slug,
        designation: product.designation,
        price: product.price,
        category: {
          designation: product.category?.designation ?? null,
          id: product.category?.id ?? null,
        },
        mainImage: {
          url: mainImageUrl,
          alt: product.mainImage?.altDescription ?? null,
          title: product.mainImage?.title ?? null,
        },
        stockQuantity: product.stockQuantity,
        brand: product.brand ?? null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }
    }
  )
}
```

## Example query construction

Since [`ListProductsQuery`](src/kernel/product/application/query/list_products_query.ts:6) and [`ListProductsByCategoryQuery`](src/kernel/product/application/query/list_products_by_category_query.ts:6) already accept a [`Sort`](src/shared/application/query-options/sort.ts:5), you can instantiate it like this:

```ts
new Sort({
  category_id: 'asc',
  designation: 'asc',
  created_at: 'desc',
})
```

That means:
1. sort by category first,
2. then by designation inside category,
3. then by creation date as tie-breaker.

## Important caveat: object key order

Because [`entries`](src/shared/application/query-options/sort.ts:6) is a plain object, the sort priority depends on the insertion order of keys:

```ts
new Sort({
  category_id: 'asc',
  designation: 'asc',
  created_at: 'desc',
})
```

This will be applied in exactly that order when iterating with `Object.entries(...)`.

In modern JavaScript/TypeScript, that is usually stable enough for string keys, so it works in practice.

## Better design if multi-sort is a first-class feature

If you want the intent to be clearer and safer, [`Sort`](src/shared/application/query-options/sort.ts:5) should ideally use an array instead of a record.

Example redesign:

```ts
export type SortEntry = {
  field: string
  direction: SortDirection
}

export class Sort {
  constructor(
    public readonly entries: SortEntry[] = [{ field: 'created_at', direction: 'desc' }]
  ) {
    if (this.entries.some((entry) => entry.direction !== 'asc' && entry.direction !== 'desc')) {
      throw new ApplicationError('INVALID_SORT_DIRECTION', 'Invalid sort direction passed')
    }
  }
}
```

Then repository usage becomes explicit:

```ts
for (const entry of query.order.entries) {
  builder.orderBy(entry.field, entry.direction)
}
```

This is usually better because:
- it preserves order explicitly,
- it allows duplicate logical fields if ever needed,
- it matches the repository API more naturally,
- it avoids ambiguity of object key ordering.

## Recommendation for your current codebase

Given the **actual current shape** of [`Sort`](src/shared/application/query-options/sort.ts:5), the most direct answer is:

- keep passing [`Sort`](src/shared/application/query-options/sort.ts:5) into queries such as [`ListProductsQuery`](src/kernel/product/application/query/list_products_query.ts:6)
- in repositories, iterate through [`query.order.entries`](src/shared/application/query-options/sort.ts:6)
- call [`builder.orderBy(...)`](src/kernel/product/infrastructure/persistence/projections/product_ar_collection.ts:42) once per entry
- avoid accessing nonexistent [`field`](src/kernel/product/infrastructure/persistence/projections/product_ar_collection.ts:42) / [`direction`](src/kernel/product/infrastructure/persistence/projections/product_ar_collection.ts:42) properties

## Minimal pattern

```ts
for (const [column, direction] of Object.entries(query.order.entries)) {
  builder.orderBy(column, direction)
}
```

## Practical conclusion

Your current [`Sort`](src/shared/application/query-options/sort.ts:5) is already compatible with multi-column sorting. The repository just needs to treat it as a collection of sort instructions instead of a single one. If you want a more robust domain model, refactor [`Sort`](src/shared/application/query-options/sort.ts:5) from a [`Record`](src/shared/application/query-options/sort.ts:6) to an ordered array of sort entries.
