import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '../lib/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await login(username, password)
      localStorage.setItem('token', res.data.access_token)
      navigate('/dashboard')
    } catch {
      toast.error(t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, #070b18 60%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Background dots */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      <div style={{
        background: 'linear-gradient(135deg, #0f1525 0%, #0c1020 100%)',
        borderRadius: 20,
        padding: '44px 40px',
        width: '100%',
        maxWidth: 400,
        border: '1px solid rgba(99,102,241,0.15)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.09 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.35 7.66a16 16 0 006 6l.96-.96a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          </div>
          <h1 style={{ color: '#f1f5f9', margin: '0 0 6px', fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>TG Panel</h1>
          <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>Telegram Broadcast Yonetimi</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 12, marginBottom: 7, fontWeight: 500 }}>
              {t('login.username')}
            </label>
            <div style={{ position: 'relative' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={inputStyle}
                type="text"
                required
                autoFocus
                placeholder="admin"
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 12, marginBottom: 7, fontWeight: 500 }}>
              {t('login.password')}
            </label>
            <div style={{ position: 'relative' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                type={showPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0,
              }}>
                {showPass
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{
            background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '12px', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            marginTop: 8, boxShadow: loading ? 'none' : '0 4px 18px rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}>
            {loading
              ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Giris yapiliyor...</>
              : t('login.submit')
            }
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, padding: '11px 12px 11px 38px',
  color: '#f1f5f9', fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}
