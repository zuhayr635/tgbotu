import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getGroups, updateGroup } from '../lib/api'
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

  const filtered = groups.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase())
  )

  const active = filtered.filter(g => !g.is_blacklisted)
  const inactive = filtered.filter(g => g.is_blacklisted)

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>
          {t('groups.title')}
        </h1>
        <p style={{ color: '#475569', fontSize: 13, margin: '4px 0 0' }}>
          {groups.length} grup/kanal kayitli
        </p>
      </div>

      {/* Search + Refresh */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
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

      {filtered.length === 0
        ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <div style={{ fontSize: 14 }}>Grup bulunamadi</div>
          </div>
        )
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...active, ...inactive].map(g => {
              const tc = TYPE_COLOR[g.chat_type] || TYPE_COLOR.group
              return (
                <div key={g.id} style={{
                  background: g.is_blacklisted ? 'rgba(15,18,30,0.5)' : 'linear-gradient(135deg, #101624 0%, #0d1220 100%)',
                  borderRadius: 12, padding: '14px 18px',
                  border: `1px solid ${g.is_blacklisted ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)'}`,
                  opacity: g.is_blacklisted ? 0.55 : 1,
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
                      {g.member_count > 0 && (
                        <span style={{ fontSize: 11, color: '#475569' }}>{g.member_count} uye</span>
                      )}
                      {g.username && (
                        <span style={{ fontSize: 11, color: '#475569' }}>@{g.username}</span>
                      )}
                      {g.is_admin && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 600 }}>
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
