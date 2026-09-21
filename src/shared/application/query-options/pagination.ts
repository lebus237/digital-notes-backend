export const MAX_PAGE_LIMIT = 100
export const DEFAULT_PAGE_LIMIT = 10

export class Pagination {
  public page: number
  public limit: number

  constructor(page: unknown = 1, limit: unknown = DEFAULT_PAGE_LIMIT) {
    const parsedPage = Number.parseInt(String(page), 10)
    const parsedLimit = Number.parseInt(String(limit), 10)

    this.page = Math.max(1, parsedPage || 1)
    this.limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parsedLimit || DEFAULT_PAGE_LIMIT))
  }
}
