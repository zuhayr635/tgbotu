import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listSchedules, cancelSchedule } from '../lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Bekliyor' },
  running:   { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  label: 'Calisiyor' },
  completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   label: 'Tamamlandi' },
  cancelled: { color: '#475569', bg: 'rgba(71,85,105,0.1)',   label: 'Iptal Edildi' },
  failed:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Basarisiz' },
}

const REPEAT = { none: null, daily: 'Her gun', weekly: 'Her hafta', monthly: 'Her ay' }

export default function SchedulesPage() {
  const { t } = useTranslation()
  const [tasks, setTasks] = useState([])
  const [tab, setTab] = useState('pending')

  const load = async () => {
    try {
      const res = await listSchedules(tab)
      setTasks(res.data)
    } catch { toast.error('Yuklenemedi') }
  }

  useEffect(() => { load() }, [tab])

  const handleCancel = async (id) => {
    if (!confirm('Bu gorevi iptal etmek istediginize emin misiniz?')) return
    try {
      await cancelSchedule(id)
      toast.success('Gorev iptal edildi')
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata')
    }
  }

  const tabs = [
    { key: 'pending', label: 'Bekleyen' },
    { key: 'completed', label: 'Tamamlanan' },
    { key: 'cancelled', label: 'Iptal Edilen' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>
          {t('schedules.title')}
        </h1>
        <p style={{ color: '#475569', fontSize: 13, margin: '4px 0 0' }}>
          Zamanlanan ve gecmis gorevler
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(s => (
          <button key={s.key} onClick={() => setTab(s.key)} style={{
            background: tab === s.key ? 'rgba(99,102,241,0.2)' : 'transparent',
            color: tab === s.key ? '#a5b4fc' : '#475569',
            border: tab === s.key ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
            borderRadius: 9, padding: '7px 18px', cursor: 'pointer', fontSize: 12, fontWeight: tab === s.key ? 700 : 500,
            transition: 'all 0.15s',
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {tasks.length === 0
        ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div style={{ fontSize: 14 }}>Gorev bulunamadi</div>
          </div>
        )
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.map(task => {
              const s = STATUS[task.status] || STATUS.pending
              const repeat = REPEAT[task.repeat_type]
              return (
                <div key={task.id} style={{
                  background: 'linear-gradient(135deg, #101624 0%, #0d1220 100%)',
                  borderRadius: 14, padding: '16px 20px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.message_text ? task.message_text.slice(0, 120) : '(medya mesaji)'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {format(new Date(task.run_at), 'dd.MM.yyyy HH:mm')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        {(task.target_chat_ids || []).length} grup
                      </div>
                      {repeat && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 600 }}>
                          {repeat}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, padding: '4px 10px', borderRadius: 20,
                      background: s.bg, color: s.color, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.4px',
                    }}>
                      {s.label}
                    </span>
                    {task.status === 'pending' && (
                      <button onClick={() => handleCancel(task.id)} style={{
                        background: 'rgba(239,68,68,0.1)', color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      }}>
                        Iptal
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
