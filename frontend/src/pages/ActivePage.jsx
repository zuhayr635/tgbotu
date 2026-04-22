import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { listBroadcasts, cancelBroadcast, skipGroup } from '../lib/api'
import toast from 'react-hot-toast'
import { Radio, Square, CheckCircle, XCircle, Clock, Users, BarChart3 } from 'lucide-react'
import ProgressBar from '../components/ProgressBar'

const WS_BASE = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host

export default function ActivePage() {
  const [broadcasts, setBroadcasts] = useState([])
  const [progress, setProgress] = useState({})
  const wsRefs = useRef({})

  const loadBroadcasts = async () => {
    const res = await listBroadcasts(0, 50)
    const running = res.data.filter(b => b.status === 'running' || b.status === 'pending')
    setBroadcasts(running)
    return running
  }

  const connectWs = (broadcastId) => {
    if (wsRefs.current[broadcastId]) return
    const token = localStorage.getItem('token')
    const ws = new WebSocket(`${WS_BASE}/api/broadcasts/${broadcastId}/ws?token=${token}`)
    wsRefs.current[broadcastId] = ws

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        setProgress(prev => ({ ...prev, [broadcastId]: data }))
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          ws.close()
          delete wsRefs.current[broadcastId]
          setTimeout(() => {
            setBroadcasts(prev => prev.filter(b => b.id !== broadcastId))
          }, 3000)
        }
      } catch { /* ignore */ }
    }
    ws.onerror = () => { delete wsRefs.current[broadcastId] }
    ws.onclose = () => { delete wsRefs.current[broadcastId] }
  }

  useEffect(() => {
    loadBroadcasts().then(running => {
      running.forEach(b => connectWs(b.id))
    })
    const interval = setInterval(() => {
      loadBroadcasts().then(running => {
        running.forEach(b => connectWs(b.id))
      })
    }, 5000)
    return () => {
      clearInterval(interval)
      Object.values(wsRefs.current).forEach(ws => ws.close())
    }
  }, [])

  const handleCancel = async (id) => {
    try {
      await cancelBroadcast(id)
      toast.success('Yayın iptal edildi')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 animate-pulse" />
      case 'pending': return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
      case 'completed': return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
      case 'failed': return <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
      default: return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'running': return 'Çalışıyor'
      case 'pending': return 'Kuyrukta'
      case 'completed': return 'Tamamlandı'
      case 'failed': return 'Başarısız'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-indigo-400 bg-indigo-500/20'
      case 'pending': return 'text-amber-400 bg-amber-500/20'
      case 'completed': return 'text-emerald-400 bg-emerald-500/20'
      case 'failed': return 'text-rose-400 bg-rose-500/20'
      default: return 'text-slate-400 bg-slate-500/20'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center">
              <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            Aktif Yayınlar
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Şu an çalışan veya kuyrukta bekleyen yayınlar</p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Güncelleniyor...</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {[
          { label: 'Aktif', value: broadcasts.filter(b => b.status === 'running').length, color: 'indigo', icon: Radio },
          { label: 'Kuyrukta', value: broadcasts.filter(b => b.status === 'pending').length, color: 'amber', icon: Clock },
          { label: 'Tamamlandı', value: broadcasts.filter(b => b.status === 'completed').length, color: 'emerald', icon: CheckCircle },
          { label: 'Başarısız', value: broadcasts.filter(b => b.status === 'failed').length, color: 'rose', icon: XCircle },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="p-3 sm:p-4 rounded-xl bg-[#1e1e3a] border border-indigo-500/20"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-${stat.color}-500/20`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Broadcasts List */}
      <div className="space-y-3 sm:space-y-4">
        <AnimatePresence>
          {broadcasts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 sm:py-20 bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Aktif yayın yok</h3>
              <p className="text-slate-400 text-sm sm:text-base">Yeni bir yayın başlattığınızda burada görünecek</p>
            </motion.div>
          ) : (
            broadcasts.map((b, index) => {
              const p = progress[b.id]
              const total = p?.total || b.total_groups || 1
              const sent = p?.sent ?? b.sent_count ?? 0
              const failed = p?.failed ?? b.failed_count ?? 0
              const skipped = p?.skipped ?? b.skipped_count ?? 0
              const done = sent + failed + skipped
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              const status = p?.status || b.status
              const currentTitle = p?.current_title

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.05 * index }}
                  className="bg-[#1e1e3a] rounded-xl sm:rounded-2xl border border-indigo-500/20 p-4 sm:p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white">Yayın #{b.id}</h3>
                        <p className="text-xs sm:text-sm text-slate-400 line-clamp-1">{b.message_text || '(medya)'}</p>
                        <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2 text-xs text-slate-500">
                          <span>Oluşturulma: {b.created_at ? new Date(b.created_at).toLocaleString('tr-TR') : '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCancel(b.id)}
                        className="p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                      >
                        <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-slate-500">
                        {currentTitle ? `Gönderiliyor: ${currentTitle}` : 'Hazırlanıyor...'}
                      </span>
                      <span className="text-xs font-medium text-slate-300">{pct}%</span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                      <span className="text-slate-400">Toplam:</span>
                      <span className="text-white font-medium">{total}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                      <span className="text-slate-400">Gönderildi:</span>
                      <span className="text-white font-medium">{sent}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                      <span className="text-slate-400">Başarısız:</span>
                      <span className="text-white font-medium">{failed}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
