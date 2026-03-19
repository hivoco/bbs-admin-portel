import { useState, useEffect } from 'react'
import api from '../utils/api'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/superadmin/dashboard')
      .then(res => setStats(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>

  const cards = [
    { label: 'Total Orders', value: stats?.total_orders || 0, color: 'bg-amway-blue' },
    { label: 'Total Passes', value: stats?.total_passes || 0, color: 'bg-amway' },
    { label: 'Active Passes', value: stats?.active_passes || 0, color: 'bg-amway-green' },
    { label: 'Scanned Passes', value: stats?.scanned_passes || 0, color: 'bg-amway-accent' },
    { label: 'Expired Passes', value: stats?.expired_passes || 0, color: 'bg-orange-500' },
    { label: 'Today Scans', value: stats?.today_scans || 0, color: 'bg-amway-accent-light' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-amway mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-amway mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg opacity-20`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
