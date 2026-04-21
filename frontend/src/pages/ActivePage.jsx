import { useEffect, useState, useRef } from 'react'
import { listBroadcasts, cancelBroadcast, skipGroup } from '../lib/api'
import toast from 'react-hot-toast'

const WS_BASE = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host

export default function ActivePage() {
  const [broadcasts, setBroadcasts] = useState([])
  const [progress, setProgress] = useState({}) // broadcastId → progress obj
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
          // Tamamlananları listeden kaldır
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
    // Her 5 saniyede bir yeni running broadcast'leri kontrol et
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

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          Aktif Yayınlar
        </h1>
        <p style={{ color: '#475569', fontSize: 13, margin: '4px 0 0' }}>
          Şu an çalışan veya kuyrukta bekleyen yayınlar
        </p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {broadcasts.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'linear-gradient(135deg, #101624 0%, #0d1220 100%)',
          borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <div style={{ color: '#475569', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Aktif yayın yok</div>
          <div style={{ color: '#334155', fontSize: 13 }}>Yeni bir yayın başlattığınızda burada görünecek</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {broadcasts.map(b => {
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
              <div key={b.id} style={{
                background: 'linear-gradient(135deg, #101624 0%, #0d1220 100%)',
                borderRadius: 16,
                border: '1px solid rgba(99,102,241,0.2)',
                padding: '20px 24px',
                boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {status === 'running' && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                      )}
                      {status === 'pending' && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: status === 'running' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)', color: status === 'running' ? '#818cf8' : '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {status === 'running' ? 'Çalışıyor' : 'Kuyrukta'}
                      </span>
                      <span style={{ color: '#334155', fontSize: 11 }}>#{b.id}</span>
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                      {b.message_text ? b.message_text.slice(0, 100) : `(${b.media_type})`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(b.id)}
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
                  >
                    İptal Et
                  </button>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {currentTitle ? (
                        <span>Gönderiliyor: <span style={{ color: '#94a3b8' }}>{currentTitle}</span></span>
                      ) : 'Hazırlanıyor...'}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                      borderRadius: 6,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Gönderildi', value: sent, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
                    { label: 'Hata', value: failed, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
                    { label: 'Atlanan', value: skipped, color: '#64748b', bg: 'rgba(255,255,255,0.04)' },
                    { label: 'Toplam', value: total, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: stat.bg, borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: `1px solid ${stat.color}18` }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
