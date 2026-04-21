import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getGroups, updateGroup, addGroup } from '../lib/api'
import toast from 'react-hot-toast'

const TYPE_COLOR = {
  group: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'Grup' },
  supergroup: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Supergroup' },
  channel: { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', label: 'Kanal' },
}

export default function GroupsPage() {
  const { t } = useTranslation()
  const [groups, setGroups] = useState([])
  const [search, setSearch] = useState('')
  const [editTag, setEditTag] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [addInput, setAddInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('all') // all | admin | active | blacklisted

  const load = async () => {
    try {
      const res = await getGroups(false)
      setGroups(res.data)
    } catch { toast.error('Yuklenemedi') }
  }

  useEffect(() => { load() }, [])

  const handleTagSave = async (id) => {
    await updateGroup(id, { tag: editTag[id] || null })
    toast.success('Etiket kaydedildi')
    load()
  }

  const handleBlacklist = async (id, current) => {
    await updateGroup(id, { is_blacklisted: !current })
    load()
  }

  const handleAdd = async () => {
    if (!addInput.trim()) return
    setAdding(true)
    try {
      const res = await addGroup(addInput.trim())
      toast.success(res.data.message)
      setAddInput('')
      setShowAdd(false)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Grup eklenemedi')
    } finally {
      setAdding(false)
    }
  }

  const filtered = groups.filter(g => {
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'admin') return g.is_admin
    if (filter === 'active') return g.is_active && !g.is_blacklisted
    if (filter === 'inactive') return !g.is_active
    if (filter === 'blacklisted') return g.is_blacklisted
    return true
  })

  const adminCount = groups.filter(g => g.is_admin).length
  const blacklistCount = groups.filter(g => g.is_blacklisted).length
  const activeCount = groups.filter(g => g.is_active && !g.is_blacklisted).length
  const inactiveCount = groups.filter(g => !g.is_active).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>
            {t('groups.title')}
          </h1>
          <p style={{ color: '#475569', fontSize: 13, margin: '4px 0 0' }}>
            {groups.length} kayitli · <span style={{ color: '#4ade80' }}>{activeCount} aktif</span> · <span style={{ color: '#f87171' }}>{inactiveCount} bot yok</span> · {adminCount} admin
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: showAdd ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: showAdd ? '#f87171' : '#fff',
            border: showAdd ? '1px solid rgba(239,68,68,0.2)' : 'none',
            borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            boxShadow: showAdd ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
          }}
        >
          {showAdd
            ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Iptal</>
            : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Grup Ekle</>
          }
        </button>
      </div>

      {/* Add Group Panel */}
      {showAdd && (
        <div style={{
          background: 'linear-gradient(135deg, #101624 0%, #0d1220 100%)',
          borderRadius: 14, padding: 20,
          border: '1px solid rgba(99,102,241,0.2)',
          marginBottom: 20,
          boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
            Grup / Kanal Ekle
          </div>
          <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 14px' }}>
            Botun üye oldugu bir grubun ID'sini veya @kullaniciadi'ni girin. Bot o grupta olmak zorunda.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={addInput}
              onChange={e => setAddInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="-100123456789 veya @grupadi"
              style={{ ...input, flex: 1 }}
            />
            <button
              onClick={handleAdd}
              disabled={adding}
              style={{
                background: adding ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: 9,
                padding: '10px 20px', cursor: adding ? 'default' : 'pointer',
                fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {adding
                ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Ekleniyor...</>
                : 'Ekle'
              }
            </button>
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.12)', fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
            <strong style={{ color: '#818cf8' }}>Ipucu:</strong> Grup ID'sini bulmak icin gruba <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>@userinfobot</code> ekleyip /start yazin.
            Kanal icin bota yönetici yetkisi verin.
          </div>
        </div>
      )}

      {/* Filter tabs + Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { key: 'all', label: `Tumu (${groups.length})` },
            { key: 'active', label: `Aktif (${activeCount})`, color: '#22c55e' },
            { key: 'inactive', label: `Bot Yok (${inactiveCount})`, color: '#ef4444' },
            { key: 'admin', label: `Admin (${adminCount})`, color: '#6366f1' },
            { key: 'blacklisted', label: `Kara Liste (${blacklistCount})`, color: '#f59e0b' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: filter === f.key ? '#a5b4fc' : '#64748b',
                border: filter === f.key ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: filter === f.key ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('groups.search')}
            style={{ ...input, paddingLeft: 34, width: '100%' }}
          />
        </div>

        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,255,255,0.04)', color: '#64748b',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 9, padding: '9px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 500,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          {t('groups.refresh')}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {filtered.length === 0
        ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <div style={{ fontSize: 14 }}>Grup bulunamadi</div>
          </div>
        )
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(g => {
              const tc = TYPE_COLOR[g.chat_type] || TYPE_COLOR.group
              return (
                <div key={g.id} style={{
                  background: !g.is_active ? 'rgba(12,14,24,0.8)' : g.is_blacklisted ? 'rgba(15,18,30,0.5)' : 'linear-gradient(135deg, #101624 0%, #0d1220 100%)',
                  borderRadius: 12, padding: '14px 18px',
                  border: `1px solid ${!g.is_active ? 'rgba(239,68,68,0.12)' : g.is_blacklisted ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)'}`,
                  borderLeft: `3px solid ${!g.is_active ? '#ef4444' : g.is_blacklisted ? '#f59e0b' : '#22c55e'}`,
                  opacity: (!g.is_active || g.is_blacklisted) ? 0.65 : 1,
                  display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                  transition: 'all 0.15s',
                }}>
                  {/* Type badge */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: tc.bg, border: `1px solid ${tc.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: tc.color, flexShrink: 0,
                  }}>
                    {g.chat_type === 'channel'
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.09 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.35 7.66a16 16 0 006 6l.96-.96a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{g.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: tc.bg, color: tc.color, fontWeight: 600 }}>
                        {tc.label}
                      </span>
                      {/* Durum rozeti */}
                      {!g.is_active ? (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                          Bot Yok
                        </span>
                      ) : g.is_blacklisted ? (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                          Kara Liste
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                          Aktif
                        </span>
                      )}
                      {g.member_count > 0 && (
                        <span style={{ fontSize: 11, color: '#475569' }}>{g.member_count.toLocaleString()} uye</span>
                      )}
                      {g.username && (
                        <span style={{ fontSize: 11, color: '#475569' }}>@{g.username}</span>
                      )}
                      {g.is_admin && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 600 }}>
                          Admin
                        </span>
                      )}
                      {g.tag && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 600 }}>
                          {g.tag}
                        </span>
                      )}
                    </div>
                    {g.chat_type === 'channel' && !g.is_admin && (
                      <div style={{ color: '#f59e0b', fontSize: 10, marginTop: 4 }}>
                        {t('groups.adminRequired')}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      value={editTag[g.id] !== undefined ? editTag[g.id] : (g.tag || '')}
                      onChange={e => setEditTag({ ...editTag, [g.id]: e.target.value })}
                      placeholder="Etiket..."
                      style={{ ...input, width: 100, padding: '6px 10px', fontSize: 11 }}
                    />
                    <button onClick={() => handleTagSave(g.id)} style={{
                      background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    }}>
                      Kaydet
                    </button>
                  </div>

                  <button
                    onClick={() => handleBlacklist(g.id, g.is_blacklisted)}
                    style={{
                      background: g.is_blacklisted ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: g.is_blacklisted ? '#22c55e' : '#f87171',
                      border: `1px solid ${g.is_blacklisted ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                    }}
                  >
                    {g.is_blacklisted ? 'Aktive Et' : 'Devre Disi'}
                  </button>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

const input = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 9, padding: '9px 12px',
  color: '#f1f5f9', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
}
