import { useEffect, useState } from 'react'
import api from '../utils/api'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 20

export default function SuperAdminCancellations() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [passes, setPasses] = useState([])
  const [selectedPasses, setSelectedPasses] = useState([])
  const [loadingPasses, setLoadingPasses] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [message, setMessage] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = { page, page_size: PAGE_SIZE }
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/superadmin/cancellation-requests', { params })
      setRequests(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch (e) {
      console.error('Failed to fetch cancellation requests', e)
    }
    setLoading(false)
  }

  useEffect(() => { fetchRequests() }, [statusFilter, page])
  useEffect(() => { if (page !== 1) setPage(1) }, [statusFilter])

  const openRequest = async (req) => {
    setSelectedRequest(req)
    setSelectedPasses([])
    setMessage(null)
    setLoadingPasses(true)
    try {
      const res = await api.get(`/superadmin/cancellation-requests/${req.id}/passes`)
      setPasses(res.data.data?.passes || [])
    } catch (e) {
      console.error('Failed to fetch passes', e)
      setPasses([])
    }
    setLoadingPasses(false)
  }

  const togglePass = (passId) => {
    setSelectedPasses(prev =>
      prev.includes(passId) ? prev.filter(id => id !== passId) : [...prev, passId]
    )
  }

  const handleCancel = async () => {
    if (!selectedRequest || selectedPasses.length === 0) return

    const remaining = selectedRequest.remaining
    if (selectedPasses.length > remaining) {
      setMessage({ type: 'error', text: `Cannot cancel ${selectedPasses.length} passes. Only ${remaining} remaining in this request.` })
      return
    }

    setCancelling(true)
    setMessage(null)
    try {
      const res = await api.post(`/superadmin/cancellation-requests/${selectedRequest.id}/cancel`, {
        cancellation_request_id: selectedRequest.id,
        pass_ids: selectedPasses,
      })
      if (res.data.ok) {
        setMessage({ type: 'success', text: res.data.message })
        setSelectedPasses([])
        // Refresh
        fetchRequests()
        openRequest({ ...selectedRequest, ...res.data.data })
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Cancellation failed' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.detail || 'Cancellation failed' })
    }
    setCancelling(false)
  }

  const statusColor = (status) => {
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800'
    if (status === 'partial') return 'bg-orange-100 text-orange-800'
    if (status === 'completed') return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-amway">Cancellation Requests</h1>
        <div className="flex gap-2">
          {['', 'pending', 'partial', 'completed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                statusFilter === s
                  ? 'bg-amway-accent text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Requests list */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-sm font-semibold text-gray-700">Requests ({total})</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No cancellation requests found</div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {requests.map(req => (
                <button
                  key={req.id}
                  onClick={() => openRequest(req)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedRequest?.id === req.id ? 'bg-amway-cream' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-amway">{req.external_order_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>{req.name} ({req.abo_number})</div>
                    <div>SKU: <span className="font-medium text-gray-700">{req.sku_id}</span></div>
                    <div>
                      Requested: <span className="font-medium">{req.requested_quantity}</span>
                      {' | '}Cancelled: <span className="font-medium text-red-600">{req.cancelled_quantity}</span>
                      {' | '}Remaining: <span className="font-medium text-amway-accent">{req.remaining}</span>
                    </div>
                    <div className="text-gray-400">{req.created_at}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>

        {/* Right: Pass selection & cancel action */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {!selectedRequest ? (
            <div className="p-8 text-center text-gray-400">
              Select a cancellation request to manage
            </div>
          ) : (
            <>
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h2 className="text-sm font-semibold text-gray-700">
                  Cancel Passes for {selectedRequest.external_order_id}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  SKU: {selectedRequest.sku_id} | Remaining to cancel: <span className="font-bold text-amway-accent">{selectedRequest.remaining}</span>
                </p>
              </div>

              {message && (
                <div className={`mx-4 mt-3 px-3 py-2 rounded-md text-sm ${
                  message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              {loadingPasses ? (
                <div className="p-8 text-center text-gray-400">Loading passes...</div>
              ) : passes.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No unused passes available for this request</div>
              ) : (
                <>
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {passes.map(p => (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedPasses.includes(p.id) ? 'bg-red-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPasses.includes(p.id)}
                          onChange={() => togglePass(p.id)}
                          className="w-4 h-4 accent-red-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-amway">{p.pass_id}</span>
                            <span className="text-xs text-gray-400">{p.event_city}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {p.venue} | {p.event_date || '-'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {p.abo_number} - {p.name}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">
                        Selected: <span className="font-bold text-red-600">{selectedPasses.length}</span> / {selectedRequest.remaining} allowed
                      </span>
                      <button
                        onClick={() => {
                          const max = selectedRequest.remaining
                          const ids = passes.slice(0, max).map(p => p.id)
                          setSelectedPasses(ids)
                        }}
                        className="text-xs text-amway-accent hover:underline cursor-pointer"
                      >
                        Select max ({selectedRequest.remaining})
                      </button>
                    </div>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling || selectedPasses.length === 0 || selectedPasses.length > selectedRequest.remaining}
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                        selectedPasses.length > 0 && selectedPasses.length <= selectedRequest.remaining
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {cancelling ? 'Cancelling...' : `Cancel ${selectedPasses.length} Pass(es)`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
