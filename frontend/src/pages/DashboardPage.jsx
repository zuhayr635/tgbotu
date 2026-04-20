import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getDashboard, cleanupStorage } from '../lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const statusColor = { completed: '#22c55e', running: '#5b6ef5', failed: '#ef4444', pending: '#f59e0b', cancelled: '#64748b' }

export default function DashboardPage() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)

  const load = async () => {
    try {
      const res = await getDashboard()
      setData(res.data)
    } catch { toast.error('Yuklenemedi') }
  }

  useEffect(() => { load() }, [])

  const handleCleanup = async () => {
    if (!confirm('Tum yuklü medya dosyalari silinecek. Emin misiniz?')) return
    await cleanupStorage()
    toast.success('Depolama temizlendi')
    load()
  }

  if (!data) return <div style={{ color: '#64748b' }}>{t('common.loading')}</div>

  return (
    <div>
      <h1 style={pageTitle}>{t('dashboard.title')}</h1>

      {data.storage_warning && (
        <div style={{ background: '#3d2800', border: '1px solid #f59e0b', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fbbf24', fontSize: 14 }}>
            {t('dashboard.storageWarning', { mb: data.storage_mb })}
          </span>
          <button onClick={handleCleanup} style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {t('dashboard.cleanupStorage')}
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label={t('dashboard.totalGroups')} value={data.total_groups} />
        <StatCard label={t('dashboard.todayBroadcasts')} value={data.today_broadcasts} />
        <StatCard label={t('dashboard.pendingTasks')} value={data.pending_tasks} />
        <StatCard
          label={t('dashboard.botStatus')}
          value={data.bot_running ? t('dashboard.botRunning') : t('dashboard.botStopped')}
          valueColor={data.bot_running ? '#22c55e' : '#ef4444'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={card}>
          <h2 style={cardTitle}>{t('dashboard.recentBroadcasts')}</h2>
          {data.recent_broadcasts.length === 0
            ? <p style={{ color: '#64748b', fontSize: 14 }}>{t('dashboard.noRecent')}</p>
            : data.recent_broadcasts.map(b => (
              <div key={b.id} style={{ borderBottom: '1px solid #2d3150', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 2 }}>
                    {b.message_preview || '(medya)'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {b.sent_count}/{b.total_groups} — {b.created_at ? format(new Date(b.created_at), 'dd.MM HH:mm') : ''}
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: statusColor[b.status] + '22', color: statusColor[b.status], fontWeight: 600 }}>
                  {b.status}
                </span>
              </div>
            ))
          }
        </div>

        <div style={card}>
          <h2 style={cardTitle}>{t('dashboard.upcomingTasks')}</h2>
          {data.upcoming_tasks.length === 0
            ? <p style={{ color: '#64748b', fontSize: 14 }}>{t('dashboard.noUpcoming')}</p>
            : data.upcoming_tasks.map(t2 => (
              <div key={t2.id} style={{ borderBottom: '1px solid #2d3150', padding: '10px 0' }}>
                <div style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 2 }}>
                  {t2.message_preview || '(medya)'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {t2.target_count} grup — {format(new Date(t2.run_at), 'dd.MM.yyyy HH:mm')}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, valueColor }) {
  return (
    <div style={{ background: '#1a1d2e', borderRadius: 12, padding: '20px', border: '1px solid #2d3150' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: valueColor || '#e2e8f0', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
    </div>
  )
}

const pageTitle = { color: '#e2e8f0', fontSize: 22, fontWeight: 700, marginBottom: 24, marginTop: 0 }
const card = { background: '#1a1d2e', borderRadius: 12, padding: 20, border: '1px solid #2d3150' }
const cardTitle = { color: '#e2e8f0', fontSize: 15, fontWeight: 600, margin: '0 0 16px' }
