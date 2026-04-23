export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  if (total === 0) return null

  const goTo = (p) => {
    if (p < 1 || p > totalPages || p === page) return
    onPageChange(p)
  }

  // Build page numbers with ellipsis logic
  const pages = []
  const maxButtons = 7
  if (totalPages <= maxButtons) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    let start = Math.max(2, page - 2)
    let end = Math.min(totalPages - 1, page + 2)
    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <p className="text-xs text-gray-500">
        Showing <span className="font-medium text-gray-700">{startItem}-{endItem}</span> of <span className="font-medium text-gray-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Prev
        </button>
        {pages.map((p, idx) => (
          p === '...' ? (
            <span key={`e${idx}`} className="px-2 text-xs text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p)}
              className={`px-3 py-1 text-xs rounded-lg cursor-pointer ${
                p === page
                  ? 'bg-amway text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        ))}
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  )
}
