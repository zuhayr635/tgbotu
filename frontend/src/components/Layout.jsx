import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Layout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: '📊' },
    { to: '/broadcast/new', label: t('nav.newBroadcast'), icon: '📢' },
    { to: '/groups', label: t('nav.groups'), icon: '👥' },
    { to: '/schedules', label: t('nav.schedules'), icon: '⏰' },
    { to: '/history', label: t('nav.history'), icon: '📋' },
    { to: '/settings', label: t('nav.settings'), icon: '⚙️' },
  ]

  const toggleLang = () => {
    const next = i18n.language === 'tr' ? 'en' : 'tr'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <nav style={{
        width: 220, background: '#1a1d2e', padding: '24px 0',
        display: 'flex', flexDirection: 'column', borderRight: '1px solid #2d3150',
        position: 'fixed', height: '100vh', overflowY: 'auto'
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2d3150' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#5b6ef5' }}>📡 TG Panel</div>
        </div>

        <div style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 20px', textDecoration: 'none',
                color: isActive ? '#5b6ef5' : '#94a3b8',
                background: isActive ? 'rgba(91,110,245,0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid #5b6ef5' : '3px solid transparent',
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #2d3150', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={toggleLang} style={btnStyle('#2d3150', '#e2e8f0')}>
            🌐 {i18n.language === 'tr' ? 'English' : 'Türkçe'}
          </button>
          <button onClick={logout} style={btnStyle('#3d1a1a', '#f87171')}>
            🚪 Çıkış
          </button>
        </div>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 220, padding: 28, minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
}

const btnStyle = (bg, color) => ({
  background: bg, color, border: 'none', borderRadius: 8,
  padding: '8px 12px', cursor: 'pointer', fontSize: 13,
  textAlign: 'left', width: '100%',
})
