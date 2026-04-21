import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getDashboard, cleanupStorage } from '../lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const statusColor = {
  completed: '#22c55e',
  running: '#6366f1',
  failed: '#ef4444',
  pending: '#f59e0b',
  cancelled: '#475569'
}

const statusBg = {
  completed: 'rgba(34,197,94,0.1)',
  running: 'rgba(99,102,241,0.1)',
  failed: 'rgba(239,68,68,0.1)',
  pending: 'rgba(245,158,11,0.1)',
  cancelled: 'rgba(71,85,105,0.1)'
}

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

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ color: '#475569', fontSize: 14 }}>Yukleniyor...</div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>
          {t('dashboard.title')}
        </h1>
        <p style={{ color: '#475569', fontSize: 13, margin: '4px 0 0' }}>
          Sistem durumu ve son aktiviteler
        </p>
      </div>

      {/* Storage Warning */}
      {data.storage_warning && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span style={{ color: '#fbbf24', fontSize: 13 }}>
              {t('dashboard.storageWarning', { mb: data.storage_mb })}
            </span>
          </div>
          <button onClick={async () => {
            if (!confirm('Tum yuklü medya dosyalari silinecek. Emin misiniz?')) return
            await cleanupStorage()
            toast.success('Depolama temizlendi')
            load()
          }} style={{
            background: 'rgba(245,158,11,0.2)',
            color: '#fbbf24',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, padding: '6px 14px',
            cursor: 'pointer', fontWeight: 600, fontSize: 12,
          }}>
            {t('dashboard.cleanupStorage')}
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard
          label={t('dashboard.totalGroups')}
          value={data.total_groups}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
          color="#6366f1"
          bg="rgba(99,102,241,0.08)"
        />
        <StatCard
          label={t('dashboard.todayBroadcasts')}
          value={data.today_broadcasts}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          color="#22c55e"
          bg="rgba(34,197,94,0.08)"
        />
        <StatCard
          label={t('dashboard.pendingTasks')}
          value={data.pending_tasks}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          color="#f59e0b"
          bg="rgba(245,158,11,0.08)"
        />
        <StatCard
          label={t('dashboard.botStatus')}
          value={data.bot_running ? t('dashboard.botRunning') : t('dashboard.botStopped')}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>}
          color={data.bot_running ? '#22c55e' : '#ef4444'}
          bg={data.bot_running ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'}
          isStatus
        />
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
            <h2 style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, margin: 0 }}>
              {t('dashboard.recentBroadcasts')}
            </h2>
          </div>
          {data.recent_broadcasts.length === 0
            ? <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>{t('dashboard.noRecent')}</p>
            : data.recent_broadcasts.map(b => (
              <div key={b.id} style={{
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.message_preview || '(medya)'}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569' }}>
                    {b.sent_count}/{b.total_groups} grup — {b.created_at ? format(new Date(b.created_at), 'dd.MM HH:mm') : ''}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, padding: '3px 9px', borderRadius: 20, flexShrink: 0,
                  background: statusBg[b.status], color: statusColor[b.status],
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {b.status}
                </span>
              </div>
            ))
          }
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: 'linear-gradient(180deg, #f59e0b, #f97316)' }} />
            <h2 style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, margin: 0 }}>
              {t('dashboard.upcomingTasks')}
            </h2>
          </div>
          {data.upcoming_tasks.length === 0
            ? <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>{t('dashboard.noUpcoming')}</p>
            : data.upcoming_tasks.map(task => (
              <div key={task.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.message_preview || '(medya)'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#475569' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {task.target_count} grup
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {format(new Date(task.run_at), 'dd.MM.yyyy HH:mm')}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, bg, isStatus }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #101624 0%, #0d1220 100%)',
      borderRadius: 14,
      padding: '20px',
      border: '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80,
        borderRadius: '0 14px 0 100%',
        background: bg,
      }} />
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: bg,
        border: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color, marginBottom: 14,
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: isStatus ? 16 : 28,
        fontWeight: 700,
        color: isStatus ? color : '#f1f5f9',
        marginBottom: 4,
        letterSpacing: isStatus ? 0 : '-1px',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

const card = {
  background: 'linear-gradient(135deg, #101624 0%, #0d1220 100%)',
  borderRadius: 14,
  padding: '20px',
  border: '1px solid rgba(255,255,255,0.06)',
}
