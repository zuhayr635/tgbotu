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

  const percent = progress?.total ? Math.round((progress.sent + progress.skipped) / progress.total * 100) : 0

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>
          {t('broadcast.title')}
        </h1>
        <p style={{ color: '#475569', fontSize: 13, margin: '4px 0 0' }}>
          Mesajinizi yazin, gruplarınızı secin ve gonderin
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Sol kolon */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Mesaj kutusu */}
          <div style={card}>
            <div style={sectionLabel}>Mesaj</div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Mesajinizi yazin... {Merhaba|Selam} {grup_adi} gibi spintax ve degisken kullanabilirsiniz."
              rows={7}
              style={{ ...input, resize: 'vertical', width: '100%', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
            <div style={{ color: '#334155', fontSize: 11, marginTop: 8 }}>
              Spintax: {'{Merhaba|Selam|Hey}'}  •  Degiskenler: {'{grup_adi}'} {'{tarih}'} {'{saat}'}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={mediaBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                {media ? media.name : t('broadcast.uploadMedia')}
                <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setMedia(e.target.files[0])} />
              </label>
              {media && (
                <button onClick={() => setMedia(null)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
                  Kaldir
                </button>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
                <input type="checkbox" checked={disablePreview} onChange={e => setDisablePreview(e.target.checked)} style={{ accentColor: '#6366f1' }} />
                {t('broadcast.disablePreview')}
              </label>
              <select value={parseMode} onChange={e => setParseMode(e.target.value)} style={{ ...input, padding: '6px 10px', fontSize: 12, width: 'auto' }}>
                <option value="HTML">HTML</option>
                <option value="Markdown">Markdown</option>
              </select>
            </div>
          </div>

          {/* Gonder / Zamanla */}
          <div style={card}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { key: 'now', label: t('broadcast.sendNow'), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> },
                { key: 'schedule', label: t('broadcast.schedule'), icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              ].map(m => (
                <button key={m.key} onClick={() => setMode(m.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: mode === m.key ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.04)',
                  color: mode === m.key ? '#fff' : '#64748b',
                  border: mode === m.key ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  boxShadow: mode === m.key ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {mode === 'schedule' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={fieldLabel}>{t('broadcast.scheduleDate')}</label>
                  <input type="datetime-local" value={runAt} onChange={e => setRunAt(e.target.value)} style={{ ...input, width: '100%' }} />
                </div>
                <div>
                  <label style={fieldLabel}>Tekrar</label>
                  <select value={repeatType} onChange={e => setRepeatType(e.target.value)} style={{ ...input, width: '100%' }}>
                    <option value="none">Tekrarsiz</option>
                    <option value="daily">Her gun</option>
                    <option value="weekly">Her hafta</option>
                    <option value="monthly">Her ay</option>
                  </select>
                </div>
                {repeatType !== 'none' && (
                  <div>
                    <label style={fieldLabel}>Tekrar bitis tarihi (opsiyonel)</label>
                    <input type="datetime-local" value={repeatEndAt} onChange={e => setRepeatEndAt(e.target.value)} style={{ ...input, width: '100%' }} />
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={broadcasting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                background: broadcasting ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: broadcasting ? 'default' : 'pointer',
                boxShadow: broadcasting ? 'none' : '0 4px 18px rgba(99,102,241,0.4)',
                width: '100%', transition: 'all 0.2s',
              }}
            >
              {broadcasting
                ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Gonderiliyor...</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> {mode === 'now' ? t('broadcast.sendNow') : t('broadcast.saveTask')}</>
              }
            </button>
          </div>

          {/* Progress */}
          {progress && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>
                    {t('broadcast.progress')} — {percent}%
                  </div>
                  {progress.current_title && broadcasting && (
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                      Gonderiliyor: {progress.current_title}
                    </div>
                  )}
                </div>
                {broadcasting && (
                  <button onClick={async () => { if (broadcastId) { await cancelBroadcast(broadcastId); setBroadcasting(false) } }}
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>
                    {t('broadcast.cancel')}
                  </button>
                )}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 6, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  height: '100%', width: `${percent}%`,
                  transition: 'width 0.4s ease',
                  borderRadius: 100,
                }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Gonderildi', value: progress.sent, color: '#22c55e' },
                  { label: 'Basarisiz', value: progress.failed, color: '#ef4444' },
                  { label: 'Atlanan', value: progress.skipped, color: '#64748b' },
                  { label: 'Toplam', value: progress.total, color: '#6366f1' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {progress.current_title && broadcasting && (
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => { if (broadcastId) skipGroup(broadcastId, progress.current_chat_id) }}
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>
                    {t('broadcast.skip')} Bu Grubu
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sag - Grup seçici */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', height: 'fit-content', position: 'sticky', top: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>
                {t('broadcast.selectGroups')}
              </div>
              <div style={{ color: '#6366f1', fontSize: 11, marginTop: 1 }}>{selectedIds.length} secildi</div>
            </div>
            <button onClick={toggleAll} style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#818cf8', cursor: 'pointer', fontSize: 11,
              borderRadius: 7, padding: '5px 10px', fontWeight: 600,
            }}>
              {allSelected ? 'Tumunu Kaldir' : 'Tumunu Sec'}
            </button>
          </div>

          {tags.length > 0 && (
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{ ...input, width: '100%', marginBottom: 10, fontSize: 12 }}>
              <option value="">{t('broadcast.filterByTag')}</option>
              {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          )}

          <div style={{ maxHeight: 460, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.length === 0
              ? <p style={{ color: '#475569', fontSize: 13 }}>{t('broadcast.noGroups')}</p>
              : filtered.map(g => {
                const sel = selectedIds.includes(g.chat_id)
                return (
                  <label key={g.chat_id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 9, cursor: 'pointer',
                    background: sel ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${sel ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    transition: 'all 0.15s',
                  }}>
                    <input type="checkbox" checked={sel} onChange={() => toggle(g.chat_id)} style={{ accentColor: '#6366f1', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: sel ? '#c7d2fe' : '#94a3b8', fontWeight: sel ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.title}
                      </div>
                      <div style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>
                        {g.chat_type}{g.tag ? ` • ${g.tag}` : ''}
                      </div>
                    </div>
                  </label>
                )
              })
            }
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>
    </div>
  )
}

const card = {
  background: 'linear-gradient(135deg, #101624 0%, #0d1220 100%)',
  borderRadius: 14, padding: 20,
  border: '1px solid rgba(255,255,255,0.06)',
}
const input = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 9, padding: '10px 12px',
  color: '#f1f5f9', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
}
const sectionLabel = {
  fontSize: 11, fontWeight: 700, color: '#475569',
  textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10,
}
const fieldLabel = {
  display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500,
}
const mediaBtn = {
  display: 'flex', alignItems: 'center', gap: 7,
  cursor: 'pointer', background: 'rgba(255,255,255,0.04)',
  color: '#64748b', padding: '7px 14px', borderRadius: 9, fontSize: 12,
  border: '1px solid rgba(255,255,255,0.08)',
}
