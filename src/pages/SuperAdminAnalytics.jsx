import { useState, useEffect } from 'react'
import api from '../utils/api'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#A65523', '#38539A', '#356834', '#2C2C2C', '#c06a35', '#5a7fbf', '#4a8c49', '#666']

export default function SuperAdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [cities, setCities] = useState([])
  const [exporting, setExporting] = useState(false)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (city) params.append('city', city)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      const res = await api.get(`/superadmin/analytics?${params}`)
      setData(res.data.data)
      if (res.data.data.cities?.length) setCities(res.data.data.cities)
    } catch (err) {
      console.error('Failed to fetch analytics', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnalytics() }, [])

  const handleFilter = (e) => {
    e.preventDefault()
    fetchAnalytics()
  }

  const handleReset = () => {
    setCity('')
    setDateFrom('')
    setDateTo('')
    setTimeout(fetchAnalytics, 0)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (city) params.append('city', city)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      const res = await api.get(`/superadmin/analytics/export?${params}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `bbs_report_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed', err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amway-accent"></div>
      </div>
    )
  }

  const s = data?.summary || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amway">Analytics</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-amway-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {exporting ? 'Exporting...' : 'Download Excel'}
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[160px]"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
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
      </form>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Orders', value: s.total_orders, color: 'bg-amway' },
          { label: 'Unique ABOs', value: s.unique_abos, color: 'bg-amway-blue' },
          { label: 'Passes Ordered', value: s.total_passes_ordered, color: 'bg-amway-accent' },
          { label: 'Passes Generated', value: s.total_passes_generated, color: 'bg-amway-green' },
          { label: 'Scanned', value: s.scanned_passes, color: 'bg-amber-600' },
          { label: 'Active', value: s.active_passes, color: 'bg-emerald-600' },
        ].map((card) => (
          <div key={card.label} className={`${card.color} text-white rounded-xl p-4 shadow-sm`}>
            <div className="text-2xl font-bold">{card.value ?? 0}</div>
            <div className="text-xs opacity-80 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders & Passes Over Time */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-amway mb-4">Orders & Passes Over Time</h2>
          {data?.daily_orders?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.daily_orders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#38539A" name="Orders" radius={[4, 4, 0, 0]} />
                <Bar dataKey="passes" fill="#A65523" name="Passes" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No order data</p>
          )}
        </div>

        {/* Scans Over Time */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-amway mb-4">Scans Over Time</h2>
          {data?.daily_scans?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.daily_scans}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="scans" stroke="#356834" strokeWidth={2} name="Scans" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No scan data</p>
          )}
        </div>

        {/* Passes by City - Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-amway mb-4">Passes by City</h2>
          {data?.by_city?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.by_city}
                  dataKey="passes"
                  nameKey="city"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ city, passes }) => `${city}: ${passes}`}
                >
                  {data.by_city.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No city data</p>
          )}
        </div>

        {/* City Breakdown Table */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-amway mb-4">City Breakdown</h2>
          {data?.by_city?.length ? (
            <div className="overflow-auto max-h-[280px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left text-gray-500 text-xs">
                    <th className="py-2 px-3">City</th>
                    <th className="py-2 px-3 text-right">Orders</th>
                    <th className="py-2 px-3 text-right">Passes</th>
                    <th className="py-2 px-3 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_city.map((row, i) => {
                    const attendance = s.scanned_passes && row.passes
                      ? Math.round((s.scanned_passes / row.passes) * 100)
                      : 0
                    return (
                      <tr key={row.city} className="border-t border-gray-100">
                        <td className="py-2 px-3 font-medium flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          {row.city}
                        </td>
                        <td className="py-2 px-3 text-right">{row.orders}</td>
                        <td className="py-2 px-3 text-right">{row.passes}</td>
                        <td className="py-2 px-3 text-right">{attendance}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No city data</p>
          )}
        </div>
      </div>
    </div>
  )
}
