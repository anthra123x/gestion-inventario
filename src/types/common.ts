export type PaginationParams = {
  page?: number
  take?: number
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  totalPages: number
}

export type DateRange = {
  startDate?: string
  endDate?: string
}

export type SortParams = {
  sortKey?: string
  sortDir?: 'asc' | 'desc'
}
