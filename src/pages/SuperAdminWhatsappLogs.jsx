import { useState, useEffect } from 'react'
import api from '../utils/api'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 20

export default function SuperAdminWhatsappLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLogs = (targetPage = page) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (status) params.append('status', status)
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    params.append('page', targetPage)
    params.append('page_size', PAGE_SIZE)

    api.get(`/superadmin/whatsapp-logs?${params}`)
      .then(res => {
        setLogs(res.data.data)
        setTotal(res.data.total || 0)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs(page) }, [page])

  const handleFilter = (e) => {
    e.preventDefault()
    if (page !== 1) setPage(1)
    else fetchLogs(1)
  }

  const handleReset = () => {
    setSearch(''); setStatus(''); setDateFrom(''); setDateTo('')
    if (page !== 1) setPage(1)
    else setTimeout(() => fetchLogs(1), 0)
  }

  const statusBadge = (s) => {
    const colors = {
      queued: 'bg-blue-100 text-blue-700',
      sent: 'bg-green-100 text-green-700',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
    }
    return colors[s] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-amway mb-4">WhatsApp Logs</h2>

      <form onSubmit={handleFilter} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Phone, ABO, name, order ID or Interakt ID"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amway-accent outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[130px]"
            >
              <option value="">All</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="bg-amway-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amway-accent-light cursor-pointer">
            Apply
          </button>
          <button type="button" onClick={handleReset} className="text-gray-500 hover:text-amway px-3 py-2 text-sm cursor-pointer">
            Reset
          </button>
        </div>
      </form>

      <p className="text-sm text-gray-500 mb-2">{total} log{total !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-amway text-white">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">ABO</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Order ID</th>
                  <th className="text-left px-4 py-3 font-medium">Passes</th>
                  <th className="text-left px-4 py-3 font-medium">Template</th>
                  <th className="text-left px-4 py-3 font-medium">Interakt ID</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Message / Error</th>
                  <th className="text-left px-4 py-3 font-medium">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-amway-cream/40">
                    <td className="px-4 py-3 font-mono text-xs">{log.id}</td>
                    <td className="px-4 py-3">{log.abo_number}</td>
                    <td className="px-4 py-3">{log.abo_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.country_code}{log.phone}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{log.external_order_id}</td>
                    <td className="px-4 py-3">{log.total_passes}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{log.template_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.interakt_id || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[250px] truncate" title={log.error_message || log.response_message}>
                      {log.error_message || log.response_message || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{log.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && <p className="text-center py-8 text-gray-400">No WhatsApp logs found</p>}
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
