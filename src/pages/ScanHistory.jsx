import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function ScanHistory() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterCity, setFilterCity] = useState(() => isSuperAdmin ? '' : (localStorage.getItem('scanner_city') || ''))
  const [useRange, setUseRange] = useState(false)

  useEffect(() => { fetchScans() }, [])

  const buildParams = () => {
    const params = new URLSearchParams()
    if (useRange) {
      if (filterDateFrom) params.append('date_from', filterDateFrom)
      if (filterDateTo) params.append('date_to', filterDateTo)
    } else {
      params.append('date', filterDate)
    }
    if (filterSearch) params.append('search', filterSearch)
    if (filterCity) params.append('event_city', filterCity)
    return params
  }

  const fetchScans = () => {
    setLoading(true)
    api.get(`/admin/scans?${buildParams()}`)
      .then(res => setScans(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const handleFilter = (e) => {
    e.preventDefault()
    fetchScans()
  }

  const handleReset = () => {
    setFilterDate(new Date().toISOString().split('T')[0])
    setFilterDateFrom('')
    setFilterDateTo('')
    setFilterSearch('')
    setFilterCity(isSuperAdmin ? '' : (localStorage.getItem('scanner_city') || ''))
    setUseRange(false)
    setTimeout(fetchScans, 0)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await api.get(`/admin/scans/export?${buildParams()}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'scan_history_export.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-amway">Scan History</h2>
        {isSuperAdmin && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-amway text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amway-light disabled:opacity-50 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        )}
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="ABO number or pass ID"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amway-accent outline-none"
            />
          </div>
          {isSuperAdmin && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
              <input
                type="text"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                placeholder="Filter by city"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[140px]"
              />
            </div>
          )}

          {/* Date toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date Mode</label>
            <div className="flex">
              <button
                type="button"
                onClick={() => setUseRange(false)}
                className={`px-3 py-2 text-xs rounded-l-lg border ${!useRange ? 'bg-amway text-white border-amway' : 'bg-white text-gray-600 border-gray-300'} cursor-pointer`}
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => setUseRange(true)}
                className={`px-3 py-2 text-xs rounded-r-lg border-t border-b border-r ${useRange ? 'bg-amway text-white border-amway' : 'bg-white text-gray-600 border-gray-300'} cursor-pointer`}
              >
                Range
              </button>
            </div>
          </div>

          {useRange ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

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
      <p className="text-sm text-gray-500 mb-2">{scans.length} scan{scans.length !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-amway text-white">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Pass ID</th>
                  <th className="text-left px-4 py-3 font-medium">ABO Number</th>
                  <th className="text-left px-4 py-3 font-medium">City</th>
                  <th className="text-left px-4 py-3 font-medium">Venue</th>
                  <th className="text-left px-4 py-3 font-medium">Scanned By</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-amway-cream/40">
                    <td className="px-4 py-3 font-medium text-amway">{scan.pass_code}</td>
                    <td className="px-4 py-3">{scan.abo_number}</td>
                    <td className="px-4 py-3">{scan.event_city}</td>
                    <td className="px-4 py-3 text-gray-500">{scan.venue || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{scan.scanned_by}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{scan.scanned_at?.split(' ')[0]}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{scan.scanned_at?.split(' ')[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {scans.length === 0 && <p className="text-center py-8 text-gray-400">No scans found</p>}
        </div>
      )}
    </div>
  )
}
