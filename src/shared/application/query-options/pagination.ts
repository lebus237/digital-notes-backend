export const MAX_PAGE_LIMIT = 100
export const DEFAULT_PAGE_LIMIT = 10

export class Pagination {
  constructor(
    public page: number = 1,
    public limit: number = DEFAULT_PAGE_LIMIT
  ) {
    if (this.limit > MAX_PAGE_LIMIT) {
      this.limit = MAX_PAGE_LIMIT
    }
  }
}
