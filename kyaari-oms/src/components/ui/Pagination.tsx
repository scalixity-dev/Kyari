interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  onPageChange: (page: number) => void
  itemLabel?: string // e.g., "transactions", "orders", "vendors"
  variant?: 'desktop' | 'mobile'
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  itemLabel = 'items',
  variant = 'desktop'
}: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  if (variant === 'mobile') {
    return (
      <div className="flex items-center justify-between px-1 py-2">
        <div className="text-xs text-gray-500">
          {totalItems === 0 ? 'No results' : `Showing ${startIndex + 1}-${endIndex} of ${totalItems}`}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="h-8 px-3 rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 text-sm font-medium"
          >
            Prev
          </button>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="h-8 px-3 rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 text-sm font-medium"
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  // Desktop variant
  return (
    <div className="flex items-center justify-between px-3 md:px-4 lg:px-6 py-3 bg-white border-t border-gray-100 rounded-b-xl">
      <div className="text-xs text-gray-500">
        Showing {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} of {totalItems}
        {itemLabel && ` ${itemLabel}`}
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          aria-label="Previous page"
        >
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-7 h-7 md:min-w-8 md:h-8 px-1.5 md:px-2 rounded-md border text-xs md:text-sm transition-colors ${
              currentPage === p
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          aria-label="Next page"
        >
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
