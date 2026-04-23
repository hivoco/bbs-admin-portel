import { useState, useEffect } from 'react'
import api from '../utils/api'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 20

export default function SuperAdminABOs() {
  const [abos, setAbos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAbo, setSelectedAbo] = useState(null)
  const [passes, setPasses] = useState([])
  const [passesLoading, setPassesLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchAbos = (targetPage = page, targetSearch = search) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (targetSearch) params.append('search', targetSearch)
    params.append('page', targetPage)
    params.append('page_size', PAGE_SIZE)
    api.get(`/superadmin/abos?${params}`)
      .then(res => {
        setAbos(res.data.data)
        setTotal(res.data.total || 0)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAbos(page, search) }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    if (page !== 1) setPage(1)
    else fetchAbos(1, search)
  }

  const selectAbo = async (abo) => {
    if (selectedAbo?.abo_number === abo.abo_number) {
      setSelectedAbo(null)
      setPasses([])
      return
    }
    setSelectedAbo(abo)
    setPassesLoading(true)
    setFilter('all')
    try {
      const res = await api.get(`/superadmin/abos/${abo.abo_number}/passes`)
      setPasses(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setPassesLoading(false)
    }
  }

  const filteredPasses = passes.filter(p => {
    if (filter === 'active') return p.status === 'unused'
    if (filter === 'used') return p.status === 'used'
    return true
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-amway mb-4">ABO List</h2>

      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ABO number, name, email or phone"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amway-accent outline-none"
            />
          </div>
          <button type="submit" className="bg-amway-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amway-accent-light cursor-pointer">
            Apply
          </button>
          <button type="button" onClick={() => { setSearch(''); if (page !== 1) setPage(1); else fetchAbos(1, '') }} className="text-gray-500 hover:text-amway px-3 py-2 text-sm cursor-pointer">
            Reset
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ABO List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-amway px-4 py-3">
              <p className="text-white font-medium text-sm">{total} ABOs</p>
            </div>
            {loading ? (
              <p className="text-center py-8 text-gray-400 text-sm">Loading...</p>
            ) : (
            <div className="divide-y divide-gray-100 max-h-[65vh] overflow-y-auto">
              {abos.map((abo) => (
                <button
                  key={abo.abo_number}
                  onClick={() => selectAbo(abo)}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                    selectedAbo?.abo_number === abo.abo_number
                      ? 'bg-amway-cream border-l-4 border-amway-accent'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-amway text-sm">{abo.name}</p>
                      <p className="text-xs text-gray-500">ABO: {abo.abo_number}</p>
                      <p className="text-xs text-gray-400">{abo.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-amway">{abo.total_passes} passes</p>
                      <div className="flex gap-1 mt-1">
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          {abo.active_passes} active
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {abo.scanned_passes} used
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {abos.length === 0 && (
                <p className="text-center py-8 text-gray-400 text-sm">No ABOs found</p>
              )}
            </div>
            )}
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        </div>

        {/* ABO Detail - QR Passes */}
        <div className="lg:col-span-2">
          {selectedAbo ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* ABO Header */}
              <div className="bg-amway-cream px-6 py-4 rounded-t-xl border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-amway">{selectedAbo.name}</h3>
                    <p className="text-sm text-gray-600">
                      ABO: {selectedAbo.abo_number} &middot; {selectedAbo.email} &middot; {selectedAbo.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{selectedAbo.total_orders} orders</p>
                    <p className="text-xs text-gray-400">Last: {selectedAbo.last_order_date}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mt-3">
                  <div className="bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Total QRs</p>
                    <p className="text-xl font-bold text-amway">{selectedAbo.total_passes}</p>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600">Active</p>
                    <p className="text-xl font-bold text-green-700">{selectedAbo.active_passes}</p>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Scanned</p>
                    <p className="text-xl font-bold text-gray-600">{selectedAbo.scanned_passes}</p>
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="px-6 py-3 border-b border-gray-200 flex gap-2">
                {[
                  { key: 'all', label: `All (${passes.length})` },
                  { key: 'active', label: `Active (${passes.filter(p => p.status === 'unused').length})` },
                  { key: 'used', label: `Used (${passes.filter(p => p.status === 'used').length})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      filter === tab.key
                        ? 'bg-amway text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Passes Grid */}
              <div className="p-6">
                {passesLoading ? (
                  <p className="text-center py-8 text-gray-400">Loading passes...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredPasses.map((pass) => (
                      <div
                        key={pass.pass_uuid}
                        className={`rounded-xl border-2 p-4 ${
                          pass.status === 'unused'
                            ? 'border-green-200 bg-green-50/30'
                            : 'border-gray-200 bg-gray-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-amway">{pass.pass_id}</p>
                            <p className="text-xs text-gray-500">{pass.event_city}{pass.venue ? ` - ${pass.venue}` : ''}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pass.status === 'unused'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {pass.status === 'unused' ? 'Active' : 'Used'}
                          </span>
                        </div>

                        {/* QR Code */}
                        {pass.qr_image_url && (
                          <div className="text-center bg-white p-3 rounded-lg border border-gray-200">
                            <img
                              src={pass.qr_image_url}
                              alt={pass.pass_id}
                              className="w-36 h-36 mx-auto"
                            />
                          </div>
                        )}

                        {pass.used_at && (
                          <p className="text-xs text-red-500 mt-2 text-center">
                            Scanned: {pass.used_at}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!passesLoading && filteredPasses.length === 0 && (
                  <p className="text-center py-8 text-gray-400 text-sm">
                    No {filter === 'all' ? '' : filter} passes found
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center h-64">
              <p className="text-gray-400">Select an ABO to view their QR passes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
