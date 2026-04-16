import { useState, useEffect, useRef } from 'react'
import jsQR from 'jsqr'
import api from '../utils/api'

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

export default function EventAdminScanner() {
  const [scanResult, setScanResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [manualUuid, setManualUuid] = useState('')
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('scanner_city') || '')
  const [cities, setCities] = useState([])
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const streamRef = useRef(null)
  const scanningRef = useRef(false)
  const rafRef = useRef(null)

  useEffect(() => {
    api.get('/cities')
      .then(res => setCities(res.data.data || []))
      .catch(err => console.error(err))
    return () => stopCamera()
  }, [])

  const handleScan = async (uuid) => {
    if (!uuid || loading) return
    setLoading(true)
    setScanResult(null)
    try {
      const res = await api.post('/admin/scan', { pass_uuid: uuid, event_city: selectedCity })
      setScanResult(res.data)
    } catch (err) {
      setScanResult({ ok: false, message: err.response?.data?.detail || 'Scan failed' })
    } finally {
      setLoading(false)
    }
  }

  const extractUuid = (input) => {
    const trimmed = input.trim()
    const uuidMatch = trimmed.match(UUID_RE)
    if (uuidMatch) return uuidMatch[0]
    return trimmed
  }

  const handleManualScan = (e) => {
    e.preventDefault()
    const uuid = extractUuid(manualUuid)
    if (!uuid) return
    handleScan(uuid)
    setManualUuid('')
  }

  const startCamera = async () => {
    try {
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        })
      }

      streamRef.current = stream
      setCameraActive(true)
      scanningRef.current = true

      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current
          videoRef.current.onloadeddata = () => { scanLoop() }
          videoRef.current.play().catch(() => {})
        }
      }, 100)
    } catch (err) {
      console.error('Camera error:', err)
      alert('Camera access denied or not available. Please use manual entry.')
    }
  }

  const stopCamera = () => {
    scanningRef.current = false
    setCameraActive(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.onloadeddata = null
      videoRef.current.srcObject = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const scanLoop = () => {
    if (!scanningRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop)
      return
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code && code.data) {
      const uuid = extractUuid(code.data)
      if (uuid) {
        scanningRef.current = false
        stopCamera()
        handleScan(uuid)
        return
      }
    }

    rafRef.current = requestAnimationFrame(scanLoop)
  }

  const resultColor = (result) => {
    if (!result) return ''
    if (result.ok) return 'bg-green-50 border-green-300 text-green-800'
    if (result.scan_status === 'already_used') return 'bg-yellow-50 border-yellow-300 text-yellow-800'
    if (result.scan_status === 'expired') return 'bg-orange-50 border-orange-300 text-orange-800'
    if (result.scan_status === 'cancelled') return 'bg-red-50 border-red-300 text-red-800'
    if (result.scan_status === 'wrong_city') return 'bg-orange-50 border-orange-300 text-orange-800'
    return 'bg-red-50 border-red-300 text-red-800'
  }

  const resultIcon = (result) => {
    if (!result) return ''
    if (result.ok) return 'ENTRY ALLOWED'
    if (result.scan_status === 'wrong_city') return 'WRONG CITY'
    return result.scan_status?.toUpperCase().replace('_', ' ') || 'ERROR'
  }

  if (!selectedCity) {
    return (
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-amway mb-6">Select Your City</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-4">Select the city where you are present for scanning tickets.</p>
          <div className="grid grid-cols-2 gap-3">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => { localStorage.setItem('scanner_city', city); setSelectedCity(city); }}
                className="p-3 text-sm font-medium text-amway bg-gray-50 border border-gray-200 rounded-lg hover:bg-amway hover:text-white transition-all cursor-pointer"
              >
                {city}
              </button>
            ))}
          </div>
          {cities.length === 0 && <p className="text-center text-gray-400 py-4">Loading cities...</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-amway">QR Scanner</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">City:</span>
          <span className="bg-amway text-white px-3 py-1 rounded-full text-sm font-medium">{selectedCity}</span>
          <button
            onClick={() => { localStorage.removeItem('scanner_city'); setSelectedCity(''); stopCamera(); setScanResult(null); }}
            className="text-xs text-gray-400 hover:text-red-500 cursor-pointer"
          >
            Change
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          {cameraActive ? (
            <div className="relative">
              <video ref={videoRef} className="w-full rounded-lg bg-black" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-amway-accent rounded-lg opacity-60" />
              </div>
              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                Scanning...
              </div>
              <button
                onClick={stopCamera}
                className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-lg text-sm cursor-pointer"
              >
                Stop
              </button>
            </div>
          ) : (
            <button
              onClick={startCamera}
              className="w-full bg-amway text-white py-3 rounded-lg font-medium hover:bg-amway-light cursor-pointer"
            >
              Open Camera Scanner
            </button>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500 mb-2">Or enter QR value / Pass ID manually:</p>
          <form onSubmit={handleManualScan} className="flex gap-2">
            <input
              type="text"
              value={manualUuid}
              onChange={(e) => setManualUuid(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amway-accent outline-none text-sm"
              placeholder="Paste QR URL, UUID or Pass ID"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-amway-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amway-accent-light disabled:opacity-50 cursor-pointer"
            >
              {loading ? '...' : 'Scan'}
            </button>
          </form>
        </div>

        {scanResult && (
          <div className={`mt-4 p-4 rounded-lg border-2 ${resultColor(scanResult)}`}>
            <p className="font-semibold text-lg">{resultIcon(scanResult)}</p>
            <p className="text-sm mt-1">{scanResult.message}</p>
            {scanResult.data && (
              <div className="mt-2 text-sm space-y-1">
                {scanResult.data.pass_id && <p>Pass: {scanResult.data.pass_id}</p>}
                {scanResult.data.name && <p>Name: {scanResult.data.name}</p>}
                {scanResult.data.abo_number && <p>ABO: {scanResult.data.abo_number}</p>}
                {scanResult.data.event_city && <p>City: {scanResult.data.event_city}</p>}
                {scanResult.data.event_date && <p>Event Date: {scanResult.data.event_date}</p>}
                {scanResult.data.used_at && <p>Previously used: {scanResult.data.used_at}</p>}
                {scanResult.data.reason && (
                  <p className="mt-1 text-xs italic opacity-80">Reason: {scanResult.data.reason}</p>
                )}
              </div>
            )}
            <button
              onClick={() => { setScanResult(null); startCamera() }}
              className="mt-3 bg-amway text-white px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer"
            >
              Scan Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
