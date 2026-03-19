import { useState, useEffect } from 'react'
import api from '../utils/api'

export default function SuperAdminABOs() {
  const [abos, setAbos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAbo, setSelectedAbo] = useState(null)
  const [passes, setPasses] = useState([])
  const [passesLoading, setPassesLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, active, used

  useEffect(() => {
    api.get('/superadmin/abos')
      .then(res => setAbos(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

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

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  return (
    <div>
      <h2 className="text-2xl font-bold text-amway mb-6">ABO List</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ABO List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-amway px-4 py-3">
              <p className="text-white font-medium text-sm">{abos.length} ABOs</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
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
