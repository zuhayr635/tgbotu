import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listSchedules, cancelSchedule } from '../lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const statusColor = { pending: '#f59e0b', running: '#5b6ef5', completed: '#22c55e', cancelled: '#64748b', failed: '#ef4444' }

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

  return (
    <div>
      <h1 style={pageTitle}>{t('schedules.title')}</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setTab(s)} style={{
            background: tab === s ? '#5b6ef5' : '#2d3150', color: '#fff',
            border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: tab === s ? 700 : 400
          }}>
            {t(`schedules.${s}`)}
          </button>
        ))}
      </div>

      {tasks.length === 0
        ? <p style={{ color: '#64748b' }}>{t('schedules.noTasks')}</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tasks.map(task => (
              <div key={task.id} style={{ background: '#1a1d2e', borderRadius: 12, padding: '16px 20px', border: '1px solid #2d3150' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e2e8f0', fontSize: 14, marginBottom: 6 }}>
                      {task.message_text ? task.message_text.slice(0, 100) : '(medya mesaji)'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>
                      {format(new Date(task.run_at), 'dd.MM.yyyy HH:mm')} — {(task.target_chat_ids || []).length} grup
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 16 }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: statusColor[task.status] + '22', color: statusColor[task.status], fontWeight: 600 }}>
                      {t(`schedules.${task.status}`) || task.status}
                    </span>
                    {task.status === 'pending' && (
                      <button onClick={() => handleCancel(task.id)} style={{ background: '#3d1a1a', color: '#f87171', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>
                        {t('schedules.cancel')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

const pageTitle = { color: '#e2e8f0', fontSize: 22, fontWeight: 700, marginBottom: 24, marginTop: 0 }
