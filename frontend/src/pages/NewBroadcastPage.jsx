import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getGroups, getTags, createBroadcast, createSchedule, skipGroup, cancelBroadcast } from '../lib/api'
import toast from 'react-hot-toast'

export default function NewBroadcastPage() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState([])
  const [tags, setTags] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [tagFilter, setTagFilter] = useState('')
  const [message, setMessage] = useState('')
  const [media, setMedia] = useState(null)
  const [disablePreview, setDisablePreview] = useState(false)
  const [parseMode, setParseMode] = useState('HTML')
  const [mode, setMode] = useState('now')
  const [runAt, setRunAt] = useState('')
  const [repeatType, setRepeatType] = useState('none')
  const [repeatEndAt, setRepeatEndAt] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [broadcastId, setBroadcastId] = useState(null)
  const [progress, setProgress] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    getGroups().then(r => setGroups(r.data.filter(g => !g.is_blacklisted)))
    getTags().then(r => setTags(r.data))

    // Sablon yukleme
    const tplRaw = localStorage.getItem('tpl_load')
    if (tplRaw) {
      try {
        const tpl = JSON.parse(tplRaw)
        if (tpl.message_text) setMessage(tpl.message_text)
        if (tpl.parse_mode) setParseMode(tpl.parse_mode)
        if (tpl.disable_preview !== undefined) setDisablePreview(tpl.disable_preview)
        localStorage.removeItem('tpl_load')
      } catch (_) {}
    }
  }, [])

  const filtered = tagFilter ? groups.filter(g => g.tag === tagFilter) : groups
  const allSelected = filtered.length > 0 && filtered.every(g => selectedIds.includes(g.chat_id))

  const toggleAll = () => {
    const ids = filtered.map(g => g.chat_id)
    if (allSelected) setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
    else setSelectedIds(prev => [...new Set([...prev, ...ids])])
  }

  const toggle = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const startProgressWS = (bcId) => {
    const token = localStorage.getItem('token')
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/broadcasts/${bcId}/ws?token=${token}`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setProgress(data)
      if (data.status === 'completed' || data.status === 'cancelled') {
        setBroadcasting(false)
        ws.close()
      }
    }
    ws.onerror = () => setBroadcasting(false)
  }

  const handleSend = async () => {
    if (!message.trim() && !media) return toast.error('Mesaj veya medya gerekli')
    if (selectedIds.length === 0) return toast.error('En az bir grup secin')

    const fd = new FormData()
    fd.append('message_text', message)
    fd.append('chat_ids', JSON.stringify(selectedIds))
    fd.append('disable_preview', disablePreview)
    fd.append('parse_mode', parseMode)
    if (media) fd.append('media', media)

    try {
      if (mode === 'now') {
        const res = await createBroadcast(fd)
        const bcId = res.data.broadcast_id
        setBroadcastId(bcId)
        setBroadcasting(true)
        setProgress({ total: selectedIds.length, sent: 0, failed: 0, skipped: 0, status: 'running' })
        startProgressWS(bcId)
        toast.success('Yayin baslatildi')
      } else {
        if (!runAt) return toast.error('Tarih ve saat secin')
        fd.append('run_at', runAt)
        fd.append('repeat_type', repeatType)
        if (repeatEndAt) fd.append('repeat_end_at', repeatEndAt)
        await createSchedule(fd)
        toast.success('Gorev zamanlandı')
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata olustu')
    }
  }

  const handleSkip = async (chatId) => {
    if (broadcastId) await skipGroup(broadcastId, chatId)
  }

  const handleCancel = async () => {
    if (broadcastId) {
      await cancelBroadcast(broadcastId)
      setBroadcasting(false)
    }
  }

  const percent = progress?.total ? Math.round((progress.sent + progress.skipped) / progress.total * 100) : 0

  return (
    <div>
      <h1 style={pageTitle}>{t('broadcast.title')}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={card}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('broadcast.messagePlaceholder')}
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', width: '100%', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ cursor: 'pointer', background: '#2d3150', color: '#94a3b8', padding: '7px 14px', borderRadius: 8, fontSize: 13 }}>
                {media ? media.name : t('broadcast.uploadMedia')}
                <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setMedia(e.target.files[0])} />
              </label>
              {media && <button onClick={() => setMedia(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>Kaldir</button>}

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                <input type="checkbox" checked={disablePreview} onChange={e => setDisablePreview(e.target.checked)} />
                {t('broadcast.disablePreview')}
              </label>

              <select value={parseMode} onChange={e => setParseMode(e.target.value)} style={{ ...inputStyle, padding: '6px 10px', fontSize: 13 }}>
                <option value="HTML">HTML</option>
                <option value="Markdown">Markdown</option>
              </select>
            </div>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {['now', 'schedule'].map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  background: mode === m ? '#5b6ef5' : '#2d3150',
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600
                }}>
                  {m === 'now' ? t('broadcast.sendNow') : t('broadcast.schedule')}
                </button>
              ))}
            </div>

            {mode === 'schedule' && (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={labelStyle}>{t('broadcast.scheduleDate')}</label>
                  <input type="datetime-local" value={runAt} onChange={e => setRunAt(e.target.value)}
                    style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={labelStyle}>Tekrar</label>
                  <select value={repeatType} onChange={e => setRepeatType(e.target.value)}
                    style={{ ...inputStyle, width: '100%' }}>
                    <option value="none">Tekrarsiz</option>
                    <option value="daily">Her gun</option>
                    <option value="weekly">Her hafta</option>
                    <option value="monthly">Her ay</option>
                  </select>
                </div>
                {repeatType !== 'none' && (
                  <div>
                    <label style={labelStyle}>Tekrar bitis tarihi (opsiyonel)</label>
                    <input type="datetime-local" value={repeatEndAt} onChange={e => setRepeatEndAt(e.target.value)}
                      style={{ ...inputStyle, width: '100%' }} />
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={broadcasting}
              style={{ background: '#5b6ef5', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: broadcasting ? 0.6 : 1 }}
            >
              {broadcasting ? t('broadcast.sending') : (mode === 'now' ? t('broadcast.sendNow') : t('broadcast.saveTask'))}
            </button>
          </div>

          {progress && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{t('broadcast.progress')} — {percent}%</span>
                {broadcasting && (
                  <button onClick={handleCancel} style={{ background: '#3d1a1a', color: '#f87171', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>
                    {t('broadcast.cancel')}
                  </button>
                )}
              </div>
              <div style={{ background: '#2d3150', borderRadius: 8, height: 10, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ background: '#5b6ef5', height: '100%', width: `${percent}%`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                <span style={{ color: '#22c55e' }}>Gonderildi: {progress.sent}</span>
                <span style={{ color: '#ef4444' }}>Basarisiz: {progress.failed}</span>
                <span style={{ color: '#94a3b8' }}>Atlanan: {progress.skipped}</span>
                <span style={{ color: '#64748b' }}>Toplam: {progress.total}</span>
              </div>
              {progress.current_title && broadcasting && (
                <div style={{ marginTop: 10, fontSize: 13, color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Gonderiliyor: {progress.current_title}</span>
                  <button onClick={() => handleSkip(progress.current_chat_id)} style={{ background: '#2d3150', color: '#94a3b8', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                    {t('broadcast.skip')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{t('broadcast.selectGroups')} ({selectedIds.length})</span>
            <button onClick={toggleAll} style={{ background: 'none', border: 'none', color: '#5b6ef5', cursor: 'pointer', fontSize: 12 }}>
              {allSelected ? t('broadcast.deselectAll') : t('broadcast.selectAll')}
            </button>
          </div>

          {tags.length > 0 && (
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{ ...inputStyle, width: '100%', marginBottom: 10, fontSize: 12 }}>
              <option value="">{t('broadcast.filterByTag')}</option>
              {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          )}

          <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.length === 0
              ? <p style={{ color: '#64748b', fontSize: 13 }}>{t('broadcast.noGroups')}</p>
              : filtered.map(g => (
                <label key={g.chat_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: selectedIds.includes(g.chat_id) ? 'rgba(91,110,245,0.1)' : 'transparent', border: `1px solid ${selectedIds.includes(g.chat_id) ? '#5b6ef5' : 'transparent'}` }}>
                  <input type="checkbox" checked={selectedIds.includes(g.chat_id)} onChange={() => toggle(g.chat_id)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#e2e8f0' }}>{g.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{g.chat_type}{g.tag ? ` — ${g.tag}` : ''}</div>
                  </div>
                </label>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}

const pageTitle = { color: '#e2e8f0', fontSize: 22, fontWeight: 700, marginBottom: 24, marginTop: 0 }
const card = { background: '#1a1d2e', borderRadius: 12, padding: 20, border: '1px solid #2d3150' }
const inputStyle = { background: '#0f1117', border: '1px solid #2d3150', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6 }
