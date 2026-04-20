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
      if (res.data.success) toast.success(`✅ @${res.data.username}`)
      else toast.error(res.data.message)
    } finally { setTesting(false) }
  }

  const handleBotToggle = async () => {
    if (s?.bot_is_running) {
      await stopBot()
      toast.success('Bot durduruldu')
    } else {
      const res = await startBot()
      if (res.data.success) toast.success(`Bot başlatıldı: @${res.data.username}`)
      else toast.error(res.data.message)
    }
    load()
  }

  const handleChangePassword = async () => {
    try {
      await changePassword({ current_password: curPass, new_password: newPass })
      toast.success('Şifre değiştirildi')
      setCurPass(''); setNewPass('')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Hata')
    }
  }

  if (!s) return <div style={{ color: '#64748b' }}>{t('common.loading')}</div>

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={pageTitle}>{t('settings.title')}</h1>

      {/* Bot Token */}
      <div style={card}>
        <h2 style={cardTitle}>🤖 Bot</h2>
        <label style={labelStyle}>{t('settings.botToken')}</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type={tokenVisible ? 'text' : 'password'}
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder={s.bot_token_set ? '••••••••••••• (değiştirmek için yaz)' : t('settings.botTokenPlaceholder')}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={() => setTokenVisible(!tokenVisible)} style={secBtn}>👁</button>
          <button onClick={handleTest} disabled={testing} style={secBtn}>{testing ? '...' : t('settings.testToken')}</button>
        </div>

        {s.bot_username && <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>@{s.bot_username}</div>}

        <button onClick={handleBotToggle} style={{
          background: s.bot_is_running ? '#3d1a1a' : '#1a3d1a',
          color: s.bot_is_running ? '#f87171' : '#4ade80',
          border: `1px solid ${s.bot_is_running ? '#f87171' : '#4ade80'}`,
          borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600
        }}>
          {s.bot_is_running ? `⏹ ${t('settings.stopBot')}` : `▶️ ${t('settings.startBot')}`}
        </button>
      </div>

      {/* Bildirim */}
      <div style={card}>
        <h2 style={cardTitle}>🔔 {t('settings.notificationChatId')}</h2>
        <input value={notifChatId} onChange={e => setNotifChatId(e.target.value)}
          placeholder="123456789" style={{ ...inputStyle, width: '100%' }} />
        <p style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>{t('settings.notificationChatIdHelp')}</p>
      </div>

      {/* Gecikme & Retry */}
      <div style={card}>
        <h2 style={cardTitle}>⚡ Gönderim Ayarları</h2>
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

      {/* Dil */}
      <div style={card}>
        <h2 style={cardTitle}>🌐 {t('settings.language')}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['tr', 'en'].map(lang => (
            <button key={lang} onClick={() => { i18n.changeLanguage(lang); localStorage.setItem('lang', lang) }}
              style={{ background: i18n.language === lang ? '#5b6ef5' : '#2d3150', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 20px', cursor: 'pointer', fontWeight: i18n.language === lang ? 700 : 400 }}>
              {lang === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
            </button>
          ))}
        </div>
      </div>

      {/* Şifre */}
      <div style={card}>
        <h2 style={cardTitle}>🔒 {t('settings.changePassword')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="password" value={curPass} onChange={e => setCurPass(e.target.value)} placeholder={t('settings.currentPassword')} style={{ ...inputStyle, width: '100%' }} />
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder={t('settings.newPassword')} style={{ ...inputStyle, width: '100%' }} />
          <button onClick={handleChangePassword} style={secBtn}>{t('settings.changePassword')}</button>
        </div>
      </div>

      <button onClick={handleSave} style={{ background: '#5b6ef5', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
        💾 {t('settings.save')}
      </button>
    </div>
  )
}

const pageTitle = { color: '#e2e8f0', fontSize: 22, fontWeight: 700, marginBottom: 24, marginTop: 0 }
const card = { background: '#1a1d2e', borderRadius: 12, padding: 20, border: '1px solid #2d3150', marginBottom: 16 }
const cardTitle = { color: '#e2e8f0', fontSize: 15, fontWeight: 600, margin: '0 0 14px' }
const labelStyle = { display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6 }
const inputStyle = { background: '#0f1117', border: '1px solid #2d3150', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
const secBtn = { background: '#2d3150', color: '#e2e8f0', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }
