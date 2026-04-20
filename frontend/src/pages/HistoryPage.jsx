import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listBroadcasts, getBroadcastLogs, retryFailed } from '../lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const statusColor = { completed: '#22c55e', running: '#5b6ef5', failed: '#ef4444', pending: '#f59e0b', cancelled: '#64748b' }
const logColor = { sent: '#22c55e', failed: '#ef4444', skipped: '#94a3b8' }

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
      <h1 style={pageTitle}>{t('history.title')}</h1>

      {broadcasts.length === 0
        ? <p style={{ color: '#64748b' }}>Henuz yayin yok</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {broadcasts.map(b => (
              <div key={b.id} style={{ background: '#1a1d2e', borderRadius: 12, border: '1px solid #2d3150', overflow: 'hidden' }}>
                <div
                  style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                  onClick={() => toggleExpand(b.id)}
                >
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: statusColor[b.status] + '22', color: statusColor[b.status], fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {t(`history.status.${b.status}`) || b.status}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e2e8f0', fontSize: 13 }}>
                      {b.message_text ? b.message_text.slice(0, 80) : `(${b.media_type})`}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                      {b.created_at ? format(new Date(b.created_at), 'dd.MM.yyyy HH:mm') : ''} — Gonderildi: {b.sent_count} / Basarisiz: {b.failed_count} / Toplam: {b.total_groups}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {b.failed_count > 0 && (
                      <button onClick={e => { e.stopPropagation(); handleRetry(b.id) }} style={{ background: '#2d3150', color: '#f59e0b', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>
                        {t('history.retryFailed')}
                      </button>
                    )}
                    <span style={{ color: '#64748b', fontSize: 14 }}>{expanded === b.id ? 'v' : '>'}</span>
                  </div>
                </div>

                {expanded === b.id && (
                  <div style={{ borderTop: '1px solid #2d3150', padding: '0 20px 12px', maxHeight: 300, overflowY: 'auto' }}>
                    {(logs[b.id] || []).map(log => (
                      <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #1a1d2e', fontSize: 13 }}>
                        <span style={{ color: logColor[log.status], fontWeight: 700, minWidth: 60 }}>
                          {log.status === 'sent' ? 'OK' : log.status === 'failed' ? 'HATA' : 'ATLANDI'}
                        </span>
                        <span style={{ flex: 1, color: '#e2e8f0' }}>{log.chat_title || log.chat_id}</span>
                        {log.error_message && <span style={{ color: '#ef4444', fontSize: 11 }}>{log.error_message}</span>}
                        <span style={{ color: '#64748b', fontSize: 11 }}>{log.sent_at ? format(new Date(log.sent_at), 'HH:mm:ss') : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

const pageTitle = { color: '#e2e8f0', fontSize: 22, fontWeight: 700, marginBottom: 24, marginTop: 0 }
