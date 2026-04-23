import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import SuperAdminOrders from './pages/SuperAdminOrders'
import SuperAdminABOs from './pages/SuperAdminABOs'
import SuperAdminAnalytics from './pages/SuperAdminAnalytics'
import SuperAdminCancellations from './pages/SuperAdminCancellations'
import SuperAdminWhatsappLogs from './pages/SuperAdminWhatsappLogs'
import EventAdminScanner from './pages/EventAdminScanner'
import ScanHistory from './pages/ScanHistory'
import Layout from './components/Layout'

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Super Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['super_admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<SuperAdminDashboard />} />
        <Route path="orders" element={<SuperAdminOrders />} />
        <Route path="abos" element={<SuperAdminABOs />} />
        <Route path="analytics" element={<SuperAdminAnalytics />} />
        <Route path="cancellations" element={<SuperAdminCancellations />} />
        <Route path="whatsapp-logs" element={<SuperAdminWhatsappLogs />} />
      </Route>

      {/* Event Admin + Scanner */}
      <Route path="/scanner" element={<ProtectedRoute allowedRoles={['event_admin', 'super_admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<EventAdminScanner />} />
      </Route>
      <Route path="/scan-history" element={<ProtectedRoute allowedRoles={['event_admin', 'super_admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<ScanHistory />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}
