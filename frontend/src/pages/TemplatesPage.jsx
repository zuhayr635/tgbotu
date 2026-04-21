import { useEffect, useState } from 'react'
import { listTemplates, createTemplate, deleteTemplate } from '../lib/api'
import toast from 'react-hot-toast'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [parseMode, setParseMode] = useState('HTML')
  const [disablePreview, setDisablePreview] = useState(false)
  const [media, setMedia] = useState(null)

  const load = async () => {
    const res = await listTemplates()
    setTemplates(res.data)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Sablon adi gerekli')
    const fd = new FormData()
    fd.append('name', name)
    fd.append('category', category)
    fd.append('message_text', message)
    fd.append('parse_mode', parseMode)
    fd.append('disable_preview', disablePreview)
    if (media) fd.append('media', media)
    await createTemplate(fd)
    toast.success('Sablon kaydedildi')
    setShowForm(false)
    setName(''); setCategory(''); setMessage(''); setMedia(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu sablonu silmek istediginize emin misiniz?')) return
    await deleteTemplate(id)
    toast.success('Silindi')
    load()
  }

  const grouped = templates.reduce((acc, t) => {
    const cat = t.category || 'Genel'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>
            Mesaj Sablonlari
          </h1>
          <p style={{ color: '#475569', fontSize: 13, margin: '4px 0 0' }}>
            {templates.length} sablon kayitli
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: showForm ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: showForm ? '#f87171' : '#fff',
          border: showForm ? '1px solid rgba(239,68,68,0.2)' : 'none',
          borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          boxShadow: showForm ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
        }}>
          {showForm
            ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Iptal</>
            : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Yeni Sablon</>
          }
        </button>
      </div>

      {showForm && (
        <div style={{ ...card, marginBottom: 24, border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
            Yeni Sablon Olustur
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={fieldLabel}>Sablon Adi *</label>
              <input value={name} onChange={e => setName(e.target.value)} style={{ ...input, width: '100%' }} placeholder="Kampanya Mesaji" />
            </div>
            <div>
              <label style={fieldLabel}>Kategori</label>
              <input value={category} onChange={e => setCategory(e.target.value)} style={{ ...input, width: '100%' }} placeholder="Duyuru, Kampanya..." />
            </div>
          </div>
          <label style={fieldLabel}>Mesaj</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            placeholder={`{Merhaba|Selam} {grup_adi}!\n\nBugün harika bir kampanyamız var...`}
            style={{ ...input, width: '100%', resize: 'vertical', fontFamily: 'monospace', marginBottom: 10, lineHeight: 1.6 }}
          />
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#6366f1', marginBottom: 14 }}>
            Spintax: {'{Merhaba|Selam|Hey}'}  •  Degiskenler: {'{grup_adi}'} {'{tarih}'} {'{saat}'} {'{gun}'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <select value={parseMode} onChange={e => setParseMode(e.target.value)} style={{ ...input, padding: '7px 12px', fontSize: 12, width: 'auto' }}>
              <option value="HTML">HTML</option>
              <option value="Markdown">Markdown</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" checked={disablePreview} onChange={e => setDisablePreview(e.target.checked)} style={{ accentColor: '#6366f1' }} />
              Link onizlemeyi kapat
            </label>
            <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#64748b', padding: '7px 14px', borderRadius: 9, fontSize: 12, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              {media ? media.name : 'Medya ekle'}
              <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setMedia(e.target.files[0])} />
            </label>
            {media && (
              <button onClick={() => setMedia(null)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
                Kaldir
              </button>
            )}
          </div>
          <button onClick={handleSave} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
            Kaydet
          </button>
        </div>
      )}

      {Object.keys(grouped).length === 0
        ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div style={{ fontSize: 14 }}>Henuz sablon yok</div>
          </div>
        )
        : Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: '#6366f1' }} />
              <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{cat}</div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ color: '#334155', fontSize: 11 }}>{items.length} sablon</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(tpl => (
                <div key={tpl.id} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{tpl.name}</div>
                    {tpl.message_text && (
                      <div style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 48, overflow: 'hidden', lineHeight: 1.5 }}>
                        {tpl.message_text.slice(0, 140)}{tpl.message_text.length > 140 ? '...' : ''}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 600 }}>{tpl.parse_mode}</span>
                      {tpl.media_type !== 'none' && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(6,182,212,0.1)', color: '#22d3ee', fontWeight: 600 }}>{tpl.media_type}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => { localStorage.setItem('tpl_load', JSON.stringify(tpl)); window.location.href = '/broadcast/new' }}
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      Kullan
                    </button>
                    <button onClick={() => handleDelete(tpl.id)} style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  )
}

const card = { background: 'linear-gradient(135deg, #101624 0%, #0d1220 100%)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }
const fieldLabel = { display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500 }
const input = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '10px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
