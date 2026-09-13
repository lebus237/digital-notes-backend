type SortDirection = 'asc' | 'desc'

export class QuerySort<TField extends string> {
  constructor(
    public readonly field: TField,
    public readonly direction: SortDirection
  ) {}

  static from<TField extends string>(params: {
    requestedField: string
    requestedDirection: string
    allowedFields: readonly TField[]
    defaultField: TField
    defaultDirection?: SortDirection
  }): QuerySort<TField> {
    const field = params.allowedFields.includes(params.requestedField as TField)
      ? (params.requestedField as TField)
      : params.defaultField

    const direction: SortDirection = params.requestedDirection === 'asc' ? 'asc' : 'desc'

    return new QuerySort(field, direction ?? params.defaultDirection ?? 'desc')
  }
}
