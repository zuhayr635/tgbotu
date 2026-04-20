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
      minHeight: '100vh', background: '#0f1117', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: '#1a1d2e', borderRadius: 16, padding: 40,
        width: '100%', maxWidth: 380, border: '1px solid #2d3150'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40 }}>📡</div>
          <h1 style={{ color: '#5b6ef5', margin: '8px 0 4px', fontSize: 22 }}>TG Panel</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Telegram Broadcast Yönetimi</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>{t('login.username')}</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              style={inputStyle} type="text" required autoFocus />
          </div>
          <div>
            <label style={labelStyle}>{t('login.password')}</label>
            <input value={password} onChange={e => setPassword(e.target.value)}
              style={inputStyle} type="password" required />
          </div>
          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? '...' : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6 }
const inputStyle = {
  width: '100%', background: '#0f1117', border: '1px solid #2d3150',
  borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 14,
  outline: 'none', boxSizing: 'border-box'
}
const primaryBtn = {
  background: '#5b6ef5', color: '#fff', border: 'none', borderRadius: 8,
  padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8
}
