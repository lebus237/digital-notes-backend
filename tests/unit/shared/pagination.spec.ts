import { test } from '@japa/runner'
import {
  Pagination,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from '#shared/application/query-options/pagination'

test.group('Pagination', () => {
  test('clamps negative page and non-numeric limit', ({ assert }) => {
    const pagination = new Pagination(-1, 'abc')

    assert.equal(pagination.page, 1)
    assert.equal(pagination.limit, DEFAULT_PAGE_LIMIT)
  })

  test('caps limit at the maximum', ({ assert }) => {
    const pagination = new Pagination('2', 500)

    assert.equal(pagination.page, 2)
    assert.equal(pagination.limit, MAX_PAGE_LIMIT)
  })

  test('keeps an in-range limit', ({ assert }) => {
    const pagination = new Pagination('3', '25')

    assert.equal(pagination.page, 3)
    assert.equal(pagination.limit, 25)
  })
})
