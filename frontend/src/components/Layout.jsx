import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const ICONS = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  broadcast: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.09 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.35 7.66a16 16 0 006 6l.96-.96a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  groups: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  schedules: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  templates: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  history: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
}

export default function Layout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: ICONS.dashboard },
    { to: '/broadcast/new', label: t('nav.newBroadcast'), icon: ICONS.broadcast },
    { to: '/groups', label: t('nav.groups'), icon: ICONS.groups },
    { to: '/schedules', label: t('nav.schedules'), icon: ICONS.schedules },
    { to: '/calendar', label: 'Takvim', icon: ICONS.calendar },
    { to: '/templates', label: 'Sablonlar', icon: ICONS.templates },
    { to: '/history', label: t('nav.history'), icon: ICONS.history },
    { to: '/settings', label: t('nav.settings'), icon: ICONS.settings },
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070b18', color: '#f1f5f9', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <nav style={{
        width: 240,
        background: 'linear-gradient(180deg, #0c1022 0%, #0a0e1e 100%)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.09 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.35 7.66a16 16 0 006 6l.96-.96a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' }}>TG Panel</div>
              <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 500, letterSpacing: '0.5px' }}>BROADCAST</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '10px 10px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                marginBottom: 2,
                textDecoration: 'none',
                color: isActive ? '#a5b4fc' : '#64748b',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
                position: 'relative',
                border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
              })}
            >
              <span style={{ opacity: 1, flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ padding: '12px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={toggleLang} style={footerBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            {i18n.language === 'tr' ? 'English' : 'Turkce'}
          </button>
          <button onClick={logout} style={{ ...footerBtn, color: '#f87171', marginTop: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Cikis
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, marginLeft: 240, padding: '32px 36px', minHeight: '100vh', background: '#070b18' }}>
        <Outlet />
      </main>
    </div>
  )
}

const footerBtn = {
  display: 'flex', alignItems: 'center', gap: 8,
  width: '100%', background: 'transparent',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8, padding: '8px 12px',
  color: '#64748b', cursor: 'pointer', fontSize: 12,
  fontWeight: 500, transition: 'all 0.15s',
}
