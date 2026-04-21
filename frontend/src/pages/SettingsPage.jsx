import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getSettings, updateSettings, testBotToken, startBot, stopBot, changePassword } from '../lib/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const [s, setS] = useState(null)
  const [tokenVisible, setTokenVisible] = useState(false)
  const [token, setToken] = useState('')
  const [notifChatId, setNotifChatId] = useState('')
  const [minDelay, setMinDelay] = useState(3)
  const [maxDelay, setMaxDelay] = useState(8)
  const [maxRetries, setMaxRetries] = useState(2)
  const [warnMb, setWarnMb] = useState(100)
  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [testing, setTesting] = useState(false)

  const load = async () => {
    const res = await getSettings()
    const d = res.data
    setS(d)
    setNotifChatId(d.notification_chat_id || '')
    setMinDelay(d.min_delay_seconds)
    setMaxDelay(d.max_delay_seconds)
    setMaxRetries(d.max_retries)
    setWarnMb(d.storage_warn_mb)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    const data = { notification_chat_id: notifChatId, min_delay_seconds: minDelay, max_delay_seconds: maxDelay, max_retries: maxRetries, storage_warn_mb: warnMb }
    if (token) data.bot_token = token
    await updateSettings(data)
    toast.success(t('common.success'))
    setToken('')
    load()
  }

  const handleTest = async () => {
    if (token) await updateSettings({ bot_token: token })
    setTesting(true)
    try {
      const res = await testBotToken()
      if (res.data.success) toast.success(`Baglanti basarili — @${res.data.username}`)
      else toast.error(res.data.message)
    } finally { setTesting(false) }
  }

  const handleBotToggle = async () => {
    if (s?.bot_is_running) {
      await stopBot()
      toast.success('Bot durduruldu')
    } else {
      const res = await startBot()
      if (res.data.success) toast.success(`Bot baslatildi — @${res.data.username}`)
      else toast.error(res.data.message)
    }
    load()
  }

  const handleChangePassword = async () => {
    try {
      await changePassword({ current_password: curPass, new_password: newPass })
      toast.success('Sifre degistirildi')
      setCurPass(''); setNewPass('')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata')
    }
  }

  if (!s) return <div style={{ color: '#475569', padding: 40 }}>Yukleniyor...</div>

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={pageTitle}>{t('settings.title')}</h1>
        <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Bot, bildirim ve sistem ayarlari</p>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>Bot</h2>
        <label style={labelStyle}>{t('settings.botToken')}</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type={tokenVisible ? 'text' : 'password'}
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder={s.bot_token_set ? '(degistirmek icin yaz)' : t('settings.botTokenPlaceholder')}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={() => setTokenVisible(!tokenVisible)} style={secBtn}>{tokenVisible ? 'Gizle' : 'Goster'}</button>
          <button onClick={handleTest} disabled={testing} style={secBtn}>{testing ? '...' : t('settings.testToken')}</button>
        </div>

        {s.bot_username && <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>@{s.bot_username}</div>}

        <button onClick={handleBotToggle} style={{
          background: s.bot_is_running ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          color: s.bot_is_running ? '#f87171' : '#4ade80',
          border: `1px solid ${s.bot_is_running ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
          borderRadius: 9, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {s.bot_is_running ? t('settings.stopBot') : t('settings.startBot')}
        </button>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>{t('settings.notificationChatId')}</h2>
        <input value={notifChatId} onChange={e => setNotifChatId(e.target.value)}
          placeholder="123456789" style={{ ...inputStyle, width: '100%' }} />
        <p style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>{t('settings.notificationChatIdHelp')}</p>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>Gonderim Ayarlari</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>{t('settings.minDelay')}</label>
            <input type="number" value={minDelay} onChange={e => setMinDelay(+e.target.value)} min={1} style={{ ...inputStyle, width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>{t('settings.maxDelay')}</label>
            <input type="number" value={maxDelay} onChange={e => setMaxDelay(+e.target.value)} min={1} style={{ ...inputStyle, width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>{t('settings.maxRetries')}</label>
            <input type="number" value={maxRetries} onChange={e => setMaxRetries(+e.target.value)} min={0} max={5} style={{ ...inputStyle, width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>{t('settings.storageWarnMb')}</label>
            <input type="number" value={warnMb} onChange={e => setWarnMb(+e.target.value)} min={10} style={{ ...inputStyle, width: '100%' }} />
          </div>
        </div>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>{t('settings.language')}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['tr', 'en'].map(lang => (
            <button key={lang} onClick={() => { i18n.changeLanguage(lang); localStorage.setItem('lang', lang) }}
              style={{ background: i18n.language === lang ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', color: i18n.language === lang ? '#a5b4fc' : '#64748b', border: i18n.language === lang ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '8px 22px', cursor: 'pointer', fontWeight: i18n.language === lang ? 700 : 400, fontSize: 13 }}>
              {lang === 'tr' ? 'Turkce' : 'English'}
            </button>
          ))}
        </div>
      </div>

      <div style={card}>
        <h2 style={cardTitle}>{t('settings.changePassword')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="password" value={curPass} onChange={e => setCurPass(e.target.value)} placeholder={t('settings.currentPassword')} style={{ ...inputStyle, width: '100%' }} />
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder={t('settings.newPassword')} style={{ ...inputStyle, width: '100%' }} />
          <button onClick={handleChangePassword} style={secBtn}>{t('settings.changePassword')}</button>
        </div>
      </div>

      <button onClick={handleSave} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
        {t('settings.save')}
      </button>
    </div>
  )
}

const pageTitle = { color: '#f1f5f9', fontSize: 26, fontWeight: 700, marginBottom: 8, marginTop: 0, letterSpacing: '-0.5px' }
const card = { background: 'linear-gradient(135deg, #101624 0%, #0d1220 100%)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }
const cardTitle = { color: '#94a3b8', fontSize: 11, fontWeight: 700, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.8px' }
const labelStyle = { display: 'block', color: '#64748b', fontSize: 12, marginBottom: 6, fontWeight: 500 }
const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '10px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
const secBtn = { background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }
