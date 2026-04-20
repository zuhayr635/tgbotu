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

  // Kategorilere gore grupla
  const grouped = templates.reduce((acc, t) => {
    const cat = t.category || 'Kategorisiz'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={pageTitle}>Mesaj Sablonlari</h1>
        <button onClick={() => setShowForm(!showForm)} style={primaryBtn}>
          {showForm ? 'Iptal' : 'Yeni Sablon'}
        </button>
      </div>

      {showForm && (
        <div style={{ ...card, marginBottom: 20 }}>
          <h2 style={cardTitle}>Yeni Sablon</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Sablon Adi *</label>
              <input value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, width: '100%' }} placeholder="Kampanya mesaji" />
            </div>
            <div>
              <label style={labelStyle}>Kategori</label>
              <input value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, width: '100%' }} placeholder="Duyuru, Kampanya..." />
            </div>
          </div>
          <label style={labelStyle}>Mesaj</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            placeholder={`{Merhaba|Selam} {grup_adi}!\n\nBugün harika bir kampanyamız var...`}
            style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'monospace', marginBottom: 12 }}
          />
          <div style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>
            Spintax: {'{'}Merhaba|Selam|Hey{'}'} — Degiskenler: {'{grup_adi}'} {'{tarih}'} {'{saat}'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <select value={parseMode} onChange={e => setParseMode(e.target.value)} style={{ ...inputStyle, padding: '6px 10px', fontSize: 13 }}>
              <option value="HTML">HTML</option>
              <option value="Markdown">Markdown</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
              <input type="checkbox" checked={disablePreview} onChange={e => setDisablePreview(e.target.checked)} />
              Link onizlemeyi kapat
            </label>
            <label style={{ cursor: 'pointer', background: '#2d3150', color: '#94a3b8', padding: '6px 12px', borderRadius: 8, fontSize: 13 }}>
              {media ? media.name : 'Medya ekle'}
              <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setMedia(e.target.files[0])} />
            </label>
            {media && <button onClick={() => setMedia(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>Kaldir</button>}
          </div>
          <button onClick={handleSave} style={primaryBtn}>Kaydet</button>
        </div>
      )}

      {Object.keys(grouped).length === 0
        ? <p style={{ color: '#64748b' }}>Henuz sablon yok. Yeni Sablon butonuna basin.</p>
        : Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(tpl => (
                <div key={tpl.id} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{tpl.name}</div>
                    {tpl.message_text && (
                      <div style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'hidden' }}>
                        {tpl.message_text.slice(0, 150)}{tpl.message_text.length > 150 ? '...' : ''}
                      </div>
                    )}
                    {tpl.media_type !== 'none' && (
                      <span style={{ fontSize: 11, color: '#5b6ef5', marginTop: 4, display: 'inline-block' }}>{tpl.media_type}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        // Compose sayfasina yonlendir ve sablonu doldur
                        localStorage.setItem('tpl_load', JSON.stringify(tpl))
                        window.location.href = '/broadcast/new'
                      }}
                      style={{ background: '#2d3150', color: '#5b6ef5', border: '1px solid #5b6ef5', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}
                    >
                      Kullan
                    </button>
                    <button onClick={() => handleDelete(tpl.id)} style={{ background: '#3d1a1a', color: '#f87171', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>
                      Sil
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

const pageTitle = { color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: 0 }
const card = { background: '#1a1d2e', borderRadius: 12, padding: 16, border: '1px solid #2d3150' }
const cardTitle = { color: '#e2e8f0', fontSize: 15, fontWeight: 600, margin: '0 0 14px' }
const labelStyle = { display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6 }
const inputStyle = { background: '#0f1117', border: '1px solid #2d3150', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
const primaryBtn = { background: '#5b6ef5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
