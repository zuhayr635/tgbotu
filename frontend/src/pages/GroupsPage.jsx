import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getGroups, updateGroup } from '../lib/api'
import toast from 'react-hot-toast'

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

  const typeLabel = { group: t('groups.type.group'), supergroup: t('groups.type.supergroup'), channel: t('groups.type.channel') }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={pageTitle}>{t('groups.title')}</h1>
        <button onClick={load} style={secBtn}>{t('groups.refresh')}</button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('groups.search')}
        style={{ ...inputStyle, marginBottom: 16, width: 280 }}
      />

      {filtered.length === 0
        ? <p style={{ color: '#64748b' }}>{t('groups.noGroups')}</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(g => (
              <div key={g.id} style={{
                background: '#1a1d2e', borderRadius: 12, padding: '14px 18px',
                border: `1px solid ${g.is_blacklisted ? '#3d1a1a' : '#2d3150'}`,
                opacity: g.is_blacklisted ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{g.title}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>
                    {typeLabel[g.chat_type]}
                    {g.member_count ? ` — ${g.member_count} ${t('groups.members')}` : ''}
                    {g.username ? ` — @${g.username}` : ''}
                  </div>
                  {g.chat_type === 'channel' && !g.is_admin && (
                    <div style={{ color: '#f59e0b', fontSize: 11, marginTop: 2 }}>
                      {t('groups.adminRequired')}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    value={editTag[g.id] !== undefined ? editTag[g.id] : (g.tag || '')}
                    onChange={e => setEditTag({ ...editTag, [g.id]: e.target.value })}
                    placeholder={t('groups.addTag')}
                    style={{ ...inputStyle, width: 110, padding: '6px 10px', fontSize: 12 }}
                  />
                  <button onClick={() => handleTagSave(g.id)} style={smallBtn('#2d3150', '#e2e8f0')}>Kaydet</button>
                </div>

                <button
                  onClick={() => handleBlacklist(g.id, g.is_blacklisted)}
                  style={smallBtn(g.is_blacklisted ? '#1a3d1a' : '#3d1a1a', g.is_blacklisted ? '#4ade80' : '#f87171')}
                >
                  {g.is_blacklisted ? 'Aktive Et' : 'Devre Disi'}
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

const pageTitle = { color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: 0 }
const inputStyle = { background: '#0f1117', border: '1px solid #2d3150', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
const secBtn = { background: '#2d3150', color: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }
const smallBtn = (bg, color) => ({ background: bg, color, border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' })
