import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const BBS_LOGO = 'https://videoforinteractivedemons.s3.ap-south-1.amazonaws.com/amway_qr/bbs_logo.png'

function useNotifications() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    let es
    function connect() {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      es = new EventSource(`${baseUrl}/notifications/stream?token=${token}`)

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'new_order') {
            const msg = `New Order: ${data.abo_name} (${data.abo_number}) bought ${data.passes} pass${data.passes > 1 ? 'es' : ''} for ${data.city}`

            // Browser desktop notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('BBS - New Order', {
                body: msg,
                icon: BBS_LOGO,
              })
            }

            // In-app toast
            setToast({ message: msg, data })
            setTimeout(() => setToast(null), 8000)
          }
        } catch (e) {
          // ignore parse errors from keepalive
        }
      }

      es.onerror = () => {
        es.close()
        setTimeout(connect, 5000)
      }
    }

    connect()
    return () => es?.close()
  }, [])

  return { toast, dismissToast: () => setToast(null) }
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast, dismissToast } = useNotifications()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = {
    super_admin: [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/abos', label: 'ABOs' },
      { to: '/admin/orders', label: 'Orders' },
      { to: '/admin/analytics', label: 'Analytics' },
      { to: '/admin/cancellations', label: 'Cancellations' },
      { to: '/scanner', label: 'Scanner' },
      { to: '/scan-history', label: 'Scan History' },
    ],
    event_admin: [
      { to: '/scanner', label: 'Scanner' },
      { to: '/scan-history', label: 'Scan History' },
    ],
  }

  const links = navLinks[user?.role] || []

  return (
    <div className="min-h-screen bg-amway-bg">
      <nav className="bg-amway shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-1">
              <img src={BBS_LOGO} alt="BBS" className="h-8 mr-4" />
              <span className="text-white font-semibold mr-6 text-sm">BBS Admin</span>
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    (link.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(link.to))
                      ? 'bg-amway-accent text-white'
                      : 'text-gray-300 hover:bg-amway-light hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-amway-accent-light hover:text-amway-cream font-medium cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-in">
          <div className="bg-white border-l-4 border-amway-accent rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-amway-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                !
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amway">New Ticket Order</p>
                <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
              </div>
              <button onClick={dismissToast} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                x
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
