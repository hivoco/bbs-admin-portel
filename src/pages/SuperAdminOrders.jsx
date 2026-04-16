import { useState, useEffect } from 'react'
import api from '../utils/api'

export default function SuperAdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [passes, setPasses] = useState([])

  // Filters
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [apiEnvFilter, setApiEnvFilter] = useState('')

  const fetchOrders = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    if (statusFilter) params.append('status', statusFilter)
    if (apiEnvFilter) params.append('api_env', apiEnvFilter)

    api.get(`/superadmin/orders?${params}`)
      .then(res => setOrders(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const handleFilter = (e) => {
    e.preventDefault()
    setExpandedOrder(null)
    setPasses([])
    fetchOrders()
  }

  const handleReset = () => {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setStatusFilter('')
    setApiEnvFilter('')
    setExpandedOrder(null)
    setPasses([])
    setTimeout(fetchOrders, 0)
  }

  const togglePasses = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null)
      setPasses([])
      return
    }
    try {
      const res = await api.get(`/superadmin/orders/${orderId}/passes`)
      setPasses(res.data.data)
      setExpandedOrder(orderId)
    } catch (err) {
      console.error(err)
    }
  }

  const statusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      generated: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const passStatusBadge = (status) => {
    const colors = {
      unused: 'bg-green-100 text-green-700',
      used: 'bg-red-100 text-red-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-amway mb-4">All Orders</h2>

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ABO number, name, email or phone"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amway-accent outline-none"
            />
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
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Pass Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[130px]"
            >
              <option value="">All</option>
              <option value="unused">Unused</option>
              <option value="used">All Used</option>
              <option value="partial">Partially Used</option>
              <option value="cancelled">Cancelled / Refunded</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
            <select
              value={apiEnvFilter}
              onChange={(e) => setApiEnvFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[130px]"
            >
              <option value="">All</option>
              <option value="production">Production</option>
              <option value="development">Development</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-amway-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amway-accent-light cursor-pointer"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-gray-500 hover:text-amway px-3 py-2 text-sm cursor-pointer"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-2">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>

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
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Passes</th>
                  <th className="text-left px-4 py-3 font-medium">Scanned</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Source</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-amway-cream/40">
                    <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                    <td className="px-4 py-3">{order.abo_number}</td>
                    <td className="px-4 py-3">{order.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{order.email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{order.phone}</td>
                    <td className="px-4 py-3">{order.pass_count}</td>
                    <td className="px-4 py-3">
                      {order.scanned_count}
                      {order.cancelled_count > 0 && (
                        <span className="ml-1 text-xs text-red-500">({order.cancelled_count} cancelled)</span>
                      )}
                      {order.expired_count > 0 && (
                        <span className="ml-1 text-xs text-orange-500">({order.expired_count} expired)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(order.processing_status)}`}>
                        {order.processing_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.api_env === 'development' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.api_env === 'development' ? 'DEV' : 'PROD'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{order.created_at}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePasses(order.id)}
                        className="text-amway-accent hover:text-amway-accent-light text-xs font-medium cursor-pointer"
                      >
                        {expandedOrder === order.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && <p className="text-center py-8 text-gray-400">No orders found</p>}
        </div>
      )}

      {/* Passes Modal */}
      {expandedOrder && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { setExpandedOrder(null); setPasses([]); }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-amway">Order #{expandedOrder} — Passes</h3>
              <button
                onClick={() => { setExpandedOrder(null); setPasses([]); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {passes.map((p) => (
                <div key={p.pass_uuid} className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-amway text-sm">{p.pass_id}</p>
                      <p className="text-gray-500">{p.pass_name || p.name}</p>
                      <p className="text-gray-500">{p.event_city} {p.venue && `- ${p.venue}`}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${passStatusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                  {p.event_date && <p className="text-gray-400 text-xs">Event: {p.event_date}</p>}
                  {p.used_at && <p className="text-gray-400 text-xs">Used: {p.used_at}</p>}
                  {p.qr_image_url && (
                    <img src={p.qr_image_url} alt="QR" className="w-24 h-24 mt-3 mx-auto" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
