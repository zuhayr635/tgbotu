import { useEffect, useState } from 'react'
import { listSchedules, cancelSchedule } from '../lib/api'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { tr } from 'date-fns/locale'
import toast from 'react-hot-toast'

const STATUS_COLOR = { pending: '#f59e0b', running: '#5b6ef5', completed: '#22c55e', cancelled: '#64748b', failed: '#ef4444' }
const REPEAT_LABEL = { none: '', daily: 'Her gun', weekly: 'Her hafta', monthly: 'Her ay' }

export default function CalendarPage() {
  const [tasks, setTasks] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selected, setSelected] = useState(null)

  const load = async () => {
    const res = await listSchedules()
    setTasks(res.data)
  }

  useEffect(() => { load() }, [])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })

  const tasksForDay = (day) => tasks.filter(t => isSameDay(new Date(t.run_at), day))

  const handleCancel = async (id) => {
    if (!confirm('Bu gorevi iptal etmek istediginize emin misiniz?')) return
    await cancelSchedule(id)
    toast.success('Iptal edildi')
    setSelected(null)
    load()
  }

  // Haftanin ilk gunu pazartesi
  const firstDayOfWeek = startOfMonth(currentMonth).getDay()
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  const weekDays = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={pageTitle}>Gorev Takvimi</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={navBtn}>Onceki</button>
          <span style={{ color: '#e2e8f0', fontWeight: 600, minWidth: 130, textAlign: 'center' }}>
            {format(currentMonth, 'MMMM yyyy', { locale: tr })}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={navBtn}>Sonraki</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {weekDays.map(d => (
          <div key={d} style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 700, padding: '6px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const dayTasks = tasksForDay(day)
          const isToday = isSameDay(day, new Date())
          return (
            <div
              key={day.toISOString()}
              onClick={() => dayTasks.length && setSelected({ day, tasks: dayTasks })}
              style={{
                background: isToday ? 'rgba(91,110,245,0.15)' : '#1a1d2e',
                border: `1px solid ${isToday ? '#5b6ef5' : '#2d3150'}`,
                borderRadius: 8, padding: '8px 6px', minHeight: 70,
                cursor: dayTasks.length ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontSize: 12, color: isToday ? '#5b6ef5' : '#94a3b8', fontWeight: isToday ? 700 : 400, marginBottom: 4 }}>
                {format(day, 'd')}
              </div>
              {dayTasks.slice(0, 3).map(t => (
                <div key={t.id} style={{
                  fontSize: 10, borderRadius: 4, padding: '2px 5px', marginBottom: 2,
                  background: STATUS_COLOR[t.status] + '33', color: STATUS_COLOR[t.status],
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                }}>
                  {format(new Date(t.run_at), 'HH:mm')} {t.message_text ? t.message_text.slice(0, 15) : '(medya)'}
                </div>
              ))}
              {dayTasks.length > 3 && <div style={{ fontSize: 10, color: '#64748b' }}>+{dayTasks.length - 3} daha</div>}
            </div>
          )
        })}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={{ background: '#1a1d2e', borderRadius: 16, padding: 24, width: 440, maxHeight: '80vh', overflowY: 'auto', border: '1px solid #2d3150' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ color: '#e2e8f0', margin: 0, fontSize: 16 }}>
                {format(selected.day, 'dd MMMM yyyy', { locale: tr })}
              </h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>x</button>
            </div>
            {selected.tasks.map(t => (
              <div key={t.id} style={{ borderBottom: '1px solid #2d3150', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>
                    {format(new Date(t.run_at), 'HH:mm')}
                  </span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: STATUS_COLOR[t.status] + '22', color: STATUS_COLOR[t.status] }}>
                    {t.status}
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>
                  {t.message_text ? t.message_text.slice(0, 100) : '(medya mesaji)'}
                </div>
                <div style={{ color: '#64748b', fontSize: 12 }}>
                  {(t.target_chat_ids || []).length} grup
                  {t.repeat_type && t.repeat_type !== 'none' && (
                    <span style={{ color: '#5b6ef5', marginLeft: 8 }}>{REPEAT_LABEL[t.repeat_type] || t.repeat_type}</span>
                  )}
                </div>
                {t.status === 'pending' && (
                  <button onClick={() => handleCancel(t.id)} style={{ marginTop: 8, background: '#3d1a1a', color: '#f87171', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                    Iptal Et
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const pageTitle = { color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: 0 }
const navBtn = { background: '#2d3150', color: '#e2e8f0', border: 'none', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13 }
