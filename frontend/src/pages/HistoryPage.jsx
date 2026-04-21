import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listBroadcasts, getBroadcastLogs, retryFailed } from '../lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS = {
  completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  label: 'Tamamlandi' },
  running:   { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'Calisiyor' },
  failed:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  label: 'Basarisiz' },
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Bekliyor' },
  cancelled: { color: '#475569', bg: 'rgba(71,85,105,0.1)',  label: 'Iptal' },
}

const LOG_STATUS = {
  sent:    { color: '#22c55e', label: 'GONDERILDI' },
  failed:  { color: '#ef4444', label: 'HATA' },
  skipped: { color: '#475569', label: 'ATLANDI' },
}

export default function HistoryPage() {
  const { t } = useTranslation()
  const [broadcasts, setBroadcasts] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [logs, setLogs] = useState({})

  useEffect(() => {
    listBroadcasts().then(r => setBroadcasts(r.data))
  }, [])

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!logs[id]) {
      const res = await getBroadcastLogs(id)
      setLogs(prev => ({ ...prev, [id]: res.data }))
    }
  }

  const handleRetry = async (id) => {
    try {
      const res = await retryFailed(id)
      toast.success(res.data.message)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>
          {t('history.title')}
        </h1>
        <p style={{ color: '#475569', fontSize: 13, margin: '4px 0 0' }}>
          Tum yayin gecmisi ve detayli loglar
        </p>
      </div>

      {broadcasts.length === 0
        ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <div style={{ fontSize: 14 }}>Henuz yayin yok</div>
          </div>
        )
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {broadcasts.map(b => {
              const s = STATUS[b.status] || STATUS.completed
              const isOpen = expanded === b.id
              const total = b.total_groups || 1
              const sentPct = Math.round((b.sent_count / total) * 100)
              const failPct = Math.round((b.failed_count / total) * 100)

              return (
                <div key={b.id} style={{
                  background: 'linear-gradient(135deg, #101624 0%, #0d1220 100%)',
                  borderRadius: 14,
                  border: `1px solid ${isOpen ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}>
                  <div
                    style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                    onClick={() => toggleExpand(b.id)}
                  >
                    <span style={{
                      fontSize: 10, padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                      background: s.bg, color: s.color, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.4px',
                    }}>
                      {s.label}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#cbd5e1', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                        {b.message_text ? b.message_text.slice(0, 80) : `(${b.media_type})`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#475569' }}>
                        <span>{b.created_at ? format(new Date(b.created_at), 'dd.MM.yyyy HH:mm') : ''}</span>
                        <span style={{ color: '#22c55e' }}>{b.sent_count} OK</span>
                        {b.failed_count > 0 && <span style={{ color: '#ef4444' }}>{b.failed_count} HATA</span>}
                        <span>/ {b.total_groups} toplam</span>
                      </div>
                    </div>

                    {/* Mini progress */}
                    <div style={{ width: 60, flexShrink: 0 }}>
                      <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${sentPct}%`, background: '#22c55e', borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 10, color: '#475569', textAlign: 'center', marginTop: 3 }}>{sentPct}%</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {b.failed_count > 0 && (
                        <button onClick={e => { e.stopPropagation(); handleRetry(b.id) }} style={{
                          background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                          border: '1px solid rgba(245,158,11,0.2)',
                          borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        }}>
                          Tekrar Dene
                        </button>
                      )}
                      <div style={{ color: '#334155', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', maxHeight: 320, overflowY: 'auto' }}>
                      {(logs[b.id] || []).map(log => {
                        const ls = LOG_STATUS[log.status] || LOG_STATUS.skipped
                        return (
                          <div key={log.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '9px 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            fontSize: 12,
                          }}>
                            <span style={{ color: ls.color, fontWeight: 700, fontSize: 10, minWidth: 72, letterSpacing: '0.4px' }}>
                              {ls.label}
                            </span>
                            <span style={{ flex: 1, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.chat_title || log.chat_id}
                            </span>
                            {log.error_message && (
                              <span style={{ color: '#ef4444', fontSize: 10, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.error_message}
                              </span>
                            )}
                            <span style={{ color: '#334155', fontSize: 10, flexShrink: 0 }}>
                              {log.sent_at ? format(new Date(log.sent_at), 'HH:mm:ss') : ''}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
